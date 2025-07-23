-- Create returns table
CREATE TABLE returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) NOT NULL,
  reason text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  refund_amount numeric NOT NULL CHECK (refund_amount >= 0),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Returns are viewable by authenticated users"
  ON returns FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Returns can be managed by managers"
  ON returns FOR ALL
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