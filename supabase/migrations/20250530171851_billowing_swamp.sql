CREATE TABLE cash_register (
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

ALTER TABLE cash_register ENABLE ROW LEVEL SECURITY;

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