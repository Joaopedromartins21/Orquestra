/*
  # Initial Schema Setup
  
  1. New Tables
    - profiles: User profiles with role management
    - products: Inventory management
    - orders: Customer orders
    - order_items: Items within orders
  
  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access control
    - Create trigger for new user profile creation
*/

-- Create profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('manager', 'driver')),
  phone text,
  available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create products table
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric NOT NULL CHECK (price >= 0),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_address text NOT NULL,
  customer_phone text,
  driver_id uuid REFERENCES profiles(id),
  status text NOT NULL CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed')),
  notes text,
  total_amount numeric NOT NULL CHECK (total_amount >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create order_items table
CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  price numeric NOT NULL CHECK (price >= 0),
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Profiles are viewable by authenticated users"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Profiles can be updated by the owner"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for products
CREATE POLICY "Products are viewable by authenticated users"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Products can be managed by managers"
  ON products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND role = 'manager'
    )
  );

-- Create policies for orders
CREATE POLICY "Orders are viewable by authenticated users"
  ON orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Orders can be created by managers"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND role = 'manager'
    )
  );

CREATE POLICY "Orders can be updated by managers or assigned drivers"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND (
        role = 'manager'
        OR (role = 'driver' AND id = orders.driver_id)
      )
    )
  );

-- Create policies for order_items
CREATE POLICY "Order items are viewable by authenticated users"
  ON order_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Order items can be managed by managers"
  ON order_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND role = 'manager'
    )
  );

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, role)
  VALUES (new.id, new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'role');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();