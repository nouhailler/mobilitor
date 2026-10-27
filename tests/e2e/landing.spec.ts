import { test, expect } from '@playwright/test';
test('présentation française et anglaise sans onboarding, FAQ et accès à l’application', async ({
  page,
}) => {
  await page.goto('/#/presentation/fr');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Vos prochains trajets.');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('img', { name: /Interface française/ })).toBeVisible();
  await page
    .getByRole('navigation', { name: 'Navigation de présentation' })
    .getByRole('button', { name: 'Questions fréquentes' })
    .click();
  await page
    .locator('summary')
    .filter({ hasText: 'Les données de transport sont-elles déjà installées ?' })
    .click();
  await expect(page.getByText(/Aucun jeu régional ou national exhaustif/)).toBeVisible();
  await page.getByRole('link', { name: 'EN', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Your next journeys.');
  await expect(page.getByRole('img', { name: /Mobilitor in English/ })).toBeVisible();
  await expect(page).toHaveURL(/#\/presentation\/en$/);
  await page.getByRole('button', { name: 'Legal notice & privacy', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Legal information and privacy' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Third-party data and liability' })).toBeVisible();
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('link', { name: 'Open the app', exact: true }).first().click();
  await expect(page.getByRole('dialog', { name: 'Welcome to Mobilitor' })).toBeVisible();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('checkbox', { name: /I have read the information/ }).check();
  await page.getByRole('button', { name: 'Start exploring' }).click();
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Overview', exact: true })
    .click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('link', { name: 'Open the app', exact: true }).first().click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});
test('langue de la présentation persistée et mise en page mobile sans débordement', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#/presentation/en');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Your next journeys.');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('link', { name: 'FR', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Vos prochains trajets.');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Vos prochains trajets.');
  await page.screenshot({ path: 'test-results/landing-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: 'test-results/landing-desktop.png', fullPage: true });
});
test('installation guidée depuis la présentation', async ({ page }) => {
  await page.addInitScript(() =>
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
    }),
  );
  await page.goto('/#/presentation/en');
  await page.getByRole('button', { name: '↧ Install the app', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Install Mobilitor' })).toBeVisible();
  await expect(page.getByText(/Add to Home Screen/).last()).toBeVisible();
});
