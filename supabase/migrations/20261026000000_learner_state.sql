-- Cross-device sync: the whole learner model as one JSON document per user.
-- The app merges it with each device's local copy (lib/learner/merge.ts).
--
-- Self-contained and prefixed with speakwise_, so it can live in a project shared with
-- other apps without touching their tables or functions.

create table public.speakwise_learner_state (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  doc jsonb not null check (octet_length(doc::text) < 5000000),
  updated_at timestamptz not null default now()
);

create or replace function public.speakwise_touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger speakwise_learner_state_touch before update on public.speakwise_learner_state
  for each row execute function public.speakwise_touch_updated_at();

alter table public.speakwise_learner_state enable row level security;

create policy "speakwise: own learner state" on public.speakwise_learner_state for all
  to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
