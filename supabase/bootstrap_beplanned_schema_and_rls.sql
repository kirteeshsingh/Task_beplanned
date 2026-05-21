-- ============================================================
-- BEPLANNED FULL SCHEMA + FINAL RLS BOOTSTRAP
-- Run this in Supabase SQL Editor when the remote project is empty
-- or when "public.profiles does not exist" appears.
-- ============================================================

create extension if not exists pgcrypto;

-- ============================================================
-- 1. Core tables
-- ============================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  avatar_url text,
  created_at timestamptz default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  color text default '#3B82F6',
  owner_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'member')),
  joined_at timestamptz default now(),
  unique (project_id, user_id)
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text default '',
  status text not null default 'todo' check (status in ('backlog', 'todo', 'in_progress', 'review', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  due_date date,
  assigned_to uuid references public.profiles(id) on delete set null,
  created_by uuid not null references public.profiles(id),
  tags text[] default '{}',
  position int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  action text not null,
  entity_type text not null default 'task',
  entity_id uuid,
  meta jsonb default '{}',
  created_at timestamptz default now()
);

create index if not exists tasks_project_id_idx on public.tasks(project_id);
create index if not exists tasks_assigned_to_idx on public.tasks(assigned_to);
create index if not exists tasks_status_idx on public.tasks(status);
create index if not exists activity_log_project_id_idx on public.activity_log(project_id);
create index if not exists activity_log_user_id_idx on public.activity_log(user_id);

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.tasks enable row level security;
alter table public.activity_log enable row level security;

-- ============================================================
-- 2. Drop old policies so this script is re-runnable
-- ============================================================

drop policy if exists "Authenticated users can read all profiles" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

drop policy if exists "Project members can view project" on public.projects;
drop policy if exists "Project owners can view own project" on public.projects;
drop policy if exists "Authenticated users can create projects" on public.projects;
drop policy if exists "Project admins can update project" on public.projects;
drop policy if exists "Project admins can delete project" on public.projects;

drop policy if exists "Project members can view members" on public.project_members;
drop policy if exists "Allow self or admin to insert members" on public.project_members;
drop policy if exists "Project admins can insert members" on public.project_members;
drop policy if exists "Project admins can delete members" on public.project_members;

drop policy if exists "Project members can view tasks" on public.tasks;
drop policy if exists "Project members can create tasks" on public.tasks;
drop policy if exists "Project members can update tasks" on public.tasks;
drop policy if exists "Task creator or admin can delete tasks" on public.tasks;

drop policy if exists "Project members can view activity" on public.activity_log;
drop policy if exists "Authenticated users can insert activity" on public.activity_log;

-- ============================================================
-- 3. Helper functions
-- ============================================================

create or replace function public.is_project_owner(
  target_project_id uuid,
  target_user_id uuid default auth.uid()
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.projects
    where id = target_project_id
      and owner_id = target_user_id
  );
$$;

create or replace function public.is_project_member(
  target_project_id uuid,
  target_user_id uuid default auth.uid()
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.project_members
    where project_id = target_project_id
      and user_id = target_user_id
  );
$$;

create or replace function public.is_project_admin(
  target_project_id uuid,
  target_user_id uuid default auth.uid()
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.project_members
    where project_id = target_project_id
      and user_id = target_user_id
      and role = 'admin'
  );
$$;

-- ============================================================
-- 4. Auth and project bootstrap triggers
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.email, '')
  )
  on conflict (id) do update
    set
      full_name = coalesce(excluded.full_name, public.profiles.full_name),
      email = coalesce(excluded.email, public.profiles.email);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();

create or replace function public.handle_new_project()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.project_members (project_id, user_id, role)
  values (new.id, new.owner_id, 'admin')
  on conflict (project_id, user_id) do update
    set role = 'admin';

  return new;
end;
$$;

drop trigger if exists on_project_created on public.projects;
create trigger on_project_created
  after insert on public.projects
  for each row
  execute procedure public.handle_new_project();

-- Backfill rows for users/projects that already exist.
insert into public.profiles (id, full_name, email)
select
  id,
  coalesce(raw_user_meta_data->>'full_name', ''),
  coalesce(email, '')
from auth.users
on conflict (id) do update
  set
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    email = coalesce(excluded.email, public.profiles.email);

insert into public.project_members (project_id, user_id, role)
select id, owner_id, 'admin'
from public.projects
on conflict (project_id, user_id) do update
  set role = 'admin';

-- ============================================================
-- 5. Policies
-- ============================================================

create policy "Authenticated users can read all profiles"
on public.profiles
for select
to authenticated
using (true);

create policy "Users can insert own profile"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "Authenticated users can create projects"
on public.projects
for insert
to authenticated
with check (owner_id = auth.uid());

create policy "Project members can view project"
on public.projects
for select
to authenticated
using (
  public.is_project_member(id)
  or public.is_project_owner(id)
);

create policy "Project admins can update project"
on public.projects
for update
to authenticated
using (
  public.is_project_admin(id)
  or public.is_project_owner(id)
)
with check (
  public.is_project_admin(id)
  or public.is_project_owner(id)
);

create policy "Project admins can delete project"
on public.projects
for delete
to authenticated
using (
  public.is_project_admin(id)
  or public.is_project_owner(id)
);

create policy "Project members can view members"
on public.project_members
for select
to authenticated
using (
  public.is_project_member(project_id)
  or public.is_project_owner(project_id)
);

create policy "Project admins can insert members"
on public.project_members
for insert
to authenticated
with check (
  public.is_project_admin(project_id)
  or public.is_project_owner(project_id)
);

create policy "Project admins can delete members"
on public.project_members
for delete
to authenticated
using (
  user_id = auth.uid()
  or public.is_project_admin(project_id)
  or public.is_project_owner(project_id)
);

create policy "Project members can view tasks"
on public.tasks
for select
to authenticated
using (
  public.is_project_member(project_id)
  or public.is_project_owner(project_id)
);

create policy "Project members can create tasks"
on public.tasks
for insert
to authenticated
with check (
  created_by = auth.uid()
  and (
    public.is_project_member(project_id)
    or public.is_project_owner(project_id)
  )
);

create policy "Project members can update tasks"
on public.tasks
for update
to authenticated
using (
  public.is_project_member(project_id)
  or public.is_project_owner(project_id)
)
with check (
  public.is_project_member(project_id)
  or public.is_project_owner(project_id)
);

create policy "Task creator or admin can delete tasks"
on public.tasks
for delete
to authenticated
using (
  created_by = auth.uid()
  or public.is_project_admin(project_id)
  or public.is_project_owner(project_id)
);

create policy "Project members can view activity"
on public.activity_log
for select
to authenticated
using (
  project_id is null
  or public.is_project_member(project_id)
  or public.is_project_owner(project_id)
);

create policy "Authenticated users can insert activity"
on public.activity_log
for insert
to authenticated
with check (
  user_id = auth.uid()
  and (
    project_id is null
    or public.is_project_member(project_id)
    or public.is_project_owner(project_id)
  )
);

grant execute on function public.is_project_owner(uuid, uuid) to authenticated;
grant execute on function public.is_project_member(uuid, uuid) to authenticated;
grant execute on function public.is_project_admin(uuid, uuid) to authenticated;
