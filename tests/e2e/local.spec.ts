import { test, expect, type Page } from '@playwright/test';
async function welcome(page: Page) {
  await page.getByRole('dialog', { name: 'Bienvenue dans Mobilitor' }).waitFor();
  await page.getByRole('button', { name: 'Continuer', exact: true }).click();
  await page.getByRole('button', { name: 'Continuer', exact: true }).click();
  await page.getByRole('checkbox', { name: /J’ai lu les informations/ }).check();
  await page.getByRole('button', { name: 'Commencer à explorer' }).click();
}
async function navigate(page: Page, name: string) {
  await page.getByRole('button', { name: 'Ouvrir le menu' }).click();
  await page
    .getByRole('navigation', { name: 'Navigation principale' })
    .getByRole('link', { name, exact: true })
    .click();
}

test('installation, import, calcul, favoris et réouverture hors ligne', async ({
  page,
  context,
}) => {
  await page.goto('/');
  await welcome(page);
  await expect(page.getByText('Votre carte commence ici.')).toBeVisible();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await navigate(page, 'Mes données');
  await page.getByLabel('Fichier à importer').setInputFiles('data/fixtures/synthetic-gtfs.zip');
  await page.getByLabel('Producteur', { exact: true }).fill('Fixture synthétique');
  await page.getByLabel('Licence vérifiée sur la fiche officielle').fill('CC0');
  await page.getByRole('button', { name: 'Valider et installer' }).click();
  await expect(page.getByText(/Import validé/)).toBeVisible({ timeout: 20000 });
  await navigate(page, 'Explorer');
  await page.getByLabel('Point de départ').fill('Alpha');
  await page.getByRole('button', { name: /Test Alpha/ }).click();
  await page.getByLabel('Date de départ').fill('2026-10-09');
  await page.getByRole('button', { name: 'Calculer mon isochrone' }).click();
  await expect(page.getByRole('heading', { name: '3 arrêts atteignables' })).toBeVisible();
  await page.getByRole('button', { name: '☆ Enregistrer' }).click();
  await expect(page.getByText('Lieu enregistré sur cet appareil.')).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('Hors ligne', { exact: true })).toBeVisible();
  await page.getByLabel('Point de départ').fill('Alpha');
  await page.getByRole('button', { name: /Test Alpha/ }).click();
  await page.getByLabel('Date de départ').fill('2026-10-09');
  await page.getByRole('button', { name: 'Calculer mon isochrone' }).click();
  await expect(page.getByRole('heading', { name: '3 arrêts atteignables' })).toBeVisible();
  await navigate(page, 'Paramètres');
  await expect(page.getByText('Test Alpha', { exact: true })).toBeVisible();
  const manifest = await page.evaluate(async () => {
    const r = await fetch('/manifest.webmanifest');
    return r.json();
  });
  expect(manifest.display).toBe('standalone');
});
test('aucune donnée inventée hors ligne', async ({ page, context }) => {
  await page.goto('/');
  await welcome(page);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('Votre carte commence ici.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Calculer mon isochrone' })).toBeDisabled();
});

test('trajet, comparaison, exports, scénario et suppression explicite', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/#/donnees');
  await welcome(page);
  await page.getByLabel('Fichier à importer').setInputFiles('data/fixtures/synthetic-gtfs.zip');
  await page.getByLabel('Producteur', { exact: true }).fill('Fixture synthétique');
  await page.getByLabel('Licence vérifiée sur la fiche officielle').fill('CC0');
  await page.getByRole('button', { name: 'Valider et installer' }).click();
  await expect(page.getByText(/Import validé/)).toBeVisible();
  await navigate(page, 'Explorer');
  await page.getByRole('button', { name: 'Itinéraire', exact: true }).click();
  await page.getByLabel('Point de départ').fill('Alpha');
  await page.getByRole('button', { name: /Test Alpha/ }).click();
  await page.getByLabel('Destination', { exact: true }).fill('Charlie');
  await page.getByRole('button', { name: /Test Charlie/ }).click();
  await page.getByLabel('Date de départ').fill('2026-10-09');
  await page.getByRole('button', { name: 'Trouver mon itinéraire' }).click();
  await expect(page.getByText('25 min', { exact: true })).toBeVisible();
  await navigate(page, 'Comparer');
  await expect(page.getByRole('heading', { name: 'Comparez vos points de départ.' })).toBeVisible();
  await page.getByLabel('Point de départ').fill('Alpha');
  await page.getByRole('button', { name: /Test Alpha/ }).click();
  await page.getByLabel('Origine 2', { exact: true }).fill('Bravo');
  await page.getByRole('button', { name: /Test Bravo/ }).click();
  await page.getByLabel('Date de départ').fill('2026-10-09');
  await page.getByRole('button', { name: 'Comparer les origines' }).click();
  await expect(page.getByText('3 arrêts en 30 min', { exact: true })).toBeVisible();
  await expect(page.getByText('2 arrêts en 30 min', { exact: true })).toBeVisible();
  const jsonDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exporter GeoJSON' }).click();
  expect((await jsonDownload).suggestedFilename()).toBe('mobilite-isochrones.geojson');
  const pngDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exporter la carte PNG' }).click();
  expect((await pngDownload).suggestedFilename()).toBe('mobilite-carte.png');
  await page.getByRole('button', { name: 'Enregistrer le scénario' }).click();
  await expect(page.getByText('Scénario enregistré.')).toBeVisible();
  await navigate(page, 'Paramètres');
  await page.getByRole('link', { name: 'Rouvrir ce scénario' }).click();
  await expect(page.getByLabel('Point de départ')).toHaveValue('Test Alpha');
  await expect(page.getByLabel('Origine 2', { exact: true })).toHaveValue('Test Bravo');
  await navigate(page, 'Mes données');
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Supprimer ce jeu' }).click();
  await expect(page.getByText(/Aucun jeu installé/)).toBeVisible();
  expect(errors).toEqual([]);
});

test('interface mobile sans débordement horizontal', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await welcome(page);
  await expect(page.getByRole('heading', { name: 'Jusqu’où pouvez-vous aller ?' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: 'test-results/mobile.png', fullPage: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({ path: 'test-results/desktop.png', fullPage: true });
});
