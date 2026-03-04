-- ============================================
-- DineEasy — Custom Users Table for Bcrypt Auth
-- ============================================
-- This table stores users with bcrypt-hashed passwords
-- Used for custom authentication flow
-- Links to Supabase Auth users via auth_user_id for session management

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index on email for fast lookups (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON public.users(LOWER(email));

-- Create index on auth_user_id for linking
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own data
CREATE POLICY "Users can read own data"
  ON public.users FOR SELECT
  USING (
    auth.uid()::text = id::text OR 
    auth.uid() = auth_user_id
  );

-- Policy: Allow public registration (insert)
CREATE POLICY "Public can register"
  ON public.users FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Updated at trigger (ensure function exists)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
