-- North Splash OS: Crew Command Center
create table if not exists public.crew_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  crew_type text not null default 'detail' check (crew_type in ('d2d','detail','mixed')),
  manager_employee_id uuid references public.employees(id) on delete set null,
  status text not null default 'active',
  location_id uuid,
  daily_door_goal integer not null default 0,
  daily_appointment_goal integer not null default 0,
  daily_revenue_goal numeric not null default 0,
  daily_job_goal integer not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.crew_membership_history (
  id uuid primary key default gen_random_uuid(),
  crew_id uuid references public.crew_groups(id) on delete set null,
  previous_crew_id uuid references public.crew_groups(id) on delete set null,
  employee_id uuid not null references public.employees(id) on delete cascade,
  manager_employee_id uuid references public.employees(id) on delete set null,
  change_type text not null default 'assigned',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists idx_crew_history_employee on public.crew_membership_history(employee_id,started_at desc);
create table if not exists public.crew_coaching_notes (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  manager_employee_id uuid references public.employees(id) on delete set null,
  category text not null default 'coaching',
  note text not null,
  follow_up_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists public.crew_daily_closeouts (
  id uuid primary key default gen_random_uuid(),
  crew_id uuid not null references public.crew_groups(id) on delete cascade,
  manager_employee_id uuid references public.employees(id) on delete set null,
  work_date date not null default current_date,
  attendance_reviewed boolean not null default false,
  performance_reviewed boolean not null default false,
  incidents_reviewed boolean not null default false,
  inventory_reviewed boolean not null default false,
  tomorrow_reviewed boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  unique(crew_id,work_date)
);
create table if not exists public.crew_alerts (
  id uuid primary key default gen_random_uuid(),
  crew_id uuid references public.crew_groups(id) on delete cascade,
  employee_id uuid references public.employees(id) on delete cascade,
  alert_type text not null,
  severity text not null default 'info',
  title text not null,
  message text,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

alter table public.crew_groups enable row level security;
alter table public.crew_membership_history enable row level security;
alter table public.crew_coaching_notes enable row level security;
alter table public.crew_daily_closeouts enable row level security;
alter table public.crew_alerts enable row level security;

do $$ declare t text; begin
  foreach t in array array['crew_groups','crew_membership_history','crew_coaching_notes','crew_daily_closeouts','crew_alerts'] loop
    execute format('grant select,insert,update,delete on public.%I to authenticated',t);
  end loop;
end $$;

do $$ declare t text; begin
  foreach t in array array['crew_groups','crew_membership_history','crew_coaching_notes','crew_daily_closeouts','crew_alerts'] loop
    execute format('drop policy if exists ns_admin_all on public.%I',t);
    execute format('create policy ns_admin_all on public.%I for all to authenticated using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role=''admin'')) with check (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role=''admin''))',t);
  end loop;
end $$;
