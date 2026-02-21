# Database Schema Merge Summary

## Overview
All SQL migration files have been merged into a single comprehensive file: **`complete_database_schema.sql`**

## Files Merged

The following migration files were merged in chronological order:

1. **`20240101000000_initial_schema.sql`**
   - Base schema: tables, indexes, initial RLS policies, triggers, storage buckets

2. **`20240202000000_add_qr_columns.sql`**
   - Added `qr_url`, `qr_svg`, `qr_png` columns to `restaurants` table
   - Back-filled QR URLs for existing restaurants

3. **`20240203000000_menu_items_storage.sql`**
   - Created `menu-items` storage bucket
   - Added storage policies for menu item images

4. **`20240204000000_menu_items_storage_no_size_limit.sql`**
   - Removed file size limit from menu-items bucket
   - (Note: This was merged into the bucket creation in the final schema)

5. **`20240205000000_one_menu_per_restaurant.sql`**
   - Data cleanup: removed duplicate menus
   - Dropped old `(restaurant_id, slug)` unique constraint
   - Added new `restaurant_id UNIQUE` constraint (1:1 relationship)

6. **`20240206000000_fix_rls_policies.sql`**
   - Dropped old RLS policies
   - Created production-grade RLS policies with separate INSERT/SELECT/UPDATE/DELETE policies

## File Structure

The merged file follows this execution order:

1. **Extensions** - UUID generation
2. **Tables** - All table definitions with complete columns
3. **Indexes** - All performance indexes
4. **Constraints** - Unique constraints, foreign keys, data migrations
5. **Triggers** - Auto-update `updated_at` timestamps
6. **Row Level Security** - Enable RLS, drop old policies, create new policies
7. **Storage Buckets** - Public and menu-items buckets
8. **Storage Policies** - Access control for storage buckets

## Key Features

### Tables
- `restaurants` - Restaurant data with QR code fields
- `menus` - One menu per restaurant (1:1 relationship)
- `categories` - Menu categories
- `menu_items` - Individual menu items with images
- `translations` - Multi-language support (de, en, fr, it)

### Security
- **Row Level Security (RLS)** enabled on all tables
- Separate policies for INSERT/SELECT/UPDATE/DELETE operations
- Owners can manage their own data
- Public users can only read active menus/items
- Production-grade multi-tenant security

### Storage
- **Public bucket** - General uploads
- **Menu-items bucket** - Menu item images (no size limit, jpeg/png/webp only)

## Usage

### For New Database Setup
```sql
-- Run the complete schema file
\i supabase/complete_database_schema.sql
```

### For Existing Database
The file uses `IF NOT EXISTS` and `ON CONFLICT DO NOTHING` clauses where appropriate, making it safe to run on existing databases. However, for production databases, it's recommended to:

1. Review the file carefully
2. Test on a staging environment first
3. Backup your database before applying

### Optional Seed Data
The `seed.sql` file is kept separate and contains test data for local development. It should be run manually if needed.

## Notes

- All duplicate definitions have been removed
- Old RLS policies are dropped before creating new ones
- Storage policies are recreated to avoid conflicts
- The file is idempotent (safe to run multiple times) where possible
- Data migrations (like duplicate menu cleanup) are included but clearly marked

## Verification

After running the schema, you can verify:

```sql
-- Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('restaurants', 'menus', 'categories', 'menu_items', 'translations');

-- List all policies
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('restaurants', 'menus', 'categories', 'menu_items', 'translations')
ORDER BY tablename, cmd;
```

## Migration Files Status

The original migration files in `supabase/migrations/` are preserved for historical reference. The merged file `complete_database_schema.sql` is the single source of truth for the complete database schema.
