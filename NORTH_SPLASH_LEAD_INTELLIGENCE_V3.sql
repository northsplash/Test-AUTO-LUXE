-- North Splash OS - Lead Intelligence V3
-- Safe additive migration. Designed to be rerunnable.

alter table public.leads
  add column if not exists archived_at timestamptz,
  add column if not exists archive_reason text,
  add column if not exists cooldown_until timestamptz,
  add column if not exists reactivation_status text,
  add column if not exists reactivated_at timestamptz,
  add column if not exists lead_temperature text default 'warm',
  add column if not exists lead_score integer default 0,
  add column if not exists contact_attempt_count integer default 0,
  add column if not exists last_outcome text,
  add column if not exists previous_rep_employee_id uuid references public.employees(id) on delete set null,
  add column if not exists ownership_expires_at timestamptz,
  add column if not exists best_contact_window text,
  add column if not exists manager_note text,
  add column if not exists reactivation_requested_at timestamptz,
  add column if not exists reactivation_requested_by uuid references auth.users(id) on delete set null;

create index if not exists idx_leads_archive_cooldown on public.leads(archived_at,cooldown_until);
create index if not exists idx_leads_reactivation on public.leads(reactivation_status,cooldown_until);
create index if not exists idx_leads_status_owner on public.leads(status,assigned_employee_id);

create table if not exists public.lead_archive_history (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  action text not null,
  reason text,
  previous_status text,
  cooldown_until timestamptz,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_employee_id uuid references public.employees(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists idx_lead_archive_history_lead on public.lead_archive_history(lead_id,created_at desc);

create table if not exists public.lead_assignment_history (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  from_employee_id uuid references public.employees(id) on delete set null,
  to_employee_id uuid references public.employees(id) on delete set null,
  changed_by uuid references auth.users(id) on delete set null,
  reason text,
  created_at timestamptz not null default now()
);
create index if not exists idx_lead_assignment_history_lead on public.lead_assignment_history(lead_id,created_at desc);

create table if not exists public.lead_property_media (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete cascade,
  territory_door_id uuid references public.territory_doors(id) on delete cascade,
  media_type text not null default 'property',
  file_url text not null,
  caption text,
  captured_by_employee_id uuid references public.employees(id) on delete set null,
  captured_at timestamptz not null default now()
);

-- Keep contact-attempt totals current for fast dashboards.
create or replace function public.ns_refresh_lead_contact_summary()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  update public.leads
  set contact_attempt_count=(select count(*) from public.lead_contact_attempts where lead_id=new.lead_id),
      last_outcome=new.outcome,
      last_contacted_at=coalesce(new.attempted_at,now()),
      updated_at=now()
  where id=new.lead_id;
  return new;
end;$$;

drop trigger if exists trg_ns_lead_contact_summary on public.lead_contact_attempts;
create trigger trg_ns_lead_contact_summary
after insert on public.lead_contact_attempts
for each row execute function public.ns_refresh_lead_contact_summary();

-- Automatically protect lost / declined leads for six months and DNK permanently.
create or replace function public.ns_apply_lead_cooldown()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if new.status='do_not_knock' then
    new.archived_at=coalesce(new.archived_at,now());
    new.archive_reason='do_not_knock';
    new.cooldown_until=null;
    new.reactivation_status='permanent_dnk';
  elsif new.status in ('not_interested','lost','cancelled') and
        (tg_op='INSERT' or old.status is distinct from new.status or new.archived_at is null) then
    new.archived_at=coalesce(new.archived_at,now());
    new.archive_reason=coalesce(new.archive_reason,new.status);
    new.cooldown_until=coalesce(new.cooldown_until,now()+interval '6 months');
    new.reactivation_status='cooldown';
  end if;
  return new;
end;$$;

drop trigger if exists trg_ns_apply_lead_cooldown on public.leads;
create trigger trg_ns_apply_lead_cooldown
before insert or update of status on public.leads
for each row execute function public.ns_apply_lead_cooldown();

-- Archive history is recorded automatically when archive state changes.
create or replace function public.ns_log_lead_archive_change()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if old.archived_at is distinct from new.archived_at or old.cooldown_until is distinct from new.cooldown_until or old.reactivation_status is distinct from new.reactivation_status then
    insert into public.lead_archive_history(lead_id,action,reason,previous_status,cooldown_until,actor_user_id)
    values(new.id,
      case when new.archived_at is null then 'reactivated' when new.status='do_not_knock' then 'permanent_dnk' else 'archived' end,
      new.archive_reason,old.status,new.cooldown_until,auth.uid());
  end if;
  return new;
end;$$;

drop trigger if exists trg_ns_log_lead_archive_change on public.leads;
create trigger trg_ns_log_lead_archive_change
after update on public.leads
for each row execute function public.ns_log_lead_archive_change();

-- Call from automation worker/nightly job. Expired leads return to the reactivation queue,
-- but are not silently reassigned to a rep.
create or replace function public.ns_release_expired_lead_cooldowns()
returns integer
language plpgsql
security definer
set search_path=public
as $$
declare affected integer;
begin
  update public.leads
  set reactivation_status='eligible',updated_at=now()
  where archived_at is not null
    and cooldown_until is not null
    and cooldown_until<=now()
    and coalesce(reactivation_status,'') not in ('eligible','reactivated')
    and status<>'do_not_knock';
  get diagnostics affected=row_count;
  return affected;
end;$$;

-- Basic scoring view for managers; frontend may apply richer live scoring.
create or replace view public.lead_reactivation_queue as
select l.*,
       greatest(0,extract(day from (now()-coalesce(l.last_contacted_at,l.created_at)))::int) as days_since_contact
from public.leads l
where l.status<>'do_not_knock'
  and l.archived_at is not null
  and l.cooldown_until is not null
  and l.cooldown_until<=now();

grant select,insert,update,delete on public.lead_archive_history to authenticated;
grant select,insert,update,delete on public.lead_assignment_history to authenticated;
grant select,insert,update,delete on public.lead_property_media to authenticated;
grant select on public.lead_reactivation_queue to authenticated;
grant execute on function public.ns_release_expired_lead_cooldowns() to authenticated;

alter table public.lead_archive_history enable row level security;
alter table public.lead_assignment_history enable row level security;
alter table public.lead_property_media enable row level security;

-- Existing North Splash portals already require authenticated access and apply role-level UI permissions.
-- Preserve that model here while keeping anonymous users out.
do $$ declare t text; begin
  foreach t in array array['lead_archive_history','lead_assignment_history','lead_property_media'] loop
    execute format('drop policy if exists ns_staff_access on public.%I',t);
    execute format($policy$create policy ns_staff_access on public.%I for all to authenticated
      using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role<>'customer' and coalesce(p.is_active,true)=true))
      with check (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role<>'customer' and coalesce(p.is_active,true)=true))$policy$,t);
  end loop;
end $$;

-- Prevent accidental duplicate active leads at the application layer; this helper identifies conflicts.
create or replace function public.ns_find_protected_lead(p_phone text default null,p_address text default null)
returns table(id uuid,customer_name text,address text,status text,cooldown_until timestamptz,archive_reason text)
language sql
security definer
set search_path=public
as $$
  select l.id,l.customer_name,l.address,l.status,l.cooldown_until,l.archive_reason
  from public.leads l
  where (p_phone is not null and p_phone<>'' and l.normalized_phone=regexp_replace(p_phone,'\D','','g'))
     or (p_address is not null and p_address<>'' and l.normalized_address=lower(trim(regexp_replace(p_address,'\s+',' ','g'))))
  order by l.updated_at desc
  limit 10;
$$;
grant execute on function public.ns_find_protected_lead(text,text) to authenticated;
