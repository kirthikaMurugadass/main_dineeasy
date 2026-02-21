# QR URL Fix for Vercel Deployment

## Problem
After Vercel deployment, QR codes were generating URLs with menuId:
```
https://dineeasy-new.vercel.app/r/golden-cafe/8e419606-19ae-4bed-8d29-830d7a6f5774
```

This caused 404 errors because:
- The route only supports `/r/[slug]` (not `/r/[slug]/[menuId]`)
- Since there's only one menu per restaurant, menuId is not needed

## Solution

### 1. Updated URL Generation (`src/lib/subdomain.ts`)
- Removed menuId from URL generation
- Now generates: `https://domain.com/r/restaurant-slug`
- Automatically detects the correct domain:
  - **Client-side**: Uses current window location
  - **Server-side**: Uses `NEXT_PUBLIC_SITE_URL` environment variable

### 2. Updated QR Page Display (`src/app/admin/qr/page.tsx`)
- Fixed URL display to show the correct path format
- Removed subdomain format display
- Now shows the actual QR URL that will be generated

## Required Vercel Environment Variable

**IMPORTANT**: Set this in your Vercel project settings:

```
NEXT_PUBLIC_SITE_URL=https://dineeasy-new.vercel.app
```

Or if you have a custom domain:
```
NEXT_PUBLIC_SITE_URL=https://dineeasy.app
```

### How to Set in Vercel:
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add:
   - **Key**: `NEXT_PUBLIC_SITE_URL`
   - **Value**: `https://dineeasy-new.vercel.app` (or your custom domain)
   - **Environment**: ProduWhatsApp Image 2026-02-21 at 1.15.03 PM.jpegpment (select all)
4. Click **Save**
5. **Redeploy** your application

## URL Format

### Before (Broken):
```
https://dineeasy-new.vercel.app/r/golden-cafe/8e419606-19ae-4bed-8d29-830d7a6f5774
❌ 404 Error - Route doesn't exist
```

### After (Fixed):
```
https://dineeasy-new.vercel.app/r/golden-cafe
✅ Works correctly
```

## Testing

After deploying:
1. Generate a new QR code in the admin panel
2. Scan the QR code or visit the URL directly
3. Should load the restaurant menu without 404 errors

## Notes

- The URL generation automatically works in both development and production
- Client-side code uses `window.location` to detect the current domain
- Server-side code uses `NEXT_PUBLIC_SITE_URL` environment variable
- MenuId is no longer included since there's one menu per restaurant
