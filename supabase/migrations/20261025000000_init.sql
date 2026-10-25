-- Speakwise initial schema.
-- Every table carries user_id and row level security, so the single-user app can open to
-- more learners later without a rewrite.

create extension if not exists pgcrypto;

-- Profiles ------------------------------------------------------------------------------
create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'Learner',
  native_language text not null default 'he',
  target_language text not null default 'en',
  level_comprehension text not null default 'B2',
  level_production text not null default 'B1+',
  goals text[] not null default '{}',
  interests text[] not null default '{}',
  tutor_voice_id text not null default 'ava',
  correction_mode text not null default 'gentle' check (correction_mode in ('off', 'gentle', 'precise')),
  hebrew_help boolean not null default false,
  speech_rate numeric(3, 2) not null default 1.00 check (speech_rate between 0.5 and 1.5),
  daily_goal_minutes int not null default 12 check (daily_goal_minutes between 3 and 120),
  session_minutes int not null default 10 check (session_minutes between 3 and 30),
  monthly_budget_usd numeric(6, 2) not null default 15.00,
  reminder_time time,
  timezone text not null default 'Asia/Jerusalem',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Scenarios (seeded from content/, user-created ones carry a user_id) --------------------
create table public.scenarios (
  id text primary key,
  user_id uuid references auth.users (id) on delete cascade,
  category text not null,
  title text not null,
  brief jsonb not null,
  created_at timestamptz not null default now()
);

-- Sessions and turns ----------------------------------------------------------------------
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('placement', 'daily', 'free', 'scenario', 'shadowing')),
  scenario_id text references public.scenarios (id) on delete set null,
  mode text not null default 'voice' check (mode in ('voice', 'quiet')),
  plan jsonb not null default '{}',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  speaking_seconds int not null default 0,
  report jsonb,
  task_completed boolean,
  cost_usd numeric(10, 5) not null default 0
);
create index sessions_user_started_idx on public.sessions (user_id, started_at desc);

create table public.turns (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  idx int not null,
  role text not null check (role in ('learner', 'tutor', 'system')),
  text text not null,
  language text not null default 'en',
  -- What the learner used: voice, typed text, or the "I'm stuck" Hebrew fallback.
  input text check (input in ('voice', 'text', 'stuck')),
  audio_seconds numeric(6, 2),
  latency_ms int,
  pronunciation jsonb,
  created_at timestamptz not null default now(),
  unique (session_id, idx)
);
create index turns_session_idx on public.turns (session_id, idx);

-- Learner model -------------------------------------------------------------------------
create table public.errors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  key text not null,
  category text not null,
  title text not null,
  l1_pattern text,
  examples jsonb not null default '[]',
  better text,
  why text,
  occurrences int not null default 1,
  status text not null default 'new' check (status in ('new', 'practicing', 'mastered')),
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  unique (user_id, key)
);

create table public.phrases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  text text not null,
  meaning text,
  translation_he text,
  example text,
  source text not null default 'conversation' check (source in ('conversation', 'import', 'report', 'manual')),
  tag text,
  created_at timestamptz not null default now(),
  unique (user_id, text)
);

-- Spaced repetition cards for both phrases and errors (FSRS state as JSON).
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  phrase_id uuid references public.phrases (id) on delete cascade,
  error_id uuid references public.errors (id) on delete cascade,
  card jsonb not null,
  due timestamptz not null default now(),
  last_review timestamptz,
  check ((phrase_id is null) <> (error_id is null))
);
create index reviews_due_idx on public.reviews (user_id, due);

-- Motivation ----------------------------------------------------------------------------
create table public.achievements (
  user_id uuid not null references auth.users (id) on delete cascade,
  key text not null,
  earned_at timestamptz not null default now(),
  primary key (user_id, key)
);

create table public.daily_activity (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  speaking_seconds int not null default 0,
  sessions int not null default 0,
  streak_freeze_used boolean not null default false,
  primary key (user_id, day)
);

-- Cost and reliability ------------------------------------------------------------------
create table public.cost_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  session_id uuid references public.sessions (id) on delete set null,
  provider text not null,
  operation text not null,
  units numeric(14, 2) not null,
  unit text not null,
  cost_usd numeric(10, 6) not null,
  created_at timestamptz not null default now()
);
create index cost_events_user_month_idx on public.cost_events (user_id, created_at);

create table public.client_errors (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users (id) on delete set null,
  message text not null,
  context jsonb,
  created_at timestamptz not null default now()
);

-- updated_at --------------------------------------------------------------------------------
create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Row level security --------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.scenarios enable row level security;
alter table public.sessions enable row level security;
alter table public.turns enable row level security;
alter table public.errors enable row level security;
alter table public.phrases enable row level security;
alter table public.reviews enable row level security;
alter table public.achievements enable row level security;
alter table public.daily_activity enable row level security;
alter table public.cost_events enable row level security;
alter table public.client_errors enable row level security;

create policy "own profile" on public.profiles for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Built-in scenarios (user_id null) are readable by everyone signed in; custom ones are private.
create policy "read scenarios" on public.scenarios for select
  using (user_id is null or (select auth.uid()) = user_id);
create policy "write own scenarios" on public.scenarios for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "own sessions" on public.sessions for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own turns" on public.turns for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own errors" on public.errors for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own phrases" on public.phrases for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own reviews" on public.reviews for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own achievements" on public.achievements for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own activity" on public.daily_activity for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
-- Costs are written by the server (service role) and only read by the user.
create policy "read own costs" on public.cost_events for select
  using ((select auth.uid()) = user_id);
create policy "insert own client errors" on public.client_errors for insert
  with check (user_id is null or (select auth.uid()) = user_id);
