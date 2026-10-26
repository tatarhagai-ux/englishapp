-- Sync without a separate sign-in: the app server (already behind the access code) reads and
-- writes the learner document through two functions. They only work with a token the server
-- derives from APP_SESSION_SECRET; the database keeps just its SHA-256, in a private schema.
-- The one row of speakwise_private.sync_owner (token hash + owner) is inserted by hand, not here.

create schema if not exists speakwise_private;
revoke all on schema speakwise_private from public, anon, authenticated;

create table speakwise_private.sync_owner (
  id smallint primary key default 1 check (id = 1),
  token_sha256 text not null,
  owner uuid not null references auth.users (id) on delete cascade
);

create or replace function public.speakwise_sync_owner(p_token text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid;
begin
  select o.owner into v_owner from speakwise_private.sync_owner o
  where o.token_sha256 = encode(sha256(convert_to(p_token, 'UTF8')), 'hex');
  if v_owner is null then
    raise exception 'sync not allowed' using errcode = '42501';
  end if;
  return v_owner;
end;
$$;

create or replace function public.speakwise_sync_pull(p_token text) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  return (select s.doc from public.speakwise_learner_state s where s.user_id = public.speakwise_sync_owner(p_token));
end;
$$;

create or replace function public.speakwise_sync_push(p_token text, p_doc jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid := public.speakwise_sync_owner(p_token);
begin
  insert into public.speakwise_learner_state (user_id, doc) values (v_owner, p_doc)
  on conflict (user_id) do update set doc = excluded.doc;
end;
$$;

revoke all on function public.speakwise_sync_owner(text) from public, anon, authenticated;
revoke all on function public.speakwise_sync_pull(text) from public;
revoke all on function public.speakwise_sync_push(text, jsonb) from public;
grant execute on function public.speakwise_sync_pull(text) to anon;
grant execute on function public.speakwise_sync_push(text, jsonb) to anon;
