/*
  # Add insert policy for profiles table

  1. Changes
    - Add RLS policy to allow new users to create their profile during registration
  
  2. Security
    - Allow INSERT operations for authenticated users creating their own profile
    - Ensures user_id matches the authenticated user's ID
*/

CREATE POLICY "Users can create their own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);