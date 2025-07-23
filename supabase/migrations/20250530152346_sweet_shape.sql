-- First remove the generated column that depends on trip_cost
ALTER TABLE orders
DROP COLUMN IF EXISTS net_amount;

-- Now we can safely drop the old column
ALTER TABLE orders
DROP COLUMN IF EXISTS trip_cost;

-- Add new JSONB column for trip costs
ALTER TABLE orders
ADD COLUMN trip_costs JSONB DEFAULT '[]'::jsonb;

-- Create a function to calculate total trip costs
CREATE OR REPLACE FUNCTION calculate_total_trip_costs(costs JSONB)
RETURNS numeric AS $$
DECLARE
  total numeric := 0;
  cost_item JSONB;
BEGIN
  IF costs IS NULL OR jsonb_array_length(costs) = 0 THEN
    RETURN 0;
  END IF;

  FOR cost_item IN SELECT * FROM jsonb_array_elements(costs)
  LOOP
    total := total + (cost_item->>'amount')::numeric;
  END LOOP;

  RETURN total;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add the new generated column that uses the function
ALTER TABLE orders
ADD COLUMN net_amount numeric GENERATED ALWAYS AS (
  total_amount - calculate_total_trip_costs(trip_costs)
) STORED;