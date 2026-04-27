-- GitLove Supabase schema
-- Run in Supabase SQL editor before starting the app.

create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key,
  email text not null unique,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  occupation text,
  age integer,
  hobbies jsonb not null default '[]'::jsonb,
  editor_choice text,
  language_choice text,
  github_username text,
  vibe_badge text,
  favorite_framework text,
  favorite_os text,
  favorite_data_structure text,
  favorite_algorithm text,
  challenge_level text not null default 'EASY' check (challenge_level in ('EASY', 'MEDIUM', 'HARD')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists profile_image_url text;
alter table public.profiles add column if not exists gender text check (gender in ('MALE', 'FEMALE'));
alter table public.profiles add column if not exists location_text text;
alter table public.profiles add column if not exists latitude double precision;
alter table public.profiles add column if not exists longitude double precision;

create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  difficulty text not null check (difficulty in ('EASY', 'MEDIUM', 'HARD')),
  description text not null,
  starter_code jsonb,
  test_cases jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.interest_requests (
  id uuid primary key default gen_random_uuid(),
  challenger_id uuid not null references public.users(id) on delete cascade,
  target_id uuid not null references public.users(id) on delete cascade,
  challenge_id uuid not null references public.challenges(id) on delete restrict,
  status text not null default 'PENDING_CHALLENGER' check (status in ('PENDING_CHALLENGER', 'PENDING_RECIPIENT', 'MATCHED', 'FAILED', 'CANCELLED')),
  created_at timestamptz not null default now(),
  requested_at timestamptz,
  matched_at timestamptz
);

create index if not exists interest_requests_challenger_status_idx on public.interest_requests(challenger_id, status);
create index if not exists interest_requests_target_status_idx on public.interest_requests(target_id, status);

create table if not exists public.challenge_attempts (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.interest_requests(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  passed boolean not null,
  submitted_code text,
  created_at timestamptz not null default now(),
  unique (request_id, user_id)
);

create index if not exists challenge_attempts_user_created_idx on public.challenge_attempts(user_id, created_at);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.interest_requests(id) on delete cascade,
  user_a_id uuid not null references public.users(id) on delete cascade,
  user_b_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists matches_user_a_idx on public.matches(user_a_id);
create index if not exists matches_user_b_idx on public.matches(user_b_id);

create table if not exists public.chat_rooms (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null unique references public.matches(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.chat_rooms(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  content text not null,
  format text not null default 'MARKDOWN' check (format in ('TEXT', 'MARKDOWN', 'CODE')),
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_room_created_idx on public.chat_messages(room_id, created_at);

alter publication supabase_realtime add table public.chat_messages;
