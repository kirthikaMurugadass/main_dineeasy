# Local Development Setup for Subdomain Routing

Quick guide for setting up subdomain routing in local development.

## Quick Start

### Option 1: Using hosts file (Recommended)

1. **Edit hosts file:**
   - **Windows**: `C:\Windows\System32\drivers\etc\hosts` (Run as Administrator)
   - **Mac/Linux**: `/etc/hosts` (Use `sudo`)

2. **Add entries:**
   ```
   127.0.0.1 arunnandy.localhost
   127.0.0.1 demo.localhost
   127.0.0.1 test-restaurant.localhost
   ```

3. **Start dev server:**
   ```bash
   npm run dev
   ```

4. **Access:**
   ```
   http://arunnandy.localhost:3000
   http://demo.localhost:3000/menu-123
   ```

### Option 2: Using main domain (Fallback)

If hosts file setup is not possible, use the main domain route:
```
http://localhost:3000/r/arunnandy-cafe
```

## Testing Subdomain Routing

### 1. Create Test Restaurant

In your Supabase dashboard or via SQL:

```sql
INSERT INTO restaurants (id, name, slug, owner_id, theme_config)
VALUES (
  'test-restaurant-id',
  'Test Restaurant',
  'test-restaurant',
  'your-user-id',
  '{"mode": "light", "primaryColor": "#3E2723", "accentColor": "#C6A75E", "fontHeading": "playfair", "fontBody": "inter", "showLogo": true, "headerImageUrl": null}'::jsonb
);
```

### 2. Create Test Menu

```sql
INSERT INTO menus (id, restaurant_id, slug, is_active)
VALUES (
  'menu-123',
  'test-restaurant-id',
  'menu',
  true
);
```

### 3. Test Access

```
http://test-restaurant.localhost:3000
http://test-restaurant.localhost:3000/menu-123
```

## Troubleshooting

### Subdomain not resolving

1. **Check hosts file:**
   - Ensure entries are correct
   - No typos in subdomain names
   - File saved correctly

2. **Clear DNS cache:**
   - **Windows**: `ipconfig /flushdns`
   - **Mac**: `sudo dscacheutil -flushcache`
   - **Linux**: `sudo systemd-resolve --flush-caches`

3. **Restart browser:**
   - Close all browser windows
   - Clear browser cache
   - Try incognito/private mode

4. **Verify dev server:**
   - Check server is running on port 3000
   - Check middleware is working (check console logs)

### Middleware not working

1. Check `src/middleware.ts` exists
2. Verify `next.config.ts` is correct
3. Restart dev server
4. Check browser console for errors

### Routes not found

1. Verify restaurant exists in database
2. Check restaurant slug matches subdomain
3. Verify menu exists and is active
4. Check route files exist: `src/app/public-menu/[restaurant]/[menuId]/page.tsx`

## Development Tips

### Multiple Restaurants

Add multiple entries to hosts file:
```
127.0.0.1 restaurant1.localhost
127.0.0.1 restaurant2.localhost
127.0.0.1 restaurant3.localhost
```

### Debugging

Enable verbose logging in middleware:
```typescript
console.log('Host:', host);
console.log('Subdomain:', subdomain);
console.log('Pathname:', pathname);
```

### Testing Different Scenarios

- Test root path: `http://restaurant.localhost:3000/`
- Test with menu ID: `http://restaurant.localhost:3000/menu-123`
- Test invalid subdomain: `http://invalid.localhost:3000`
- Test admin routes: `http://localhost:3000/admin` (should work normally)

## Next Steps

Once local development is working:
1. Test all routes
2. Verify menu loading
3. Test QR code generation with subdomain URLs
4. Prepare for production deployment (see `DEPLOYMENT.md`)
