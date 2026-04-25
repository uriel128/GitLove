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

- use SQLite URL in `backend/.env` as `DATABASE_URL` (default: `file:./dev.db`)
- set Firebase Admin vars in `backend/.env`:
  - `FIREBASE_PROJECT_ID`
  - `FIREBASE_CLIENT_EMAIL`
  - `FIREBASE_PRIVATE_KEY`
- then run:

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
