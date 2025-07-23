-- Add balance column to customers table
ALTER TABLE customers
ADD COLUMN balance numeric DEFAULT 0;

-- Create customer_transactions table
CREATE TABLE customer_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) NOT NULL,
  type text NOT NULL CHECK (type IN ('credit', 'debit')),
  amount numeric NOT NULL CHECK (amount > 0),
  description text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE customer_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Customer transactions are viewable by authenticated users"
  ON customer_transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Customer transactions can be managed by managers"
  ON customer_transactions FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'manager'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'manager'
  ));

-- Create function to update customer balance
CREATE OR REPLACE FUNCTION update_customer_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.type = 'credit' THEN
      UPDATE customers
      SET balance = balance + NEW.amount
      WHERE id = NEW.customer_id;
    ELSE
      UPDATE customers
      SET balance = balance - NEW.amount
      WHERE id = NEW.customer_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_balance_on_transaction
  AFTER INSERT ON customer_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_balance();