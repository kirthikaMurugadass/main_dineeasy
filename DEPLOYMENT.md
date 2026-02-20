# Production Deployment Guide

Complete guide for deploying DineEasy with subdomain routing to Vercel.

## Prerequisites

- Vercel account
- Domain name (e.g., `dineeasy.app`)
- Supabase project
- DNS access for your domain

## Step 1: Prepare Your Codebase

### 1.1 Environment Variables

Create `.env.production` (or set in Vercel Dashboard):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_APP_DOMAIN=dineeasy.app
NEXT_PUBLIC_APP_URL=https://dineeasy.app
REDIS_URL=your_redis_url (optional)
```

### 1.2 Verify Configuration

- ✅ `next.config.ts` includes subdomain image patterns
- ✅ `middleware.ts` handles subdomain routing
- ✅ `vercel.json` is configured
- ✅ All routes are properly set up

## Step 2: Deploy to Vercel

### 2.1 Initial Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

Or use Vercel Dashboard:
1. Connect your GitHub repository
2. Import project
3. Configure environment variables
4. Deploy

### 2.2 Configure Domain

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your main domain: `dineeasy.app`
3. Vercel will provide DNS records to configure

## Step 3: DNS Configuration

### 3.1 Add DNS Records

Go to your domain provider (e.g., Cloudflare, Namecheap, GoDaddy) and add:

#### Option A: CNAME (Recommended for Vercel)

```
Type: CNAME
Name: *
Value: cname.vercel-dns.com
TTL: Auto (or 3600)
```

#### Option B: A Record (If using custom IP)

```
Type: A
Name: *
Value: 76.76.21.21 (Vercel IP - check Vercel docs for current IP)
TTL: Auto
```

#### Root Domain

```
Type: A or CNAME
Name: @ (or dineeasy.app)
Value: Vercel IP or cname.vercel-dns.com
TTL: Auto
```

### 3.2 Verify DNS

Wait for DNS propagation (can take up to 48 hours, usually 1-2 hours):

```bash
# Check DNS propagation
dig *.dineeasy.app
nslookup *.dineeasy.app
```

## Step 4: SSL Certificate

Vercel automatically provisions SSL certificates for:
- Main domain: `dineeasy.app`
- All subdomains: `*.dineeasy.app`

No manual configuration needed. Certificates are issued automatically after DNS propagation.

## Step 5: Supabase Configuration

### 5.1 Update CORS Settings

In Supabase Dashboard → Settings → API:

Add allowed origins:
```
https://*.dineeasy.app
https://dineeasy.app
http://*.localhost:3000 (for development)
```

### 5.2 Storage Bucket Policies

Ensure storage buckets allow subdomain access:

```sql
-- Example policy for public bucket
CREATE POLICY "Public read access for subdomains"
ON storage.objects FOR SELECT
USING (bucket_id = 'public');
```

## Step 6: Testing

### 6.1 Test Subdomain Routing

```bash
# Test main domain
curl https://dineeasy.app

# Test subdomain
curl https://arunnandy.dineeasy.app

# Test with menu ID
curl https://arunnandy.dineeasy.app/menu-123
```

### 6.2 Verify SSL

All subdomains should have valid SSL:
- ✅ `https://arunnandy.dineeasy.app` (no SSL warnings)
- ✅ `https://demo.dineeasy.app` (no SSL warnings)

### 6.3 Test Menu Loading

1. Create a restaurant with slug "test-restaurant"
2. Access: `https://test-restaurant.dineeasy.app`
3. Verify menu loads correctly

## Step 7: Monitoring

### 7.1 Vercel Analytics

Enable in Vercel Dashboard:
- Analytics → Enable
- Monitor subdomain usage
- Track performance metrics

### 7.2 Error Tracking

Set up error monitoring:
- Vercel Logs
- Sentry integration
- Custom error logging

### 7.3 Performance Monitoring

- Vercel Speed Insights
- Real User Monitoring (RUM)
- Database query monitoring

## Step 8: Production Checklist

- [ ] Environment variables configured
- [ ] DNS records added and propagated
- [ ] SSL certificates issued
- [ ] Supabase CORS configured
- [ ] Storage policies updated
- [ ] All subdomains accessible
- [ ] Menu pages load correctly
- [ ] QR codes work with subdomain URLs
- [ ] Analytics enabled
- [ ] Error tracking configured
- [ ] Performance monitoring active

## Troubleshooting

### Subdomain not resolving

1. Check DNS propagation: `dig *.dineeasy.app`
2. Verify DNS records are correct
3. Wait for propagation (up to 48 hours)
4. Clear DNS cache: `ipconfig /flushdns` (Windows) or `sudo dscacheutil -flushcache` (Mac)

### SSL certificate not issued

1. Wait 24-48 hours after DNS propagation
2. Check Vercel Dashboard → Domains → SSL status
3. Verify DNS records are correct
4. Contact Vercel support if issues persist

### 404 errors on subdomains

1. Check middleware logs in Vercel
2. Verify restaurant slug exists in database
3. Check route rewrites are working
4. Verify `public-menu` routes exist

### CORS errors

1. Update Supabase CORS settings
2. Add subdomain to allowed origins
3. Check Storage bucket policies
4. Verify API routes allow subdomain requests

## Support

- Vercel Docs: https://vercel.com/docs
- Next.js Middleware: https://nextjs.org/docs/app/building-your-application/routing/middleware
- Vercel Support: support@vercel.com
