-- Add cascade delete to order_items
ALTER TABLE order_items
DROP CONSTRAINT IF EXISTS order_items_order_id_fkey,
ADD CONSTRAINT order_items_order_id_fkey
  FOREIGN KEY (order_id)
  REFERENCES orders(id)
  ON DELETE CASCADE;

-- Add cascade delete to returns
ALTER TABLE returns
DROP CONSTRAINT IF EXISTS returns_order_id_fkey,
ADD CONSTRAINT returns_order_id_fkey
  FOREIGN KEY (order_id)
  REFERENCES orders(id)
  ON DELETE CASCADE;

-- Add indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_driver_id ON orders(driver_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);

-- Clean up unused columns and optimize storage
ALTER TABLE orders
DROP COLUMN IF EXISTS trip_cost_description;