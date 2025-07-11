/*
  # Fix User Registration RLS Policy

  1. Security Changes
    - Drop existing restrictive INSERT policy that blocks user registration
    - Create new policy that allows authenticated users to register their profile
    - Maintain security by ensuring users can only create their own profile

  The issue is that during signup, the user is authenticated but their profile doesn't exist yet,
  creating a chicken-and-egg problem with the current RLS policy.
*/

-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Allow user registration" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Authenticated users can create profiles" ON users;

-- Create a new policy that allows authenticated users to register
CREATE POLICY "Enable user registration during signup"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Also ensure we have proper SELECT policy for profile lookups
DROP POLICY IF EXISTS "Anyone can read user profiles" ON users;
CREATE POLICY "Anyone can read user profiles"
  ON users
  FOR SELECT
  TO public
  USING (true);

-- Ensure UPDATE policy exists for profile updates
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
CREATE POLICY "Users can update their own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);