import { test, expect, type Page } from '@playwright/test';
async function onboard(page: Page) {
  await page.getByRole('dialog', { name: 'Welcome to Mobilitor' }).waitFor();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Third-party data and liability' })).toBeVisible();
  await page.getByRole('checkbox', { name: /I have read the information/ }).check();
  await page.getByRole('button', { name: 'Start exploring' }).click();
}
async function navigate(page: Page, name: string) {
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name, exact: true })
    .click();
}
test('anglais depuis le premier onboarding, langue persistée et tous les écrans traduits', async ({
  page,
}) => {
  await page.goto('/');
  const welcome = page.getByRole('dialog', { name: 'Bienvenue dans Mobilitor' });
  await welcome.getByRole('combobox').selectOption('en');
  await onboard(page);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { name: 'How far can you go?' })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Lines', exact: true })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Boundaries', exact: true })).toBeVisible();
  await navigate(page, 'Sources');
  await expect(page.getByRole('heading', { name: 'Every dataset has a source.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Rail stations and stops' })).toBeVisible();
  await navigate(page, 'Settings');
  await expect(page.getByLabel('Interface language', { exact: true })).toHaveValue('en');
  await expect(page.getByLabel('Interface theme', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { name: 'You stay in control.' })).toBeVisible();
  await navigate(page, 'System');
  await expect(page.getByRole('heading', { name: 'System settings' })).toBeVisible();
  await expect(page.getByText('27 October 2026', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Check for updates', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Check complete');
  await navigate(page, 'About & legal notice');
  await expect(page.getByRole('heading', { name: 'About and legal notice' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Third-party data and liability' })).toBeVisible();
  await page
    .locator('header')
    .getByRole('combobox', { name: 'Langue / Language' })
    .selectOption('fr');
  await expect(page.getByRole('heading', { name: 'À propos et mentions légales' })).toBeVisible();
});
test('import, erreurs, trajet et recalcul hors ligne en anglais sans traduction des arrêts', async ({
  page,
  context,
}) => {
  await page.goto('/?lang=en');
  await onboard(page);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await navigate(page, 'My data');
  const field = page.locator('label').filter({ has: page.getByLabel('Producer', { exact: true }) });
  await field.getByRole('button', { name: 'Show an explanation' }).click();
  await expect(field.getByRole('tooltip')).toContainText('organisation that produced');
  await page.getByLabel('File to import').setInputFiles('data/fixtures/synthetic-gtfs.zip');
  await page.getByLabel('Producer', { exact: true }).fill('Synthetic test fixture');
  await page.getByLabel('Licence checked on the official dataset page').fill('CC0');
  await page.getByRole('button', { name: 'Validate and install' }).click();
  await expect(page.getByRole('status')).toContainText('Import complete');
  await navigate(page, 'Explore');
  await page.getByRole('button', { name: 'Journey', exact: true }).click();
  await page.getByLabel('Origin', { exact: true }).fill('Alpha');
  await page.getByRole('button', { name: /Test Alpha/ }).click();
  await page.getByLabel('Destination', { exact: true }).fill('Charlie');
  await page.getByRole('button', { name: /Test Charlie/ }).click();
  await page.getByLabel('Departure date').fill('2027-01-01');
  await page.getByRole('button', { name: 'Find my journey' }).click();
  await expect(page.getByRole('alert')).toContainText("outside the feed's coverage");
  await page.getByLabel('Departure date').fill('2026-10-09');
  await page.getByRole('button', { name: 'Find my journey' }).click();
  await expect(page.getByText('25 min', { exact: true })).toBeVisible();
  await expect(page.getByText('Line R · trip T:01').first()).toBeVisible();
  await page
    .locator('header')
    .getByRole('combobox', { name: 'Langue / Language' })
    .selectOption('fr');
  await expect(page.getByText('25 min', { exact: true })).toBeVisible();
  await page
    .locator('header')
    .getByRole('combobox', { name: 'Langue / Language' })
    .selectOption('en');
  await expect(page.getByText('25 min', { exact: true })).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByText('Offline', { exact: true })).toBeVisible();
  await page.getByLabel('Origin', { exact: true }).fill('Alpha');
  await page.getByRole('button', { name: /Test Alpha/ }).click();
  await page.getByLabel('Departure date').fill('2026-10-09');
  await page.getByRole('button', { name: 'Calculate my isochrone' }).click();
  await expect(page.getByRole('heading', { name: '3 reachable stops' })).toBeVisible();
  const manifest = await page.evaluate(
    async () => await (await fetch('/manifest.en.webmanifest')).json(),
  );
  expect(manifest.lang).toBe('en');
});
test('comparaison, installation guidée et écran mobile en anglais', async ({ page }) => {
  await page.addInitScript(() =>
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
    }),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?lang=en');
  await onboard(page);
  await navigate(page, 'Compare');
  await expect(page.getByRole('heading', { name: 'Compare your origins.' })).toBeVisible();
  await expect(page.getByLabel('Origin 3 (optional)', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '↧ Install the app', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Install Mobilitor' })).toBeVisible();
  await expect(page.getByText(/Add to Home Screen/).last()).toBeVisible();
  await page.getByRole('button', { name: 'Got it', exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/english-mobile.png', fullPage: true });
});
