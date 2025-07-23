/*
  # Fix Products Table RLS Policies

  1. Changes
    - Drop existing products policies
    - Create new policies with correct role checking
    
  2. Security
    - Ensure managers can perform all operations on products
    - Maintain read-only access for authenticated users
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Products are viewable by authenticated users" ON products;
DROP POLICY IF EXISTS "Products can be managed by managers" ON products;

-- Create new policies with correct role checking
CREATE POLICY "Products are viewable by authenticated users"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Products can be managed by managers"
  ON products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'manager'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'manager'
    )
  );