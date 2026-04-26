# GitLove

GitLove now runs as a Supabase-first Next.js app:
- `frontend` (Next.js + Tailwind + TanStack Query + Monaco + Supabase Auth/Realtime)
- `frontend/app/api` route handlers (API surface previously served by the backend)
- `supabase/schema.sql` and `supabase/seed.sql` for database setup

## 1) Install

```bash
cd ~/Documents/GitLove
npm install
```

## 2) Configure env

Create local env from the template:

```bash
cp frontend/.env.local.example frontend/.env.local
```

Then fill values in `frontend/.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` (from Supabase Project Settings -> API)
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (from Supabase Project Settings -> API Keys)
- `SUPABASE_SERVICE_ROLE_KEY` (from Supabase Project Settings -> API Keys, service-role/secret key)
- `NEXT_PUBLIC_API_URL=/api` (optional; default is `/api`)

## 3) Configure Supabase DB

Run in Supabase SQL editor:
1. [`supabase/schema.sql`](/home/uriel/Documents/GitLove/supabase/schema.sql)
2. [`supabase/seed.sql`](/home/uriel/Documents/GitLove/supabase/seed.sql)

## 4) Run app

```bash
npm run dev
```

Local URL:
- Frontend + API: `http://localhost:3000`

## 5) Useful commands

```bash
npm run typecheck
npm run build
```
