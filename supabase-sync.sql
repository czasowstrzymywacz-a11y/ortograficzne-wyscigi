-- Iskierka: konta uczniów z nazwą + PIN, prywatne postępy i bezpieczny odczyt rankingów.
-- Uruchom raz w Supabase: SQL Editor > New query > Run.

create table if not exists public.student_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  login_key text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.student_progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.student_pin_attempt_limits (
  rate_key text primary key,
  window_started_at timestamptz not null default now(),
  attempt_count integer not null default 0,
  blocked_until timestamptz
);

alter table public.student_profiles enable row level security;
alter table public.student_progress enable row level security;
alter table public.student_pin_attempt_limits enable row level security;

revoke all on public.student_profiles from public, anon, authenticated;
revoke all on public.student_progress from public, anon;
revoke all on public.student_pin_attempt_limits from public, anon, authenticated;
grant select, insert, update on public.student_progress to authenticated;

create or replace function public.ensure_student_profile(p_display_name text, p_login_key text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'Zaloguj się, aby utworzyć profil.';
  end if;
  if p_display_name is null or length(btrim(p_display_name)) not between 2 and 24
     or p_display_name !~ '^[[:alnum:] _-]+$' then
    raise exception 'Imię lub pseudonim musi mieć 2–24 znaki.';
  end if;
  if p_login_key is null or length(p_login_key) > 254 then
    raise exception 'Nieprawidłowy adres konta.';
  end if;

  insert into public.student_profiles(user_id, display_name, login_key)
  values (auth.uid(), btrim(p_display_name), lower(p_login_key))
  on conflict (user_id) do update set display_name = excluded.display_name;
exception when unique_violation then
  raise exception 'Ten profil jest już zarejestrowany.';
end;
$$;

revoke all on function public.ensure_student_profile(text, text) from public, anon;
grant execute on function public.ensure_student_profile(text, text) to authenticated;

drop policy if exists "Students can read their own progress" on public.student_progress;
create policy "Students can read their own progress"
  on public.student_progress for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Students can create their own progress" on public.student_progress;
create policy "Students can create their own progress"
  on public.student_progress for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Students can update their own progress" on public.student_progress;
create policy "Students can update their own progress"
  on public.student_progress for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.consume_student_pin_attempt(p_rate_key text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_limit public.student_pin_attempt_limits%rowtype;
begin
  insert into public.student_pin_attempt_limits(rate_key)
  values (p_rate_key)
  on conflict (rate_key) do nothing;

  select * into v_limit
  from public.student_pin_attempt_limits
  where rate_key = p_rate_key
  for update;

  if v_limit.blocked_until is not null and v_limit.blocked_until > now() then
    return false;
  end if;

  if v_limit.window_started_at < now() - interval '15 minutes' then
    update public.student_pin_attempt_limits
    set window_started_at = now(), attempt_count = 1, blocked_until = null
    where rate_key = p_rate_key;
    return true;
  end if;

  if v_limit.attempt_count >= 5 then
    update public.student_pin_attempt_limits
    set blocked_until = now() + interval '15 minutes'
    where rate_key = p_rate_key;
    return false;
  end if;

  update public.student_pin_attempt_limits
  set attempt_count = attempt_count + 1
  where rate_key = p_rate_key;
  return true;
end;
$$;

create or replace function public.reset_student_pin_attempt(p_rate_key text)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  delete from public.student_pin_attempt_limits where rate_key = p_rate_key;
$$;

revoke all on function public.consume_student_pin_attempt(text) from public, anon, authenticated;
revoke all on function public.reset_student_pin_attempt(text) from public, anon, authenticated;
grant execute on function public.consume_student_pin_attempt(text) to service_role;
grant execute on function public.reset_student_pin_attempt(text) to service_role;

create or replace function public.get_leaderboard(p_category text)
returns table(display_name text, metric numeric, session_count bigint, is_me boolean)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with stats as (
    select
      p.user_id,
      p.display_name,
      (select count(*)
       from jsonb_array_elements(coalesce(pr.data->'sessions', '[]'::jsonb)) as elem(item)) as session_count,
      coalesce((select avg((item->>'score')::numeric)
       from jsonb_array_elements(coalesce(pr.data->'sessions', '[]'::jsonb)) as elem(item)), 0) as average_score,
      (select count(*)
       from jsonb_array_elements(coalesce(pr.data->'sessions', '[]'::jsonb)) as elem(item)
       where (item->>'date')::date >= current_date - (extract(isodow from current_date)::int - 1)) as weekly_count,
      (select count(*)
       from jsonb_array_elements(coalesce(pr.data->'sessions', '[]'::jsonb)) as elem(item)
       where (item->>'score')::numeric >= 90) as excellent_count,
      (select count(*)
       from jsonb_each(coalesce(pr.data->'words', '{}'::jsonb)) w
       where coalesce((w.value->>'correct')::int, 0) >= 2) as mastered_count,
      case
        when coalesce((pr.data->>'lastDay')::date, current_date - 2) >= current_date - 1
          then coalesce((pr.data->>'streak')::int, 0)
        else 0
      end as current_streak
    from public.student_profiles p
    left join public.student_progress pr on pr.user_id = p.user_id
  ), ranked as (
    select
      s.display_name,
      s.session_count,
      s.user_id,
      case p_category
        when 'weekly' then s.weekly_count::numeric
        when 'sessions' then s.session_count::numeric
        when 'average' then round(s.average_score, 0)
        when 'mastered' then s.mastered_count::numeric
        when 'streak' then s.current_streak::numeric
        when 'excellent' then s.excellent_count::numeric
        else 0::numeric
      end as metric
    from stats s
    where case when p_category = 'average' then s.session_count >= 3 else s.session_count > 0 end
  )
  select r.display_name, r.metric, r.session_count, (r.user_id = auth.uid()) as is_me
  from ranked r
  where p_category in ('weekly', 'sessions', 'average', 'mastered', 'streak', 'excellent')
  order by r.metric desc, r.session_count desc, r.display_name asc
  limit 10;
$$;

revoke all on function public.get_leaderboard(text) from public, anon;
grant execute on function public.get_leaderboard(text) to authenticated;


-- Pseudonym-only account roster for the authenticated rankings view.
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
