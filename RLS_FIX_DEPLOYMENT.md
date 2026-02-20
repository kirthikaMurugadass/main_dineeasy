# RLS Policies Fix for Production Deployment

## Problem
Restaurant creation fails in production (Vercel) with "setup failed" error, likely due to Row Level Security (RLS) policies blocking inserts.

## Solution
A comprehensive SQL migration has been created to fix all RLS policies for production-grade multi-tenant SaaS architecture.

## Files Created

1. **`supabase/migrations/20240206000000_fix_rls_policies.sql`** - Main migration file
2. **`supabase/verify_rls.sql`** - Verification script to check RLS status

## How to Apply the Fix

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file `supabase/migrations/20240206000000_fix_rls_policies.sql`
4. Copy the entire SQL script
5. Paste it into the SQL Editor
6. Click **Run** to execute

### Option 2: Using Supabase CLI

```bash
# If you have Supabase CLI installed
cd c:\DINE\DINEEASY
supabase db push
```

### Option 3: Manual Application

1. Connect to your production Supabase database
2. Run the SQL script from `supabase/migrations/20240206000000_fix_rls_policies.sql`
3. Verify using `supabase/verify_rls.sql`

## What the Migration Does

### 1. Drops Existing Policies
- Removes all old policies that might be causing conflicts
- Ensures a clean slate for new policies

### 2. Creates Separate Policies for Each Operation
Instead of using `FOR ALL`, creates explicit policies for:
- **INSERT** - Allows authenticated users to create their own data
- **SELECT** - Allows owners to read their data, public to read active data
- **UPDATE** - Allows owners to modify their data
- **DELETE** - Allows owners to delete their data

### 3. Policy Structure

#### Restaurants
- ✅ Authenticated users can INSERT restaurants with their own `owner_id`
- ✅ Owners can SELECT/UPDATE/DELETE their own restaurants
- ✅ Public (anon) can SELECT all restaurants (for public menu pages)

#### Menus
- ✅ Owners can INSERT menus for their restaurants
- ✅ Owners can SELECT/UPDATE/DELETE menus for their restaurants
- ✅ Public can SELECT only active menus

#### Categories
- ✅ Owners can INSERT categories for their menus
- ✅ Owners can SELECT/UPDATE/DELETE categories for their menus
- ✅ Public can SELECT only active categories

#### Menu Items
- ✅ Owners can INSERT menu items for their categories
- ✅ Owners can SELECT/UPDATE/DELETE menu items for their categories
- ✅ Public can SELECT only active menu items

#### Translations
- ✅ Owners can INSERT/UPDATE/DELETE translations for their entities
- ✅ Owners can SELECT translations for their entities
- ✅ Public can SELECT all translations (needed for public menu display)

### 4. Storage Policies
- ✅ Public can read menu item images
- ✅ Authenticated users can upload/update/delete menu item images

## Verification

After applying the migration, run the verification script:

1. Go to Supabase SQL Editor
2. Open `supabase/verify_rls.sql`
3. Run the script
4. Verify that:
   - All tables show `RLS Enabled = true`
   - Each table has 5 policies (INSERT, SELECT for owners, SELECT for public, UPDATE, DELETE)
   - Storage bucket has 4 policies for menu-items

## Expected Policy Count

- **restaurants**: 5 policies
- **menus**: 5 policies
- **categories**: 5 policies
- **menu_items**: 5 policies
- **translations**: 5 policies
- **storage.objects** (menu-items): 4 policies

## Testing After Fix

1. **Test Restaurant Creation**:
   - Sign up/login as a new user
   - Try creating a restaurant
   - Should succeed without "setup failed" error

2. **Test Menu Creation**:
   - After restaurant is created, menu should auto-create
   - Verify menu appears in admin panel

3. **Test Public Access**:
   - Visit public menu page
   - Should be able to view active menus, categories, and items
   - Should NOT be able to see inactive items

4. **Test Owner Access**:
   - As restaurant owner, should be able to:
     - Create/edit/delete categories
     - Create/edit/delete menu items
     - Update restaurant settings
     - View all data (active and inactive)

## Troubleshooting

### If restaurant creation still fails:

1. **Check Authentication**:
   ```sql
   -- Verify user is authenticated
   SELECT auth.uid();
   ```

2. **Check Policy Application**:
   ```sql
   -- List all policies
   SELECT * FROM pg_policies WHERE tablename = 'restaurants';
   ```

3. **Test Policy Manually**:
   ```sql
   -- As authenticated user, test insert
   SET ROLE authenticated;
   INSERT INTO restaurants (name, slug, owner_id, theme_config)
   VALUES ('Test', 'test', auth.uid(), '{}'::jsonb);
   ```

4. **Check Error Logs**:
   - Check Vercel function logs for detailed error messages
   - Check Supabase logs for RLS policy violations

### Common Issues

1. **"new row violates row-level security policy"**
   - Solution: Ensure INSERT policy exists and `WITH CHECK` clause is correct

2. **"permission denied for table restaurants"**
   - Solution: Ensure RLS is enabled and policies exist

3. **"relation does not exist"**
   - Solution: Ensure all migrations have been applied

## Security Notes

- ✅ RLS is **NOT disabled** - it's properly configured
- ✅ Users can only access their own data
- ✅ Public users can only read active/public data
- ✅ All policies use `auth.uid()` for authentication checks
- ✅ Policies use `EXISTS` subqueries for efficient checks

## Next Steps

1. Apply the migration to production
2. Verify policies using `verify_rls.sql`
3. Test restaurant creation
4. Monitor for any RLS-related errors
5. If issues persist, check Supabase logs for specific policy violations
