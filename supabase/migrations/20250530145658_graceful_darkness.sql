ALTER TABLE orders
ADD COLUMN trip_cost numeric DEFAULT 0 CHECK (trip_cost >= 0),
ADD COLUMN net_amount numeric GENERATED ALWAYS AS (total_amount - trip_cost) STORED;