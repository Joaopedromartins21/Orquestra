-- Add customer_id to orders table
ALTER TABLE orders
ADD COLUMN customer_id uuid REFERENCES customers(id);

-- Update existing orders to link with customers based on customer_name if possible
UPDATE orders o
SET customer_id = c.id
FROM customers c
WHERE o.customer_name = c.name;

-- Add index for better query performance
CREATE INDEX idx_orders_customer_id ON orders(customer_id);