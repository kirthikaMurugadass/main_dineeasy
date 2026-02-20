# Subdomain-Based Multi-Tenant Routing Setup

Complete production-ready guide for implementing subdomain routing in DineEasy.

## Overview

This setup enables multi-tenant routing where each restaurant gets their own subdomain:

- **Development**: `http://{restaurant}.localhost:3000/{menu-id}`
- **Production**: `https://{restaurant}.dineeasy.app/{menu-id}`

## Architecture

```
User Request: https://arunnandy.dineeasy.app/menu-123
    ↓
Middleware detects subdomain: "arunnandy"
    ↓
Rewrites to: /public-menu/arunnandy/menu-123
    ↓
Server component fetches restaurant data by slug
    ↓
Renders public menu page
```

## File Structure

```
src/
├── middleware.ts              # Subdomain detection & routing
├── lib/
│   └── subdomain.ts          # Subdomain utilities
└── app/
    └── public-menu/
        └── [restaurant]/
            ├── page.tsx      # Default menu
            └── [menuId]/
                └── page.tsx  # Specific menu
```

## 1. Middleware Configuration

The middleware (`src/middleware.ts`) handles:
- Subdomain extraction
- Route rewriting
- Admin/API route exclusion
- Session management

## 2. Next.js Configuration

Update `next.config.ts` to support subdomain routing.

## 3. Environment Variables

Add to `.env.local`:
```env
NEXT_PUBLIC_APP_DOMAIN=dineeasy.app
NEXT_PUBLIC_APP_URL=https://dineeasy.app
```

## 4. Local Development Setup

### Option A: Using hosts file (Recommended)

1. Edit hosts file:
   - **Windows**: `C:\Windows\System32\drivers\etc\hosts`
   - **Mac/Linux**: `/etc/hosts`

2. Add entries:
   ```
   127.0.0.1 arunnandy.localhost
   127.0.0.1 demo.localhost
   ```

3. Access:
   ```
   http://arunnandy.localhost:3000/menu-123
   ```

### Option B: Using main domain

The existing `/r/{slug}` route still works:
```
http://localhost:3000/r/arunnandy-cafe
```

## 5. Production Deployment (Vercel)

### Step 1: Configure Vercel Project

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your main domain: `dineeasy.app`
3. Vercel automatically handles wildcard subdomains

### Step 2: DNS Configuration

Add these DNS records to your domain provider:

**Type A Record (if using custom IP):**
```
*.dineeasy.app  →  Vercel IP (or use CNAME)
```

**Type CNAME Record (Recommended for Vercel):**
```
*.dineeasy.app  →  cname.vercel-dns.com
```

**Type A Record for root domain:**
```
dineeasy.app    →  Vercel IP (or use CNAME to vercel-dns.com)
```

### Step 3: Vercel Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

```env
NEXT_PUBLIC_APP_DOMAIN=dineeasy.app
NEXT_PUBLIC_APP_URL=https://dineeasy.app
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Step 4: Deploy

```bash
vercel --prod
```

Vercel will automatically:
- Provision SSL certificates for all subdomains
- Handle wildcard DNS routing
- Enable HTTPS for all subdomains

## 6. Testing Subdomain Routing

### Local Testing

```bash
# Start dev server
npm run dev

# Access via subdomain
http://arunnandy.localhost:3000
http://demo.localhost:3000/menu-123
```

### Production Testing

```bash
# After deployment
https://arunnandy.dineeasy.app
https://demo.dineeasy.app/menu-123
```

## 7. Troubleshooting

### Subdomain not working locally

1. Check hosts file entries
2. Clear browser cache
3. Restart dev server
4. Try incognito mode

### Subdomain not working in production

1. Verify DNS records (can take 24-48 hours to propagate)
2. Check Vercel domain configuration
3. Verify SSL certificate is issued
4. Check middleware logs in Vercel

### CORS errors

Ensure Supabase Storage allows your subdomain:
```sql
-- In Supabase Dashboard → Storage → Policies
-- Add CORS origin: https://*.dineeasy.app
```

## 8. Security Considerations

1. **Subdomain validation**: Only allow alphanumeric and hyphens
2. **Rate limiting**: Implement per-subdomain rate limiting
3. **CORS**: Configure Supabase Storage for subdomains
4. **SSL**: Ensure all subdomains have valid SSL certificates

## 9. Performance Optimization

1. **Caching**: Use Redis for restaurant data caching
2. **ISR**: Implement Incremental Static Regeneration
3. **CDN**: Vercel Edge Network automatically caches static assets
4. **Database**: Index `restaurants.slug` for fast lookups

## 10. Monitoring

Monitor subdomain usage:
- Vercel Analytics
- Custom logging in middleware
- Database query monitoring
- Error tracking (Sentry, etc.)

## Support

For issues or questions, check:
- Next.js Middleware docs: https://nextjs.org/docs/app/building-your-application/routing/middleware
- Vercel Subdomain docs: https://vercel.com/docs/concepts/projects/domains/wildcard-domains
