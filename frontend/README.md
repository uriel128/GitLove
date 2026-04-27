# GitLove Frontend (Next.js + Supabase)

## Local run

```bash
cd frontend
npm install
npm run dev
```

Default local URL:
- `http://localhost:3000`

Required environment variables in `frontend/.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (preferred)
- `SUPABASE_SERVICE_ROLE_KEY`

Optional:
- `NEXT_PUBLIC_API_URL` (defaults to `/api`)

Admin access is role-based (Supabase Auth metadata), not env-based.  
Set `app_metadata.role = "admin"` (or include `"admin"` in `app_metadata.roles`) for admin users.

## Supabase setup

1. Copy the local env template:

```bash
cp .env.local.example .env.local
```

1. Run [`supabase/schema.sql`](/home/uriel/Documents/GitLove/supabase/schema.sql) in the Supabase SQL editor.
2. Run [`supabase/seed.sql`](/home/uriel/Documents/GitLove/supabase/seed.sql) to insert challenge records.
3. Enable GitHub OAuth in Supabase Auth if you want GitHub login on `/login`.
