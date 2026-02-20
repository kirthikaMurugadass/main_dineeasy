-- ============================================
-- RLS Verification Script
-- ============================================
-- Run this in Supabase SQL Editor to verify RLS is correctly configured

-- ─── Step 1: Check RLS is enabled on all tables ───
SELECT 
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('restaurants', 'menus', 'categories', 'menu_items', 'translations')
ORDER BY tablename;

-- ─── Step 2: List all policies for each table ───
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as "Operation",
  qual as "USING clause",
  with_check as "WITH CHECK clause"
FROM pg_policies
WHERE tablename IN ('restaurants', 'menus', 'categories', 'menu_items', 'translations')
ORDER BY tablename, cmd, policyname;

-- ─── Step 3: Count policies per table ───
SELECT 
  tablename,
  COUNT(*) as "Policy Count",
  STRING_AGG(cmd::text, ', ' ORDER BY cmd) as "Operations"
FROM pg_policies
WHERE tablename IN ('restaurants', 'menus', 'categories', 'menu_items', 'translations')
GROUP BY tablename
ORDER BY tablename;

-- ─── Step 4: Check storage bucket policies ───
SELECT 
  policyname,
  cmd as "Operation",
  roles,
  qual as "USING clause",
  with_check as "WITH CHECK clause"
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND (qual LIKE '%menu-items%' OR with_check LIKE '%menu-items%')
ORDER BY cmd, policyname;

-- ─── Expected Results ───
-- 
-- restaurants: Should have 5 policies (INSERT, SELECT for owners, SELECT for public, UPDATE, DELETE)
-- menus: Should have 5 policies (INSERT, SELECT for owners, SELECT for public, UPDATE, DELETE)
-- categories: Should have 5 policies (INSERT, SELECT for owners, SELECT for public, UPDATE, DELETE)
-- menu_items: Should have 5 policies (INSERT, SELECT for owners, SELECT for public, UPDATE, DELETE)
-- translations: Should have 5 policies (INSERT, SELECT for owners, SELECT for public, UPDATE, DELETE)
--
-- All tables should show "RLS Enabled" = true
