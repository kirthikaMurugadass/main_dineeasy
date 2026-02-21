# Vercel Deployment Checklist - Restaurant Setup Fix

## Immediate Fix Applied ✅

The restaurant setup API route has been updated to use a **service role client** that bypasses RLS, ensuring restaurant creation works immediately.

## Required Environment Variables in Vercel

Make sure these are set in your Vercel project settings:

1. **`NEXT_PUBLIC_SUPABASE_URL`** - Your Supabase project URL
2. **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** - Your Supabase anon/public key
3. **`SUPABASE_SERVICE_ROLE_KEY`** ⚠️ **REQUIRED** - Your Supabase service role key (bypasses RLS)

### How to Get Service Role Key:

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Find **`service_role`** key (NOT the anon key)
4. Copy it and add it to Vercel environment variables

### Setting in Vercel:

1. Go to your Vercel project
2. Navigate to **Settings** → **Environment Variables**
3. Add:
   - Key: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: (paste your service role key)
   - Environment: Production, Preview, Development (select all)
4. Click **Save**
5. **Redeploy** your application

## What Changed

### Files Modified:
- ✅ `src/app/api/restaurant/setup/route.ts` - Now uses admin client for restaurant/menu creation
- ✅ `src/lib/supabase/admin.ts` - New admin client using service role key

### How It Works:

1. User authentication is still checked using the regular client (with user session)
2. Restaurant and menu creation uses the admin client (bypasses RLS)
3. **Security**: We still validate `owner_id = user.id` to ensure users can only create restaurants for themselves

## Testing After Deployment

1. **Deploy to Vercel** with the updated code
2. **Set `SUPABASE_SERVICE_ROLE_KEY`** in Vercel environment variables
3. **Redeploy** (required for env vars to take effect)
4. **Test restaurant creation**:
   - Sign up/login as a new user
   - Go to onboarding page
   - Enter restaurant name
   - Click "Continue"
   - Should succeed without "Setup failed" error

## Long-Term Solution (Optional)

After the immediate fix works, you can optionally apply the RLS migration to properly secure the database:

1. Run `supabase/migrations/20240206000000_fix_rls_policies.sql` in Supabase SQL Editor
2. This will create proper RLS policies
3. You can then switch back to using the regular client (without admin client) if desired

## Troubleshooting

### Error: "Missing Supabase admin credentials"

**Solution**: Make sure `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel environment variables and you've redeployed.

### Error: "Setup failed" still appears

**Check**:
1. Vercel function logs (Settings → Logs)
2. Supabase logs (Dashboard → Logs)
3. Verify `SUPABASE_SERVICE_ROLE_KEY` is correct (not the anon key)

### Error: "Unauthorized"

**Solution**: User session issue - check that user is properly authenticated before calling the API.

## Security Notes

- ✅ The admin client is **ONLY used server-side** (in API routes)
- ✅ User authentication is still required
- ✅ `owner_id` is validated to match the authenticated user
- ✅ Service role key is **NEVER exposed to the client**
- ⚠️ Keep `SUPABASE_SERVICE_ROLE_KEY` secret - never commit it to git
