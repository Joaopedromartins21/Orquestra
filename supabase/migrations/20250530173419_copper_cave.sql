CREATE TABLE costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL CHECK (amount >= 0),
  category text NOT NULL CHECK (category IN ('Diesel', 'Alimentacao', 'Contas', 'Pneu', 'Outros')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Costs can be managed by managers"
  ON costs
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