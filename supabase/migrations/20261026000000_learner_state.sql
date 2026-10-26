-- Cross-device sync: the whole learner model as one JSON document per user.
-- The app merges it with each device's local copy (lib/learner/merge.ts), so the detailed
-- tables in the init migration can be filled from it later without changing the client.

create table public.learner_state (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  doc jsonb not null check (octet_length(doc::text) < 5000000),
  updated_at timestamptz not null default now()
);

create trigger learner_state_touch before update on public.learner_state
  for each row execute function public.touch_updated_at();

alter table public.learner_state enable row level security;

create policy "own learner state" on public.learner_state for all
  to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
