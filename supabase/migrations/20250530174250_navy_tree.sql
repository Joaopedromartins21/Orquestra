-- Create stock_movements table
CREATE TABLE stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('increase', 'decrease')),
  quantity integer NOT NULL CHECK (quantity > 0),
  reason text NOT NULL,
  timestamp timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Stock movements are viewable by authenticated users"
  ON stock_movements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Stock movements can be managed by managers"
  ON stock_movements FOR ALL
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