/*
  # Add internal email field to users table

  1. Changes
    - Add `internal_email` column to `users` table
    - This stores the hidden email used for Supabase auth
    - Users never see or interact with this email
    - Only used internally for authentication

  2. Security
    - Column is not exposed in any UI
    - Used only for backend authentication processes
*/

-- Add internal_email column to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'internal_email'
  ) THEN
    ALTER TABLE users ADD COLUMN internal_email text;
  END IF;
END $$;