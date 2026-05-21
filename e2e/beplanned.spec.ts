import { test, expect } from '@playwright/test';
import {
  attachConsoleFailOnError,
  dismissConfigBannerIfPresent,
  ensureAuthedSession,
  requireE2ECredentials,
  signOutViaMenu,
} from './helpers';

const email = process.env.E2E_EMAIL ?? '';
const password = process.env.E2E_PASSWORD ?? '';
const fullName = process.env.E2E_FULL_NAME ?? 'Beplanned Test User';

test.describe('Beplanned end-to-end', () => {
  test('login validation shows field errors', async ({ page }) => {
    await page.goto('/login');
    await dismissConfigBannerIfPresent(page);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText(/valid email|email/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('unauthenticated users are redirected to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('desktop: auth, session, workspace, task, dashboard filters, logout', async ({ page }) => {
    requireE2ECredentials(email, password);

    const consoleErrors: string[] = [];
    attachConsoleFailOnError(page, consoleErrors);

    await page.setViewportSize({ width: 1280, height: 800 });
    await ensureAuthedSession(page, email, password, fullName);

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByTestId('dashboard-heading')).toBeVisible({ timeout: 20_000 });

    await page.reload();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByTestId('dashboard-heading')).toBeVisible({ timeout: 20_000 });

    await page.goto('/projects');
    await expect(page.getByTestId('workspaces-heading')).toBeVisible();

    const workspaceTitle = `E2E ${Date.now()}`;
    await page.getByTestId('new-workspace-button').click();
    await page.getByTestId('workspace-name-input').fill(workspaceTitle);
    await page.getByTestId('workspace-description-input').fill('Automated Beplanned workspace');
    await page.getByTestId('create-workspace-submit').click();
    await page.waitForURL(/\/projects\/[^/]+/, { timeout: 45_000 });
    await expect(page.getByTestId('workspace-detail')).toBeVisible();

    await page.getByTestId('add-task-button').click();
    await page.getByTestId('task-title-input').fill('E2E Beplanned task');
    await page.getByTestId('task-description-input').fill('E2E description body');
    await page.getByTestId('task-due-date-input').fill('2099-12-31');
    await page.getByTestId('task-priority-select').selectOption('high');
    await page.getByTestId('task-submit-button').click();
    await expect(page.getByText('E2E Beplanned task').first()).toBeVisible({ timeout: 20_000 });

    await page.getByText('E2E Beplanned task').first().click();
    await page.getByTestId('task-status-select').selectOption('in_progress');
    await page.getByTestId('task-submit-button').click();
    await expect(page.getByText('E2E Beplanned task').first()).toBeVisible({ timeout: 20_000 });

    await page.goto('/dashboard');
    await expect(page.getByTestId('dashboard-heading')).toBeVisible({ timeout: 20_000 });
    await page.getByTestId('dashboard-task-search').fill('Beplanned task');
    await page.getByTestId('dashboard-status-filter').selectOption('in_progress');
    await page.getByTestId('dashboard-priority-filter').selectOption('high');
    await expect(page.getByText('E2E Beplanned task').first()).toBeVisible({ timeout: 20_000 });

    await page.goto('/projects');
    const workspaceLink = page.getByTestId('workspace-card').filter({ hasText: workspaceTitle }).first();
    await expect(workspaceLink).toBeVisible({ timeout: 20_000 });
    await workspaceLink.click();

    await page.getByTestId('workspace-tab-settings').click();
    page.once('dialog', (dialog) => {
      dialog.accept().catch(() => {});
    });
    await page.getByRole('button', { name: /delete project/i }).click();
    await page.waitForURL('**/projects', { timeout: 25_000 });
    await expect(page.getByTestId('workspaces-heading')).toBeVisible();

    await signOutViaMenu(page);
    await expect(page).toHaveURL(/\/login/);

    const bad = consoleErrors.filter((m) => !/favicon|ResizeObserver|react-beautiful-dnd/i.test(m));
    expect(bad, `Browser console errors:\n${bad.join('\n')}`).toEqual([]);
  });

  test('mobile: sidebar opens and navigates', async ({ page }) => {
    requireE2ECredentials(email, password);

    const consoleErrors: string[] = [];
    attachConsoleFailOnError(page, consoleErrors);

    await page.setViewportSize({ width: 390, height: 844 });
    await ensureAuthedSession(page, email, password, fullName);

    await page.getByRole('button', { name: /open menu/i }).click();
    await page.getByTestId('sidebar-projects').click();
    await expect(page.getByTestId('workspaces-heading')).toBeVisible();

    const bad = consoleErrors.filter((m) => !/favicon|ResizeObserver|react-beautiful-dnd/i.test(m));
    expect(bad, `Browser console errors:\n${bad.join('\n')}`).toEqual([]);
  });
});
