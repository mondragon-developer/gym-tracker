-- =============================================================================
-- Gym Tracker - LEGAL ACCEPTANCE (who agreed to which terms, and when)
-- =============================================================================
-- Run in Supabase -> SQL Editor after admin.sql. Idempotent.
--
-- One row per account per version of the terms (LEGAL_VERSION in
-- src/legal/version.js). The app shows the consent screen until the signed-in
-- account has a row for the current version, so a new version asks everyone
-- again and the older rows stay as the record of what each person accepted.
--
-- SECURITY: no insert, update or delete policy. Rows are written only by
-- accept_legal_terms(), which stamps the caller's own id and the server
-- clock, so a client can neither backdate an acceptance nor record one for
-- someone else. A version dated in the future is refused, so nobody can
-- store an acceptance today for terms that will only be published later;
-- LEGAL_VERSION is therefore always the date the text is published (UTC),
-- never a later one. Rows go away with the account (on delete cascade).
-- =============================================================================

create table if not exists public.legal_acceptances (
  user_id     uuid        not null references auth.users (id) on delete cascade,
  version     text        not null check (version ~ '^\d{4}-\d{2}-\d{2}$'),
  language    text        not null check (language in ('en', 'es')),
  accepted_at timestamptz not null default now(),
  primary key (user_id, version)
);

alter table public.legal_acceptances enable row level security;

drop policy if exists "legal_acceptances - read own or admin" on public.legal_acceptances;
create policy "legal_acceptances - read own or admin" on public.legal_acceptances
  for select using (user_id = auth.uid() or public.is_admin());

-- Accepting twice keeps the first timestamp: the original moment of
-- agreement is the one that matters.
create or replace function public.accept_legal_terms(p_version text, p_language text)
returns timestamptz
language sql
security definer
volatile
set search_path = public
as $$
  insert into public.legal_acceptances (user_id, version, language)
  select auth.uid(), p_version, p_language
  where p_version::date <= (now() at time zone 'utc')::date
  on conflict (user_id, version) do nothing;

  select accepted_at
  from public.legal_acceptances
  where user_id = auth.uid() and version = p_version;
$$;

revoke all on function public.accept_legal_terms(text, text) from public, anon;
grant execute on function public.accept_legal_terms(text, text) to authenticated;
