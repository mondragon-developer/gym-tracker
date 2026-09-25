-- =============================================================================
-- Gym Tracker - ACCOUNT ACTIVITY (last time each account opened the app)
-- =============================================================================
-- Run in Supabase -> SQL Editor after admin.sql. Idempotent.
--
-- Feeds the admin "inactive accounts" view and, later, the inactivity policy
-- for free accounts (warn, then delete; see docs/WISHLIST.md). Sign-in time
-- is not enough: an installed app stays signed in for months, so the app
-- calls touch_last_active() each time it opens.
--
-- SECURITY: users cannot update profiles (only "profiles - admin update"
-- exists), so the stamp goes through a SECURITY DEFINER function that only
-- ever writes now() to the caller's own row.
-- =============================================================================

alter table public.profiles add column if not exists last_active_at timestamptz;

-- Existing accounts start from the best signal already stored: the last
-- sign-in or the last plan save, whichever is newer.
update public.profiles p
set last_active_at = greatest(u.last_sign_in_at, w.updated_at, p.created_at)
from auth.users u
left join public.workout_plans w on w.user_id = u.id
where u.id = p.id
  and p.last_active_at is null;

-- At most one write per account every 12 hours, however often the app opens.
create or replace function public.touch_last_active()
returns void
language sql
security definer
volatile
set search_path = public
as $$
  update public.profiles
  set last_active_at = now()
  where id = auth.uid()
    and (last_active_at is null or last_active_at < now() - interval '12 hours');
$$;

revoke all on function public.touch_last_active() from public, anon;
grant execute on function public.touch_last_active() to authenticated;
