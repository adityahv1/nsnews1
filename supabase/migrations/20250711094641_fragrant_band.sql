/*
  # Fix Poll RLS Policy

  1. Security Updates
    - Update RLS policy for polls table to allow INSERT for any user (not just authenticated)
    - This allows the application to create the initial poll automatically
*/

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Only authenticated users can create polls" ON polls;

-- Create a more permissive policy that allows anyone to create polls
-- This is needed for the application to auto-create the initial poll
CREATE POLICY "Anyone can create polls"
  ON polls
  FOR INSERT
  TO public
  WITH CHECK (true);