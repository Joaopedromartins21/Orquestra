-- Add payments column to orders table
ALTER TABLE orders
ADD COLUMN payments JSONB DEFAULT '[]'::jsonb;