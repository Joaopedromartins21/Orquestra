-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Cash register can be managed by managers" ON cash_register;

-- Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS cash_register (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  opening_balance numeric NOT NULL DEFAULT 0 CHECK (opening_balance >= 0),
  closing_balance numeric CHECK (closing_balance >= 0),
  total_cash numeric NOT NULL DEFAULT 0,
  total_pix numeric NOT NULL DEFAULT 0,
  deposits jsonb DEFAULT '[]'::jsonb,
  withdrawals jsonb DEFAULT '[]'::jsonb,
  notes text,
  status text NOT NULL CHECK (status IN ('open', 'closed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS if not already enabled
ALTER TABLE cash_register ENABLE ROW LEVEL SECURITY;

-- Create or replace the policy
CREATE POLICY "Cash register can be managed by managers"
  ON cash_register
  FOR ALL 
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'manager'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'manager'
  ));