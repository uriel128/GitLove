# GitLove Localhost Setup

This repo now runs both:
- `backend` (NestJS + Prisma + PostgreSQL + Redis + Socket.IO)
- `frontend` (Next.js + Tailwind + TanStack Query + Monaco)

## 1) Install once

```bash
cd ~/GitLove
npm install
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

## 2) Start database services

Make sure Docker Desktop is running, then:

```bash
npm run db:up
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

## 4) Useful commands

```bash
npm run dev:backend
npm run dev:frontend
npm run typecheck
npm run db:down
```
