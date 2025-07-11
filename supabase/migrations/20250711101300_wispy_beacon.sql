/*
  # Fix Users Table RLS Policy for Registration

  1. Security Changes
    - Drop the restrictive INSERT policy that prevents user registration
    - Add a new policy that allows users to insert their own profile during signup
    - Maintain security while enabling proper user registration flow

  2. Policy Details
    - Allow authenticated users to insert their own user profile
    - Ensure users can only create profiles for their own auth.uid()
*/

-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;

-- Create a new policy that allows user registration
CREATE POLICY "Allow user registration" 
  ON users 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = id);