-- ============================================================
-- Beplanned final RLS and membership bootstrap
-- This migration is intentionally idempotent so it can repair older
-- policy sets after the core tables migration has created the schema.
-- ============================================================

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.tasks enable row level security;
alter table public.activity_log enable row level security;

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

insert into public.project_members (project_id, user_id, role)
select id, owner_id, 'admin'
from public.projects
on conflict (project_id, user_id) do update
  set role = 'admin';

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
