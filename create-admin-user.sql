-- SQL script to create an admin user in Supabase
-- Run this in the Supabase SQL editor

-- Step 1: Create a new user in auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  is_super_admin,
  raw_app_meta_data,
  raw_user_meta_data
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  uuid_generate_v4(),
  'authenticated',
  'authenticated',
  'your-admin@example.com',
  crypt('YourStrongPassword123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  false,
  '{"provider": "email", "providers": ["email"], "role": "admin"}',
  '{"name": "Admin User"}'
)
ON CONFLICT (email) DO NOTHING;

-- Step 2: Get the user id that was just created
DO $$
DECLARE
  user_id UUID;
BEGIN
  -- Get the user ID
  SELECT id INTO user_id FROM auth.users WHERE email = 'your-admin@example.com';
  
  -- Make sure we have an ID
  IF user_id IS NOT NULL THEN
    -- Step 3: Update the profile to have admin role
    UPDATE public.profiles
    SET role = 'admin'
    WHERE id = user_id;
    
    -- Output success message (only visible in SQL query results)
    RAISE NOTICE 'Admin user created successfully with ID: %', user_id;
  ELSE
    RAISE EXCEPTION 'Failed to create admin user';
  END IF;
END $$; 