-- Add cost_price column to products table
ALTER TABLE products 
ADD COLUMN cost_price numeric NOT NULL DEFAULT 0 CHECK (cost_price >= 0);

-- Rename existing price column to selling_price for clarity
ALTER TABLE products 
RENAME COLUMN price TO selling_price;