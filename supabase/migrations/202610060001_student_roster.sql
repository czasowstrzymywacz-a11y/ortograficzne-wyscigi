-- One-time migration: expose account pseudonyms to signed-in students for the player roster.
-- Online status itself is sent through Supabase Realtime Presence and is not stored here.
create or replace function public.get_student_roster()
returns table(user_id uuid, display_name text)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.user_id, p.display_name
  from public.student_profiles as p
  order by p.display_name asc;
$$;

revoke all on function public.get_student_roster() from public, anon;
grant execute on function public.get_student_roster() to authenticated;
