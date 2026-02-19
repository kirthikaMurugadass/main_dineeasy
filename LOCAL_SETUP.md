# DineEasy — Local Development Environment

Complete guide to running the full DineEasy stack locally with Docker, Supabase, and Redis.

---

## 1. System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        Host Machine (localhost)                      │
│                                                                      │
│  ┌──────────────┐      ┌──────────────────────────────────────────┐  │
│  │  Next.js App │      │     Supabase CLI Docker Stack            │  │
│  │  :3000       │─────▶│                                          │  │
│  │              │      │  ┌──────────┐  ┌──────────┐             │  │
│  │  App Router  │      │  │ Kong API │  │ Studio   │             │  │
│  │  + SSR       │      │  │ Gateway  │  │ :54323   │             │  │
│  └──────┬───────┘      │  │ :54321   │  └──────────┘             │  │
│         │              │  └────┬─────┘                            │  │
│         │              │       │                                  │  │
│         │              │  ┌────▼─────┐  ┌──────────┐             │  │
│         │              │  │PostgREST │  │ GoTrue   │             │  │
│         │              │  │ (API)    │  │ (Auth)   │             │  │
│         │              │  └────┬─────┘  └────┬─────┘             │  │
│         │              │       │             │                    │  │
│         │              │  ┌────▼─────────────▼─────┐             │  │
│         │              │  │     PostgreSQL 15       │             │  │
│         │              │  │     :54322              │             │  │
│         │              │  └────────────────────────┘             │  │
│         │              │                                          │  │
│         │              │  ┌──────────┐  ┌──────────┐             │  │
│         │              │  │ Storage  │  │ Realtime │             │  │
│         │              │  │ (S3-compat)│ │(WebSocket)│            │  │
│         │              │  └──────────┘  └──────────┘             │  │
│         │              │                                          │  │
│         │              │  ┌──────────┐  ┌──────────┐             │  │
│         │              │  │ Inbucket │  │  Edge    │             │  │
│         │              │  │ (Email)  │  │ Runtime  │             │  │
│         │              │  │ :54324   │  │ :8083    │             │  │
│         │              │  └──────────┘  └──────────┘             │  │
│         │              └──────────────────────────────────────────┘  │
│         │                                                            │
│         │              ┌──────────────────────────────────────────┐  │
│         │              │     Docker Compose (docker-compose.yml)  │  │
│         └─────────────▶│                                          │  │
│                        │  ┌──────────┐  ┌──────────────────┐     │  │
│                        │  │  Redis   │  │ Redis Commander  │     │  │
│                        │  │  :6379   │  │ :8085 (debug)    │     │  │
│                        │  └──────────┘  └──────────────────┘     │  │
│                        └──────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

### Port Map

| Service            | Port  | URL                          |
|--------------------|-------|------------------------------|
| Next.js            | 3000  | http://localhost:3000         |
| Supabase API (Kong)| 54321 | http://127.0.0.1:54321       |
| PostgreSQL         | 54322 | postgresql://...@127.0.0.1:54322/postgres |
| Supabase Studio    | 54323 | http://127.0.0.1:54323       |
| Inbucket (Email)   | 54324 | http://127.0.0.1:54324       |
| Inbucket SMTP      | 54325 | —                            |
| Redis              | 6379  | redis://127.0.0.1:6379       |
| Redis Commander    | 8085  | http://127.0.0.1:8085 (debug profile) |
| Edge Functions     | 8083  | Inspector                    |

---

## 2. Prerequisites

### Required Software

| Tool           | Version | Install                                             |
|----------------|---------|-----------------------------------------------------|
| Docker Desktop | ≥ 4.x   | https://docs.docker.com/desktop/install/windows-install/ |
| Node.js        | ≥ 18    | https://nodejs.org                                  |
| Supabase CLI   | ≥ 2.x   | `npm install -g supabase`                           |

### Verify Installation

```powershell
docker --version        # Docker version 27.x+
docker compose version  # Docker Compose version v2.x+
node --version          # v18.x+ or v20.x+
supabase --version      # 2.x.x
```

Ensure **Docker Desktop is running** before proceeding.

---

## 3. Project Structure

```
DINEEASY/
├── docker-compose.yml          # Redis + supplementary services
├── .env.example                # Template for env vars
├── .env.local                  # Your local env (auto-generated, gitignored)
├── LOCAL_SETUP.md              # This file
├── next.config.ts
├── package.json
├── scripts/
│   ├── setup.ps1               # Windows bootstrap
│   └── setup.sh                # macOS/Linux bootstrap
├── src/
│   ├── app/                    # Next.js App Router
│   ├── components/
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts       # Browser client
│   │   │   ├── server.ts       # Server client (RSC / Route Handlers)
│   │   │   └── middleware.ts   # Auth session refresh
│   │   └── redis.ts            # Redis cache layer
│   ├── middleware.ts
│   └── types/database.ts
└── supabase/
    ├── config.toml             # Supabase CLI local config
    ├── migrations/
    │   └── 20240101000000_initial_schema.sql
    ├── seed.sql                # Dev seed data
    └── migration.sql           # (legacy — replaced by migrations/)
```

---

## 4. Quick Start (Automated)

### Windows (PowerShell)

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup.ps1
```

### macOS / Linux

```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

The script will:
1. Verify all prerequisites
2. Install npm dependencies
3. Start Redis via Docker Compose
4. Start all Supabase services via CLI
5. Auto-generate `.env.local` with the correct keys
6. Print a summary with all URLs

Then start the dev server:

```bash
npm run dev
```

---

## 5. Manual Setup (Step by Step)

### 5.1 Install Dependencies

```bash
npm install
```

### 5.2 Start Redis

```bash
docker compose up -d redis
```

To also start the Redis Commander web UI (optional):

```bash
docker compose --profile debug up -d
```

### 5.3 Start Supabase

```bash
supabase start
```

First run pulls ~2 GB of Docker images. Subsequent starts are fast.

After startup, the CLI prints credentials:

```
         API URL: http://127.0.0.1:54321
     GraphQL URL: http://127.0.0.1:54321/graphql/v1
  S3 Storage URL: http://127.0.0.1:54321/storage/v1/s3
          DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
    Inbucket URL: http://127.0.0.1:54324
        anon key: eyJhbG...
service_role key: eyJhbG...
    JWT secret:   super-secret-jwt-token-...
```

### 5.4 Create `.env.local`

Copy `.env.example` and fill in the keys from the output above:

```powershell
copy .env.example .env.local
```

Replace `<paste-anon-key-from-supabase-start>` and `<paste-service-role-key-from-supabase-start>` with the actual values.

### 5.5 Apply Seed Data

```bash
supabase db reset
```

This drops and recreates the database, runs all migrations, then runs `seed.sql`.

### 5.6 Start Next.js

```bash
npm run dev
```

Open http://localhost:3000.

---

## 6. Docker Services Explained

### Supabase CLI Stack (`supabase start`)

The CLI manages its own Docker containers:

| Container         | Purpose                                     |
|-------------------|---------------------------------------------|
| `supabase_db`     | PostgreSQL 15 — the database                |
| `supabase_auth`   | GoTrue — authentication, magic links, OAuth |
| `supabase_rest`   | PostgREST — auto-generated REST API         |
| `supabase_realtime` | Realtime — WebSocket subscriptions        |
| `supabase_storage`| Storage API — file uploads, S3-compatible   |
| `supabase_kong`   | Kong — API gateway routing all requests     |
| `supabase_studio` | Studio — database admin GUI                 |
| `supabase_inbucket` | Inbucket — local email capture            |
| `supabase_edge_runtime` | Deno runtime for Edge Functions      |

### Docker Compose (`docker-compose.yml`)

| Container             | Purpose                    | Profile |
|------------------------|----------------------------|---------|
| `dineeasy-redis`      | Redis 7 — menu cache       | default |
| `dineeasy-redis-ui`   | Redis Commander — web GUI  | debug   |

---

## 7. Environment Variables

### `.env.local` (Local Development)

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from supabase start>
SUPABASE_SERVICE_ROLE_KEY=<from supabase start>
REDIS_URL=redis://127.0.0.1:6379
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Production (Vercel Environment Variables)

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from Supabase dashboard>
SUPABASE_SERVICE_ROLE_KEY=<from Supabase dashboard>
REDIS_URL=<Upstash or Redis Cloud URL>
NEXT_PUBLIC_SITE_URL=https://dineeasy.app
RESEND_API_KEY=re_xxxxxxxxxxxx
```

### Secret Handling Rules

- `.env.local` is gitignored — never commit it
- `.env.example` is committed — it documents required variables without values
- `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS — never expose it to the browser
- Prefix browser-safe vars with `NEXT_PUBLIC_`

---

## 8. Database Migration Workflow

### Creating a New Migration

```bash
supabase migration new <descriptive_name>
```

This creates `supabase/migrations/<timestamp>_<descriptive_name>.sql`. Write your DDL there.

### Applying Migrations

```bash
# Apply pending migrations to the running local database
supabase db push

# Full reset: drop DB, re-run all migrations, re-run seed.sql
supabase db reset
```

### Diffing Schema Changes

If you modified the schema via Studio, capture the diff:

```bash
supabase db diff --use-migra -f <migration_name>
```

### Deploying to Production

```bash
# Link to your production project (one-time)
supabase link --project-ref <your-project-ref>

# Push migrations to production
supabase db push
```

### CI/CD Strategy

In your CI pipeline:

```yaml
- name: Push migrations
  run: supabase db push --linked
  env:
    SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

---

## 9. Local Auth Setup

### How It Works Locally

- Supabase Auth (GoTrue) runs as a local Docker container
- Email confirmations are **disabled** in `config.toml` for frictionless dev
- All emails are captured by **Inbucket** at http://127.0.0.1:54324

### Test Account

The seed data creates a ready-to-use account:

| Field    | Value                   |
|----------|-------------------------|
| Email    | `dev@dineeasy.local`    |
| Password | `password123`           |

### Testing Magic Links / OTP

1. Trigger a sign-in from the app
2. Open Inbucket at http://127.0.0.1:54324
3. Check the inbox — the magic link email appears instantly
4. Click the link to complete authentication

### Switching to Production Email

In production, set `RESEND_API_KEY` and configure Supabase dashboard SMTP settings. The local Inbucket is only used during `supabase start`.

---

## 10. Local Storage Setup

### Storage runs automatically with `supabase start`

The migration creates a `public` bucket with these policies:
- **Authenticated users** can upload files
- **Anyone** can read files (public bucket)
- **Authenticated users** can update/delete their uploads

### Upload URL Pattern

```
# Local
http://127.0.0.1:54321/storage/v1/object/public/<bucket>/<path>

# Production
https://<project-ref>.supabase.co/storage/v1/object/public/<bucket>/<path>
```

### Creating Additional Buckets

Via Studio (http://127.0.0.1:54323 → Storage) or SQL:

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', false);
```

---

## 11. Redis Setup

### Architecture

Redis serves as the menu cache layer. When a public menu is requested:

1. Check Redis for cached data (`menu:<restaurant>:<menu>`)
2. If hit → return cached response (fast, no DB query)
3. If miss → query Supabase, cache result with 5-minute TTL

### Cache Invalidation

When a restaurant owner updates their menu, the API route calls `invalidateMenuCache()` which deletes all cache keys matching that restaurant.

### Monitoring

```bash
# Connect to Redis CLI
docker exec -it dineeasy-redis redis-cli

# Useful commands
KEYS menu:*          # List all cached menus
TTL menu:cafe:main   # Check remaining TTL
FLUSHALL             # Clear everything (dev only)
INFO memory          # Memory usage
```

### Redis Commander (optional GUI)

```bash
docker compose --profile debug up -d
```

Open http://127.0.0.1:8085 for a web-based Redis browser.

---

## 12. Next.js Integration

### Client Architecture

| File | Context | Usage |
|---|---|---|
| `src/lib/supabase/client.ts` | Browser (Client Components) | `createBrowserClient` for interactive UI |
| `src/lib/supabase/server.ts` | Server (RSC, Route Handlers) | `createServerClient` with cookie access |
| `src/lib/supabase/middleware.ts` | Edge Middleware | Session refresh + auth guards |

### How Environment Switching Works

The Supabase clients read `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` at runtime. The same code works in both environments — only the env vars change:

- **Local**: points to `http://127.0.0.1:54321`
- **Production**: points to `https://<ref>.supabase.co`

No code changes needed between environments.

---

## 13. Common Commands

```bash
# ─── Startup ───
supabase start                     # Start Supabase stack
docker compose up -d redis         # Start Redis
npm run dev                        # Start Next.js

# ─── Shutdown ───
supabase stop                      # Stop Supabase (preserves data)
docker compose down                # Stop Redis (preserves data)
supabase stop --no-backup          # Stop and wipe Supabase data

# ─── Database ───
supabase db reset                  # Full reset with seed data
supabase db push                   # Apply pending migrations
supabase migration new add_orders  # Create new migration
supabase db diff -f fix_indexes    # Capture Studio changes

# ─── Status / Logs ───
supabase status                    # Show URLs and keys
docker compose logs redis          # Redis logs
docker logs supabase_db_dineeasy-local  # Postgres logs

# ─── Redis ───
docker exec -it dineeasy-redis redis-cli   # Redis CLI
```

---

## 14. Debugging & Troubleshooting

### Port Conflicts

If a port is already in use:

```powershell
# Find what's using port 54321
netstat -ano | findstr :54321

# Kill the process
taskkill /PID <pid> /F
```

Or change ports in `supabase/config.toml` and restart.

### Reset Everything

```bash
# Nuclear reset — wipe all local data
supabase stop --no-backup
supabase start
docker compose down -v    # -v removes Redis data volume
docker compose up -d redis
```

### Docker Volume Cleanup

```bash
# Remove all unused Docker volumes
docker volume prune

# Remove only DineEasy volumes
docker volume rm dineeasy_redis_data
```

### Supabase Won't Start

```bash
# Check Docker is running
docker info

# Force stop and retry
supabase stop --no-backup
supabase start

# If containers are stale
docker rm -f $(docker ps -aq --filter "label=com.supabase.cli.project=dineeasy-local")
supabase start
```

### Checking Logs

```bash
# Supabase services
docker logs supabase_auth_dineeasy-local    # Auth issues
docker logs supabase_rest_dineeasy-local    # API issues
docker logs supabase_db_dineeasy-local      # Database issues

# All logs at once
supabase inspect db long-running-queries
```

### Database Direct Access

```bash
# Connect via psql (if installed)
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres

# Or use Supabase Studio
# http://127.0.0.1:54323 → SQL Editor
```

---

## 15. Production Deployment Parity

### How Local Maps to Production

| Local                        | Production                           |
|------------------------------|--------------------------------------|
| `supabase start`             | Supabase Cloud project               |
| PostgreSQL :54322            | Supabase managed Postgres            |
| GoTrue :54321/auth           | Supabase Auth                        |
| Storage :54321/storage       | Supabase Storage                     |
| Realtime :54321/realtime     | Supabase Realtime                    |
| Inbucket :54324              | Resend / SendGrid / SMTP             |
| Redis :6379 (Docker)         | Upstash Redis / Redis Cloud          |
| `npm run dev`                | Vercel deployment                    |
| `.env.local`                 | Vercel Environment Variables         |
| `supabase/migrations/`       | `supabase db push --linked`          |

### Deployment Workflow

```
1. Develop locally with `supabase start` + `npm run dev`
2. Create migration: `supabase migration new <name>`
3. Test locally: `supabase db reset`
4. Commit migration files to git
5. Link project: `supabase link --project-ref <ref>`
6. Push migrations: `supabase db push`
7. Deploy app: `git push` → Vercel auto-deploys
```

### Production Checklist

- [ ] Supabase project created on supabase.com
- [ ] Migrations pushed via `supabase db push --linked`
- [ ] Vercel environment variables set (all non-`NEXT_PUBLIC_` vars as server-only)
- [ ] Custom domain configured on Supabase
- [ ] Resend API key set for transactional email
- [ ] Upstash Redis provisioned and `REDIS_URL` set
- [ ] RLS policies verified
- [ ] Storage bucket policies verified
- [ ] `site_url` and `redirect_urls` configured in Supabase Auth settings
