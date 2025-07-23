CREATE TABLE vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plate text NOT NULL UNIQUE,
  model text NOT NULL,
  brand text NOT NULL,
  year integer NOT NULL,
  status text NOT NULL CHECK (status IN ('active', 'maintenance', 'inactive')),
  last_maintenance date,
  next_maintenance date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vehicles are viewable by authenticated users"
  ON vehicles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Vehicles can be managed by managers"
  ON vehicles FOR ALL
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