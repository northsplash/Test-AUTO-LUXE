-- North Splash OS V2 / Operations Intelligence
-- Safe/idempotent additions for portal V2, lifecycle automation, crew management, and lead intelligence.

-- 1) De-duplicate communication templates and keep the newest enabled template per event.
with ranked as (
  select id,event_key,row_number() over(partition by event_key order by created_at desc,id desc) rn
  from public.communication_templates
)
delete from public.communication_templates t using ranked r where t.id=r.id and r.rn>1;
create unique index if not exists uq_communication_templates_event_key on public.communication_templates(event_key);

-- 2) Lead contact history / next-action intelligence.
create table if not exists public.lead_contact_attempts (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  employee_id uuid references public.employees(id) on delete set null,
  channel text not null default 'door' check(channel in ('door','call','text','email','other')),
  outcome text,
  notes text,
  attempted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists idx_lead_contact_attempts_lead on public.lead_contact_attempts(lead_id,attempted_at desc);

-- 3) Customer communication / retention preferences.
create table if not exists public.customer_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.profiles(id) on delete cascade,
  email_updates boolean not null default true,
  sms_updates boolean not null default true,
  marketing_email boolean not null default true,
  marketing_sms boolean not null default false,
  preferred_contact_method text not null default 'email',
  preferred_detailer_id uuid references public.employees(id) on delete set null,
  notes text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- 4) Business daily snapshots for owner trend reporting.
create table if not exists public.business_daily_snapshots (
  id uuid primary key default gen_random_uuid(),
  snapshot_date date unique not null default current_date,
  booked_revenue numeric not null default 0,
  collected_revenue numeric not null default 0,
  completed_jobs integer not null default 0,
  new_leads integer not null default 0,
  d2d_doors integer not null default 0,
  appointments_set integer not null default 0,
  payroll_estimate numeric not null default 0,
  operating_expenses numeric not null default 0,
  notes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5) Feature flags / rollout controls so future modules can be enabled safely.
create table if not exists public.system_feature_flags (
  id uuid primary key default gen_random_uuid(),
  feature_key text unique not null,
  label text not null,
  is_enabled boolean not null default false,
  rollout_percentage integer not null default 100 check(rollout_percentage between 0 and 100),
  config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- 6) Stronger Crew Command fields.
alter table if exists public.crew_groups add column if not exists shift_start time;
alter table if exists public.crew_groups add column if not exists shift_end time;
alter table if exists public.crew_groups add column if not exists alert_inactivity_minutes integer not null default 25;
alter table if exists public.crew_groups add column if not exists manager_notes text;

-- 7) Authenticated grants. RLS stays enabled.
grant select,insert,update,delete on public.lead_contact_attempts to authenticated;
grant select,insert,update on public.customer_preferences to authenticated;
grant select on public.business_daily_snapshots to authenticated;
grant select on public.system_feature_flags to authenticated;

alter table public.lead_contact_attempts enable row level security;
alter table public.customer_preferences enable row level security;
alter table public.business_daily_snapshots enable row level security;
alter table public.system_feature_flags enable row level security;

-- Admin full access to new operational tables.
do $$ declare t text; begin
  foreach t in array array['lead_contact_attempts','customer_preferences','business_daily_snapshots','system_feature_flags'] loop
    execute format('drop policy if exists ns_admin_all on public.%I',t);
    execute format('create policy ns_admin_all on public.%I for all to authenticated using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role=''admin'')) with check (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role=''admin''))',t);
  end loop;
end $$;

-- D2D users can record/read their own lead attempts.
drop policy if exists ns_d2d_attempts on public.lead_contact_attempts;
create policy ns_d2d_attempts on public.lead_contact_attempts for all to authenticated
using (employee_id in (select e.id from public.employees e where e.user_id=auth.uid()))
with check (employee_id in (select e.id from public.employees e where e.user_id=auth.uid()));

-- Customers may manage their own communication preferences.
drop policy if exists ns_customer_preferences_self on public.customer_preferences;
create policy ns_customer_preferences_self on public.customer_preferences for all to authenticated
using (user_id=auth.uid()) with check (user_id=auth.uid());

-- Managers may read/update crew data for crews they manage.
do $$ declare t text; begin
  foreach t in array array['crew_groups','crew_membership_history','crew_coaching_notes','crew_daily_closeouts','crew_alerts'] loop
    execute format('drop policy if exists ns_manager_crew_access on public.%I',t);
  end loop;
end $$;
create policy ns_manager_crew_access on public.crew_groups for select to authenticated
using (manager_employee_id in (select e.id from public.employees e where e.user_id=auth.uid()));
create policy ns_manager_crew_access on public.crew_membership_history for select to authenticated
using (manager_employee_id in (select e.id from public.employees e where e.user_id=auth.uid()));
create policy ns_manager_crew_access on public.crew_coaching_notes for all to authenticated
using (manager_employee_id in (select e.id from public.employees e where e.user_id=auth.uid()))
with check (manager_employee_id in (select e.id from public.employees e where e.user_id=auth.uid()));
create policy ns_manager_crew_access on public.crew_daily_closeouts for all to authenticated
using (manager_employee_id in (select e.id from public.employees e where e.user_id=auth.uid()))
with check (manager_employee_id in (select e.id from public.employees e where e.user_id=auth.uid()));
create policy ns_manager_crew_access on public.crew_alerts for all to authenticated
using (crew_id in (select c.id from public.crew_groups c where c.manager_employee_id in (select e.id from public.employees e where e.user_id=auth.uid())))
with check (crew_id in (select c.id from public.crew_groups c where c.manager_employee_id in (select e.id from public.employees e where e.user_id=auth.uid())));

-- 8) Default automations. De-duplicate first so reruns are safe even on older databases.
with ranked_rules as (
  select id,name,row_number() over(partition by name order by created_at desc,id desc) rn
  from public.automation_rules
)
delete from public.automation_rules r using ranked_rules x where r.id=x.id and x.rn>1;
create unique index if not exists uq_automation_rules_name on public.automation_rules(name);

with ranked_events as (
  select id,event_key,entity_id,row_number() over(partition by event_key,entity_id order by created_at desc,id desc) rn
  from public.automation_events where entity_id is not null
)
delete from public.automation_events e using ranked_events x where e.id=x.id and x.rn>1;
create unique index if not exists uq_automation_events_entity on public.automation_events(event_key,entity_id) where entity_id is not null;

insert into public.automation_rules(name,trigger_event,action_type,delay_minutes,is_enabled)
values
 ('24-hour appointment reminder','appointment.reminder_due','email',0,true),
 ('Post-service review request','job.review_due','email',0,true),
 ('Lead follow-up alert','lead.follow_up_due','notification',0,true),
 ('D2D inactivity manager alert','employee.d2d_inactive','notification',0,true)
on conflict(name) do update set trigger_event=excluded.trigger_event,action_type=excluded.action_type,delay_minutes=excluded.delay_minutes,is_enabled=true;

-- 9) Feature flag defaults.
insert into public.system_feature_flags(feature_key,label,is_enabled,config)
values
 ('portal_v2','Portal V2 Design System',true,'{}'),
 ('smart_lead_pipeline','Smart Lead Pipeline',true,'{}'),
 ('crew_command_v2','Crew Command V2',true,'{}'),
 ('native_app','Native iOS/iPad App',false,'{}'),
 ('sms_notifications','SMS Notifications',false,'{}'),
 ('offline_field_mode','Offline Field Mode',true,'{}')
on conflict(feature_key) do nothing;
