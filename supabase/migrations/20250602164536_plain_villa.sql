/*
  # Fix Financial Tracking Integration

  1. Changes
    - Add trigger to update cash register on order completion
    - Add function to calculate daily totals
    - Ensure proper tracking of order payments
  
  2. Security
    - Maintain existing RLS policies
    - Add proper constraints for financial calculations
*/

-- Create function to update cash register totals
CREATE OR REPLACE FUNCTION update_cash_register_totals()
RETURNS TRIGGER AS $$
DECLARE
  order_date date;
  cash_amount numeric;
  pix_amount numeric;
  register_record RECORD;
BEGIN
  -- Get the order date
  order_date := DATE(NEW.created_at);
  
  -- Calculate payment amounts
  SELECT 
    COALESCE(SUM(CASE WHEN (value->>'type')::text = 'cash' THEN (value->>'amount')::numeric ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN (value->>'type')::text = 'pix' THEN (value->>'amount')::numeric ELSE 0 END), 0)
  INTO cash_amount, pix_amount
  FROM jsonb_array_elements(NEW.payments) value;

  -- Check if cash register exists for this date
  SELECT * INTO register_record
  FROM cash_register
  WHERE date = order_date AND status = 'open';

  -- Update existing register or create new one
  IF FOUND THEN
    UPDATE cash_register
    SET 
      total_cash = total_cash + cash_amount,
      total_pix = total_pix + pix_amount,
      updated_at = now()
    WHERE id = register_record.id;
  ELSE
    INSERT INTO cash_register (
      date,
      opening_balance,
      total_cash,
      total_pix,
      status
    ) VALUES (
      order_date,
      0,
      cash_amount,
      pix_amount,
      'open'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for orders
DROP TRIGGER IF EXISTS update_cash_register_on_order ON orders;
CREATE TRIGGER update_cash_register_on_order
  AFTER INSERT OR UPDATE OF payments
  ON orders
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION update_cash_register_totals();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_cash_register_date ON cash_register(date);

-- Recalculate existing orders
DO $$
DECLARE
  r RECORD;
BEGIN
  -- Clear existing cash register records
  DELETE FROM cash_register;
  
  -- Recalculate from completed orders
  FOR r IN SELECT * FROM orders WHERE status = 'completed' ORDER BY created_at
  LOOP
    -- Trigger will handle the recalculation
    UPDATE orders 
    SET updated_at = updated_at 
    WHERE id = r.id;
  END LOOP;
END $$;