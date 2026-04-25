# GitLove Localhost Setup

This repo now runs both:
- `backend` (NestJS + Prisma + Firebase Auth + SQLite + Socket.IO)
- `frontend` (Next.js + Tailwind + TanStack Query + Monaco)

## 1) Install once

```bash
cd ~/GitLove
npm install
```

Environment files are versioned in this repo:
- `backend/.env`
- `frontend/.env.local`

## 2) Configure Firebase + DB

For this testing phase, shared env files are committed in repo:
- `backend/.env`
- `frontend/.env.local`

No per-machine env setup is required. Just run:

```bash
npm run db:push
npm run seed
```

## 3) Run full app on localhost

```bash
npm run dev
```

Local URLs:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:4000/api`
- Health: `http://localhost:4000/api/health`
- Firebase auth sync endpoint: `http://localhost:4000/api/auth/me`

## 4) Useful commands

```bash
npm run dev:backend
npm run dev:frontend
npm run typecheck
```

## 5) Deploy backend to Railway

This repo includes `railway.toml` so Railway can deploy the backend from the monorepo.

1. Create a new Railway project and connect `uriel128/GitLove`.
2. In the Railway service settings, set **Root Directory** to `/` (repo root).
3. Add backend env vars in Railway:
   - `NODE_ENV=production`
   - `PORT=4000` (Railway can override this automatically)
   - `CORS_ORIGIN=<your Vercel frontend URL>`
   - `DATABASE_URL=file:./dev.db`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
   - `CHAT_NAMESPACE=/chat`
4. Railway will use:
   - build: `npm install && npm run prisma:generate --workspace backend && npm run build --workspace backend`
   - start: `npm run prisma:push --workspace backend && npm run start --workspace backend`

After deploy, backend health should be:
- `https://<railway-backend-domain>/api/health`
