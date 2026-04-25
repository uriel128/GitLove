# GitLove Backend (Local Dev)

NestJS + TypeScript backend starter for GitLove with:
- PostgreSQL (Supabase or local Docker)
- Redis (Docker)
- Prisma ORM
- Supabase Auth support
- HTTP APIs for health/challenges/interest/matches/chat history
- Socket.IO gateway for real-time chat

## 1) Local setup

```bash
cd backend
cp .env.example .env
npm install
npm run prisma:generate
npm run dev
```

If you are using Supabase, set `DATABASE_URL`, `SUPABASE_URL`, and `SUPABASE_ANON_KEY` (or `SUPABASE_SERVICE_ROLE_KEY`) in `.env`, then run:

```bash
npm run prisma:push
npm run seed
```

If you are using local Postgres/Redis instead:

```bash
npm run db:up
npm run prisma:push
npm run seed
```

Server URL:
- `http://localhost:4000/api`

Health check:
- `GET http://localhost:4000/api/health`

## 2) Key endpoints

- `GET /api/users`
- `GET /api/users/:userId`
- `PATCH /api/users/:userId/profile`
- `GET /api/auth/me` (requires Supabase bearer token)
- `POST /api/auth/sync` (requires Supabase bearer token)
- `GET /api/challenges/random?difficulty=EASY|MEDIUM|HARD`
- `POST /api/interest/open`
- `POST /api/interest/:requestId/attempt`
- `POST /api/interest/:requestId/cancel`
- `GET /api/interest/pending/:userId`
- `GET /api/matches/:userId`
- `GET /api/chat/:matchId/messages?userId=<id>&limit=50`
- `GET /api/build-log/:userId`
- `GET /api/stack-trace`

## 3) Socket.IO chat

Namespace:
- `CHAT_NAMESPACE` in `.env` (default: `/chat`)

Auth:
- provide `userId` in socket `auth` or query.

Events:
- `join_room` payload: `{ "matchId": "<matchId>" }`
- `send_message` payload: `{ "matchId": "<matchId>", "content": "hello", "format": "MARKDOWN" }`
- server emits `new_message`

## 4) Supabase auth handshake

When frontend signs in with Supabase, call:

1. `GET /api/auth/me` with `Authorization: Bearer <supabase-access-token>`
2. or `POST /api/auth/sync` with same bearer token

Response includes `appUser` (GitLove internal user record). Existing endpoints can then use `appUser.id`.

## 5) Seed users

- `alice@gitlove.dev`
- `bob@gitlove.dev`
- `carol@gitlove.dev`

The seed script creates profiles and challenge records to test the matching flow quickly.
