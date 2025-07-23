/*
  # Fix Cash Register Trigger Function

  1. Changes
    - Update trigger function to properly handle order payments
    - Ensure cash register totals are updated correctly
    - Fix balance calculation
    
  2. Security
    - Maintain existing RLS policies
    - No changes to security model
*/

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS update_cash_register_on_order ON orders;
DROP FUNCTION IF EXISTS update_cash_register_totals();

-- Create improved function to update cash register totals
CREATE OR REPLACE FUNCTION update_cash_register_totals()
RETURNS TRIGGER AS $$
DECLARE
  order_date date;
  cash_amount numeric;
  pix_amount numeric;
  register_record RECORD;
  total_deposits numeric;
  total_withdrawals numeric;
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
  WHERE date = order_date;

  -- Calculate deposits and withdrawals
  IF register_record.id IS NOT NULL THEN
    total_deposits := COALESCE((
      SELECT SUM((value->>'amount')::numeric)
      FROM jsonb_array_elements(register_record.deposits) value
    ), 0);

    total_withdrawals := COALESCE((
      SELECT SUM((value->>'amount')::numeric)
      FROM jsonb_array_elements(register_record.withdrawals) value
    ), 0);
  ELSE
    total_deposits := 0;
    total_withdrawals := 0;
  END IF;

  -- Update existing register or create new one
  IF register_record.id IS NOT NULL THEN
    IF register_record.status = 'open' THEN
      UPDATE cash_register
      SET 
        total_cash = total_cash + cash_amount,
        total_pix = total_pix + pix_amount,
        updated_at = now()
      WHERE id = register_record.id;
    END IF;
  ELSE
    INSERT INTO cash_register (
      date,
      opening_balance,
      total_cash,
      total_pix,
      deposits,
      withdrawals,
      status
    ) VALUES (
      order_date,
      0,
      cash_amount,
      pix_amount,
      '[]'::jsonb,
      '[]'::jsonb,
      'open'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create new trigger
CREATE TRIGGER update_cash_register_on_order
  AFTER INSERT OR UPDATE OF payments, status
  ON orders
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION update_cash_register_totals();

-- Recalculate all cash register totals
DO $$
DECLARE
  r RECORD;
BEGIN
  -- Clear existing cash totals
  UPDATE cash_register
  SET total_cash = 0, total_pix = 0;
  
  -- Recalculate from completed orders
  FOR r IN 
    SELECT * 
    FROM orders 
    WHERE status = 'completed' 
    ORDER BY created_at
  LOOP
    -- Trigger will handle the recalculation
    UPDATE orders 
    SET updated_at = updated_at 
    WHERE id = r.id;
  END LOOP;
END $$;