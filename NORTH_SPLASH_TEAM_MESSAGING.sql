-- North Splash OS — Internal Employee Messaging
create extension if not exists pgcrypto;

create table if not exists public.employee_message_channels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  channel_type text not null default 'custom' check (channel_type in ('company','role','crew','custom')),
  audience_role text,
  crew_id uuid references public.crew_groups(id) on delete set null,
  description text,
  created_by uuid,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.employee_message_channel_members (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.employee_message_channels(id) on delete cascade,
  user_id uuid,
  employee_id uuid references public.employees(id) on delete cascade,
  member_role text not null default 'member',
  can_post boolean not null default true,
  joined_at timestamptz not null default now(),
  unique(channel_id, employee_id),
  unique(channel_id, user_id)
);

create table if not exists public.employee_messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.employee_message_channels(id) on delete cascade,
  sender_user_id uuid,
  sender_employee_id uuid references public.employees(id) on delete set null,
  sender_name text not null,
  body text not null check (char_length(body) between 1 and 4000),
  message_kind text not null default 'message',
  related_lead_id uuid references public.leads(id) on delete set null,
  related_appointment_id uuid references public.appointments(id) on delete set null,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz
);

create table if not exists public.employee_message_reads (
  channel_id uuid not null references public.employee_message_channels(id) on delete cascade,
  user_id uuid not null,
  last_read_at timestamptz not null default now(),
  primary key(channel_id,user_id)
);

create index if not exists idx_employee_messages_channel_created on public.employee_messages(channel_id,created_at desc);
create index if not exists idx_employee_message_members_employee on public.employee_message_channel_members(employee_id);
create index if not exists idx_employee_message_channels_crew on public.employee_message_channels(crew_id);

insert into public.employee_message_channels(name,slug,channel_type,description)
values ('Company Updates','company-updates','company','Announcements and important company-wide updates')
on conflict(slug) do update set name=excluded.name,description=excluded.description,is_active=true;
insert into public.employee_message_channels(name,slug,channel_type,audience_role,description)
values
 ('Managers','managers','role','manager','Manager coordination and operating updates'),
 ('D2D Sales','d2d-sales','role','d2d_agent','Sales wins, hot leads, appointments and field updates'),
 ('Detailing Team','detailers','role','detailer','Job progress, completions, supplies and field updates')
on conflict(slug) do update set name=excluded.name,audience_role=excluded.audience_role,description=excluded.description,is_active=true;

insert into public.employee_message_channels(name,slug,channel_type,crew_id,description)
select cg.name || ' Crew', 'crew-' || cg.id::text, 'crew', cg.id, 'Private crew communication'
from public.crew_groups cg
on conflict(slug) do update set name=excluded.name,crew_id=excluded.crew_id,is_active=true;

alter table public.employee_message_channels enable row level security;
alter table public.employee_message_channel_members enable row level security;
alter table public.employee_messages enable row level security;
alter table public.employee_message_reads enable row level security;

drop function if exists public.ns_current_employee_id();
create function public.ns_current_employee_id() returns uuid language sql stable security definer set search_path=public as $$
  select e.id from public.employees e where e.user_id=auth.uid() limit 1
$$;

drop function if exists public.ns_can_access_message_channel(uuid);
create function public.ns_can_access_message_channel(p_channel uuid) returns boolean language plpgsql stable security definer set search_path=public as $$
declare c public.employee_message_channels%rowtype; emp public.employees%rowtype; elevated boolean:=false;
begin
  select exists(select 1 from public.profiles p where p.id=auth.uid() and (p.role='admin' or p.portal_role in ('owner','manager'))) into elevated;
  if elevated then return true; end if;
  select * into c from public.employee_message_channels where id=p_channel and is_active=true;
  if not found then return false; end if;
  select * into emp from public.employees where user_id=auth.uid() limit 1;
  if c.channel_type='company' then return emp.id is not null; end if;
  if c.channel_type='role' then return emp.role=c.audience_role; end if;
  if c.channel_type='crew' then
    return emp.department=('crew:'||c.crew_id::text)
      or exists(select 1 from public.crew_groups g where g.id=c.crew_id and g.manager_employee_id=emp.id);
  end if;
  return exists(select 1 from public.employee_message_channel_members m where m.channel_id=p_channel and (m.user_id=auth.uid() or m.employee_id=emp.id));
end $$;

grant execute on function public.ns_current_employee_id() to authenticated;
grant execute on function public.ns_can_access_message_channel(uuid) to authenticated;

drop policy if exists "message channels read" on public.employee_message_channels;
create policy "message channels read" on public.employee_message_channels for select to authenticated using (public.ns_can_access_message_channel(id));
drop policy if exists "message channels create" on public.employee_message_channels;
create policy "message channels create" on public.employee_message_channels for insert to authenticated with check (exists(select 1 from public.profiles p where p.id=auth.uid() and (p.role='admin' or p.portal_role in ('owner','manager'))));
drop policy if exists "message channels manage" on public.employee_message_channels;
create policy "message channels manage" on public.employee_message_channels for update to authenticated using (created_by=auth.uid() or exists(select 1 from public.profiles p where p.id=auth.uid() and (p.role='admin' or p.portal_role='owner')));

drop policy if exists "message members read" on public.employee_message_channel_members;
create policy "message members read" on public.employee_message_channel_members for select to authenticated using (public.ns_can_access_message_channel(channel_id));
drop policy if exists "message members manage" on public.employee_message_channel_members;
create policy "message members manage" on public.employee_message_channel_members for all to authenticated using (public.ns_can_access_message_channel(channel_id)) with check (public.ns_can_access_message_channel(channel_id));

drop policy if exists "messages read" on public.employee_messages;
create policy "messages read" on public.employee_messages for select to authenticated using (public.ns_can_access_message_channel(channel_id));
drop policy if exists "messages send" on public.employee_messages;
create policy "messages send" on public.employee_messages for insert to authenticated with check (sender_user_id=auth.uid() and public.ns_can_access_message_channel(channel_id));
drop policy if exists "messages edit own" on public.employee_messages;
create policy "messages edit own" on public.employee_messages for update to authenticated using (sender_user_id=auth.uid() or exists(select 1 from public.profiles p where p.id=auth.uid() and (p.role='admin' or p.portal_role='owner')));

drop policy if exists "message reads own" on public.employee_message_reads;
create policy "message reads own" on public.employee_message_reads for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());

grant select,insert,update on public.employee_message_channels to authenticated;
grant select,insert,update,delete on public.employee_message_channel_members to authenticated;
grant select,insert,update on public.employee_messages to authenticated;
grant select,insert,update on public.employee_message_reads to authenticated;

-- Add new crews to messaging automatically.
create or replace function public.ns_create_crew_message_channel() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.employee_message_channels(name,slug,channel_type,crew_id,description)
  values(new.name||' Crew','crew-'||new.id::text,'crew',new.id,'Private crew communication')
  on conflict(slug) do update set name=excluded.name,crew_id=excluded.crew_id,is_active=true;
  return new;
end $$;
drop trigger if exists trg_ns_create_crew_message_channel on public.crew_groups;
create trigger trg_ns_create_crew_message_channel after insert or update of name on public.crew_groups for each row execute function public.ns_create_crew_message_channel();

-- Realtime message delivery (safe if publication exists).
do $$
begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime')
     and not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='employee_messages') then
    alter publication supabase_realtime add table public.employee_messages;
  end if;
end $$;
