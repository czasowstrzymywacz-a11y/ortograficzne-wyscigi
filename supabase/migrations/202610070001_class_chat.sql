-- Shared classroom chat. Messages are pseudonymous and visible to signed-in pupils only.
create table if not exists public.class_chat_messages (
  id bigint generated always as identity primary key,
  sender_id uuid not null references auth.users(id) on delete cascade,
  sender_name text not null,
  body text not null check (char_length(body) between 1 and 240),
  created_at timestamptz not null default now()
);

create index if not exists class_chat_messages_created_idx
  on public.class_chat_messages (created_at desc);

alter table public.class_chat_messages enable row level security;
revoke all on public.class_chat_messages from public, anon;
grant select, insert on public.class_chat_messages to authenticated;
grant usage, select on sequence public.class_chat_messages_id_seq to authenticated;

drop policy if exists class_chat_read_signed_in on public.class_chat_messages;
create policy class_chat_read_signed_in on public.class_chat_messages
  for select to authenticated using (true);

drop policy if exists class_chat_insert_own on public.class_chat_messages;
create policy class_chat_insert_own on public.class_chat_messages
  for insert to authenticated with check (sender_id = auth.uid());

create or replace function public.prepare_class_chat_message()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_name text;
begin
  if auth.uid() is null or new.sender_id <> auth.uid() then
    raise exception 'Zaloguj się, aby wysłać wiadomość.';
  end if;
  new.body := left(trim(regexp_replace(coalesce(new.body, ''), '\s+', ' ', 'g')), 240);
  if new.body = '' then raise exception 'Wiadomość nie może być pusta.'; end if;
  if new.body ~* '([[:alnum:]._%+-]+@[[:alnum:].-]+\.[[:alpha:]]{2,}|https?://|www\.|[0-9][0-9 ()+-]{7,}[0-9])' then
    raise exception 'Nie wpisuj danych kontaktowych ani odnośników na czacie.';
  end if;
  if exists (
    select 1 from public.class_chat_messages m
    where m.sender_id = auth.uid() and m.created_at > now() - interval '2 seconds'
  ) then raise exception 'Odczekaj chwilę przed kolejną wiadomością.'; end if;

  select p.display_name into v_name
  from public.student_profiles p where p.user_id = auth.uid();
  new.sender_name := coalesce(nullif(trim(v_name), ''), 'Uczeń');
  new.created_at := now();
  return new;
end;
$$;

revoke all on function public.prepare_class_chat_message() from public, anon, authenticated;
drop trigger if exists prepare_class_chat_message on public.class_chat_messages;
create trigger prepare_class_chat_message
  before insert on public.class_chat_messages
  for each row execute function public.prepare_class_chat_message();

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'class_chat_messages'
  ) then
    alter publication supabase_realtime add table public.class_chat_messages;
  end if;
end;
$$;
