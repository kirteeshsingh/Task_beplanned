import type { Page } from '@playwright/test';
import { test } from '@playwright/test';

const ALLOWED_CONSOLE_PATTERNS = [
  /Download the React DevTools/i,
  /react-beautiful-dnd/i,
  /@babel\/parser/,
];

export function attachConsoleFailOnError(page: Page, errors: string[]) {
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (ALLOWED_CONSOLE_PATTERNS.some((re) => re.test(text))) return;
    errors.push(text);
  });
  page.on('pageerror', (err) => {
    errors.push(err.message);
  });
}

export function requireE2ECredentials(email: string, password: string) {
  const missing =
    !email ||
    !password ||
    password.length < 8 ||
    email === 'test-user@example.com' ||
    password === 'TestUser123!';

  if (missing) {
    test.skip(
      true,
      [
        'E2E credentials are required for full Beplanned workflow tests.',
        'Create a real Supabase test user, then set E2E_EMAIL and E2E_PASSWORD in .env.e2e.',
        'Use .env.e2e.example as the template.',
      ].join(' ')
    );
  }
}

export async function dismissConfigBannerIfPresent(page: Page) {
  const banner = page.getByRole('alert').filter({
    hasText: /VITE_SUPABASE_URL/,
  });
  if ((await banner.count()) > 0) {
    throw new Error(
      'Supabase env not loaded: ensure .env has VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then restart npm run dev.'
    );
  }
}

export async function ensureAuthedSession(
  page: Page,
  email: string,
  password: string,
  fullName: string
) {
  await page.goto('/login');
  await dismissConfigBannerIfPresent(page);

  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();

  try {
    await page.waitForURL('**/dashboard', { timeout: 25_000 });
    return;
  } catch {
    /* try signup */
  }

  await page.goto('/signup');
  await dismissConfigBannerIfPresent(page);
  await page.getByLabel('Full name').fill(fullName);
  await page.getByLabel('Work email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: /create account/i }).click();

  try {
    await page.waitForURL('**/dashboard', { timeout: 25_000 });
    return;
  } catch {
    /* email confirmation */
  }

  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('**/dashboard', { timeout: 35_000 });
}

export async function signOutViaMenu(page: Page) {
  await page.locator('header').getByRole('button', { name: 'Account menu' }).click();
  await page.getByRole('menuitem', { name: /sign out/i }).click();
  await page.waitForURL(/\/login/, { timeout: 20_000 });
}
