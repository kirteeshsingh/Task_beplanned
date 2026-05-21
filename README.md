# Beplanned

Beplanned is a dark-first developer productivity workspace for project planning, team membership, task boards, and dashboard reporting. It uses Supabase for authentication, Postgres storage, and Row Level Security.

## Feature Overview

- Email and password authentication with protected routes.
- Session restore after refresh through Supabase Auth.
- Workspace creation, editing, deletion, and sidebar listing.
- Automatic admin membership for the workspace creator.
- Member invite and removal by workspace admins.
- Kanban task board with backlog, to do, in progress, review, and done states.
- Task create, edit, delete, priority, due date, assignee, and tags.
- Assigned queue page for personal tasks.
- Dashboard metrics for workspace count, task count, completion, risk, charts, activity, and searchable assigned tasks.
- Dark developer-tool interface with responsive desktop and mobile navigation.

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Supabase Auth
- Supabase Postgres
- Supabase Row Level Security
- React Hook Form
- Zod
- Recharts
- Framer Motion
- Playwright

## Authentication Flow

Supabase Auth manages signup, login, logout, and session persistence. The app stores the active Supabase user in `AuthContext` and loads the matching `profiles` row from Postgres.

When a new auth user is created, the database trigger `public.handle_new_user()` inserts or updates the matching `public.profiles` row.

Protected pages are nested under `ProtectedRoute`. Unauthenticated visitors are redirected to `/login`.

## Role-Based Access

Beplanned uses `project_members.role` for workspace-level access.

- `admin`: workspace owner/admin. Can update and delete the workspace, add or remove members, create tasks, update tasks, and delete created tasks or any task through owner/admin checks.
- `member`: can view workspace data and tasks for workspaces they belong to. Members can create and update tasks inside their workspaces under the current policy set. Task deletion is limited to the task creator, workspace admin, or workspace owner.

The frontend hides admin-only controls where possible. Supabase RLS is the source of truth for enforcement.

## Supabase Setup

1. Create a Supabase project.
2. Enable email/password authentication in Supabase Auth.
3. Add local and deployed URLs under Authentication -> URL Configuration.
4. Run the SQL migrations in order from the `supabase/migrations` folder.
5. Confirm these tables exist in `public`:
   - `profiles`
   - `projects`
   - `project_members`
   - `tasks`
   - `activity_log`

## Migration Order

Fresh setup should run migrations in filename order:

1. `supabase/migrations/20260514222852_create_core_tables_v1.sql`
2. `supabase/migrations/20260516000100_beplanned_final_rls_bootstrap.sql`

The second migration repairs the older RLS policies, adds security-definer helper functions, installs the project membership bootstrap trigger, backfills creator admin memberships, and grants helper execution to authenticated users.

The workspace creator becomes admin through:

```sql
create trigger on_project_created
  after insert on public.projects
  for each row
  execute procedure public.handle_new_project();
```

For an empty remote database where migrations are not available, run:

```text
supabase/bootstrap_beplanned_schema_and_rls.sql
```

Do not run only the old core migration in production. It must be followed by the final RLS migration.

## Environment Variables

Copy `.env.example` to `.env` for local development:

```bash
cp .env.example .env
```

Set:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

For E2E tests, copy `.env.e2e.example` to `.env.e2e`:

```bash
cp .env.e2e.example .env.e2e
```

Set:

```bash
E2E_EMAIL=test-user@example.com
E2E_PASSWORD=TestUser123!
E2E_FULL_NAME=Beplanned Test User
```

Use credentials for a real Supabase test user. The password must be at least 8 characters.

## Local Setup

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

## Quality Checks

```bash
npm run lint
npm run typecheck
npm run build
```

## E2E Testing

Install Playwright browsers if needed:

```bash
npx playwright install chromium
```

Run:

```bash
npm run test:e2e
```

The workflow tests require `.env.e2e` with valid `E2E_EMAIL` and `E2E_PASSWORD`. If credentials are missing, Playwright prints a clear skip reason for the credential-dependent tests. Login validation and unauthenticated redirect tests still run.

The E2E suite checks:

- login validation
- protected route redirect
- login or signup fallback
- session restore
- workspace create
- task create
- task status update
- dashboard task search and filters
- workspace delete
- logout
- mobile sidebar navigation

## Deployment

For Vercel, Railway, Netlify, or another static hosting provider:

1. Set `VITE_SUPABASE_URL`.
2. Set `VITE_SUPABASE_ANON_KEY`.
3. Run migrations in Supabase before deploying.
4. Add the production site URL to Supabase Authentication -> URL Configuration.
5. Build with `npm run build`.
6. Serve the `dist` folder.

## Folder Structure

```text
src/components      Shared UI, auth, layout, project, and task components
src/contexts        Auth, workspace, and task state providers
src/hooks           Context hooks
src/lib             Supabase client, database types, utilities
src/pages           Route pages
supabase/migrations Ordered database migrations
e2e                 Playwright tests
public              Static assets
```

## Known Limitations

- Drag and drop uses `react-beautiful-dnd`, which is stable for this app but no longer the newest drag-and-drop option.
- E2E member-role testing needs two real Supabase users to fully verify admin versus member behavior.
- Email confirmation behavior depends on your Supabase Auth settings.

## Troubleshooting

- If auth calls fail, confirm `.env` contains valid Supabase values and restart the dev server.
- If `public.profiles does not exist`, run the migrations or the bootstrap SQL file.
- If newly created workspaces do not appear, confirm the final RLS migration installed `on_project_created`.
- If E2E workflow tests skip, create `.env.e2e` with a real test user and 8+ character password.
- If password reset emails do not arrive, configure Supabase SMTP and redirect URLs.
