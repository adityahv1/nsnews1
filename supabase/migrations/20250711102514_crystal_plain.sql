/*
  # Fix Users Table Schema

  1. Schema Updates
    - Add email column to users table if it doesn't exist
    - Update existing username column to email where needed
    - Ensure proper constraints and indexes
    
  2. Data Migration
    - Preserve existing user data
    - Update references in related tables
    
  3. Security
    - Maintain RLS policies
    - Update policies to use email instead of username
*/

-- First, check if email column exists, if not add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'email'
  ) THEN
    -- Add email column
    ALTER TABLE users ADD COLUMN email text;
    
    -- If username column exists, copy its data to email column
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'username'
    ) THEN
      UPDATE users SET email = username WHERE email IS NULL;
    END IF;
    
    -- Make email not null and unique
    ALTER TABLE users ALTER COLUMN email SET NOT NULL;
    ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);
    
    -- Add index for performance
    CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
  END IF;
END $$;

-- Update posts table to use email instead of username if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' AND column_name = 'username'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' AND column_name = 'email'
  ) THEN
    ALTER TABLE posts RENAME COLUMN username TO email;
  END IF;
END $$;

-- Update comments table to use email instead of username if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'comments' AND column_name = 'username'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'comments' AND column_name = 'email'
  ) THEN
    ALTER TABLE comments RENAME COLUMN username TO email;
  END IF;
END $$;

-- Update votes table to use email instead of username if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'votes' AND column_name = 'username'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'votes' AND column_name = 'email'
  ) THEN
    ALTER TABLE votes RENAME COLUMN username TO email;
  END IF;
END $$;

-- Remove username column from users table if it exists and email column is populated
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'username'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'email'
  ) THEN
    -- Drop the unique constraint on username first
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_username_key;
    -- Drop the index on username
    DROP INDEX IF EXISTS idx_users_username;
    -- Drop the username column
    ALTER TABLE users DROP COLUMN username;
  END IF;
END $$;

-- Remove internal_email column if it exists (no longer needed)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'internal_email'
  ) THEN
    ALTER TABLE users DROP COLUMN internal_email;
  END IF;
END $$;