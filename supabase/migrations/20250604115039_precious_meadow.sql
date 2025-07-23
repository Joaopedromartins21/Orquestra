/*
  # Update Order Items Schema

  1. Changes
    - Add selling_price column to order_items table to allow custom prices per order
    - Update existing constraints and policies
    
  2. Security
    - Maintain existing RLS policies
    - Add proper constraints for price validation
*/

-- First, drop the existing price column constraint
ALTER TABLE order_items
DROP CONSTRAINT IF EXISTS order_items_price_check;

-- Rename price column to selling_price for consistency
ALTER TABLE order_items
RENAME COLUMN price TO selling_price;

-- Add new constraint for selling_price
ALTER TABLE order_items
ADD CONSTRAINT order_items_selling_price_check CHECK (selling_price >= 0);