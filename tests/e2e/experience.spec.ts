import { test, expect, type Page } from '@playwright/test';
async function onboard(page: Page) {
  await page.getByRole('dialog', { name: 'Bienvenue dans Mobilitor' }).waitFor();
  await page.getByRole('button', { name: 'Continuer', exact: true }).click();
  await page.getByRole('button', { name: 'Continuer', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Données tierces et responsabilité' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Commencer à explorer' })).toBeDisabled();
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
test('onboarding légal, menu catégorisé, guides et thème sombre persistant', async ({ page }) => {
  await page.goto('/');
  await onboard(page);
  await expect(page.getByRole('complementary', { name: 'Aide de cet écran' })).toContainText(
    'Explorer et calculer',
  );
  await page.getByRole('button', { name: 'J’ai compris, masquer ce guide' }).click();
  await page.getByRole('button', { name: 'Ouvrir le menu' }).click();
  await expect(page.getByRole('heading', { name: 'Se déplacer' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Données et bibliothèque' })).toBeVisible();
  await page.getByRole('button', { name: 'Fermer la fenêtre' }).click();
  await page.getByRole('button', { name: 'Activer le thème sombre' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.screenshot({ path: 'test-results/theme-dark.png', fullPage: true });
  await navigate(page, 'Mes données');
  await expect(page.getByRole('complementary', { name: 'Aide de cet écran' })).toContainText(
    'Installer vos données',
  );
  const field = page
    .locator('label')
    .filter({ has: page.getByLabel('Producteur', { exact: true }) });
  await field.getByRole('button', { name: 'Afficher une explication' }).click();
  await expect(field.getByRole('tooltip')).toBeVisible();
  await expect(field.getByRole('tooltip')).toContainText('Organisme ayant produit');
  await field.getByRole('button', { name: 'Afficher une explication' }).press('Escape');
  await expect(field.getByRole('tooltip')).not.toBeVisible();
  await field.getByRole('button', { name: 'Afficher une explication' }).press('Enter');
  await expect(field.getByRole('tooltip')).toBeVisible();
  await navigate(page, 'Système');
  await expect(page.getByRole('heading', { name: 'Paramètres système' })).toBeVisible();
  await expect(page.getByText('16 octobre 2026', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Vérifier les mises à jour', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Vérification terminée');
  await page.getByRole('button', { name: 'Forcer la mise à jour', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Aucune nouvelle version');
  await page.getByRole('button', { name: 'Revoir l’onboarding et les mentions légales' }).click();
  await expect(page.getByRole('dialog', { name: 'Bienvenue dans Mobilitor' })).toBeVisible();
});
test('guide d’installation quand le dialogue natif n’est pas disponible', async ({ page }) => {
  await page.addInitScript(() =>
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
    }),
  );
  await page.goto('/');
  await onboard(page);
  await page.getByRole('button', { name: '↧ Installer l’application', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Installer Mobilitor' })).toBeVisible();
  await expect(page.getByText(/iPhone \/ iPad/)).toBeVisible();
  await expect(page.getByText(/Sur l’écran d’accueil/).last()).toBeVisible();
});
test('le bouton utilise le prompt fourni par le navigateur puis détecte appinstalled', async ({
  page,
}) => {
  await page.goto('/');
  await onboard(page);
  await page.evaluate(() => {
    const event = new Event('beforeinstallprompt', { cancelable: true });
    Object.assign(event, {
      prompt: async () => {
        document.documentElement.dataset.installTest = 'prompted';
        return { outcome: 'accepted' };
      },
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    });
    window.dispatchEvent(event);
  });
  await page.getByRole('button', { name: '↧ Installer l’application', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-install-test', 'prompted');
  await page.evaluate(() => window.dispatchEvent(new Event('appinstalled')));
  await expect(
    page.getByRole('button', { name: '✓ Application installée', exact: true }),
  ).toBeDisabled();
});
