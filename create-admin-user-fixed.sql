
-- Proper SQL script to create admin user in Supabase
-- This creates the user through the auth system first, then updates the profile

-- First, let's create a function to safely create the admin user
CREATE OR REPLACE FUNCTION create_admin_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Try to find existing admin user
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = 'admin@smarttasker.ai'
  LIMIT 1;
  
  -- If user doesn't exist, we need to create it manually
  -- Note: In production, you should use Supabase Auth API or dashboard
  IF admin_user_id IS NULL THEN
    -- Generate a new UUID for the user
    admin_user_id := gen_random_uuid();
    
    -- Insert into auth.users (this is typically done by Supabase Auth API)
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
      raw_app_meta_data,
      raw_user_meta_data
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      admin_user_id,
      'authenticated',
      'authenticated',
      'admin@smarttasker.ai',
      crypt('2025@Aditya', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "System Administrator"}'
    );
    
    RAISE NOTICE 'Created new admin user with ID: %', admin_user_id;
  ELSE
    -- Update existing user's password
    UPDATE auth.users 
    SET 
      encrypted_password = crypt('2025@Aditya', gen_salt('bf')),
      updated_at = now(),
      raw_user_meta_data = '{"name": "System Administrator"}'
    WHERE id = admin_user_id;
    
    RAISE NOTICE 'Updated existing admin user with ID: %', admin_user_id;
  END IF;
  
  -- Ensure the profile exists with correct role
  INSERT INTO public.profiles (id, name, role, is_active)
  VALUES (admin_user_id, 'System Administrator', 'admin', true)
  ON CONFLICT (id) DO UPDATE SET
    name = 'System Administrator',
    role = 'admin',
    is_active = true,
    updated_at = now();
    
  RAISE NOTICE 'Admin profile setup completed for user ID: %', admin_user_id;
END;
$$;

-- Execute the function
SELECT create_admin_user();

-- Clean up the function
DROP FUNCTION create_admin_user();
