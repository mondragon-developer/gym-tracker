-- =============================================================================
-- Gym Tracker - REST TIMER PUSH (end-of-rest notification from the server)
-- =============================================================================
-- Run in Supabase -> SQL Editor. Idempotent.
--
-- One row per scheduled end-of-rest push. The rest-timer-push Edge Function
-- inserts it, waits until ends_at, and sends only if the row is still there;
-- Pause, Reset or a new rest delete it. Rows live for two minutes at most.
--
-- SECURITY: RLS on with no policies, so the anon and authenticated roles can
-- neither read nor write; only the function (service role) touches it. The
-- push endpoint is a capability URL, so it must not be readable by clients.
-- =============================================================================

create table if not exists public.rest_timer_pushes (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users (id) on delete cascade,
  endpoint   text        not null,
  ends_at    timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists rest_timer_pushes_user_idx on public.rest_timer_pushes (user_id);

alter table public.rest_timer_pushes enable row level security;
