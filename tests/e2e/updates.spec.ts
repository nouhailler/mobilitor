import { test, expect, type Page } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
let server: Server;
let origin: string;
let revision = 0;
const root = resolve('dist');
test.beforeEach(async () => {
  revision = 0;
  server = createServer(async (req, res) => {
    try {
      const path = new URL(req.url || '/', 'http://local').pathname;
      const file = resolve(root, `.${path === '/' ? '/index.html' : path}`);
      if (!file.startsWith(`${root}/`)) {
        res.writeHead(403).end();
        return;
      }
      let content = await readFile(file);
      if (path === '/sw.js')
        content = Buffer.concat([
          content,
          Buffer.from(`\n// Integration test SW revision ${revision}\n`),
        ]);
      const types: Record<string, string> = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.webmanifest': 'application/manifest+json',
        '.svg': 'image/svg+xml',
        '.png': 'image/png',
      };
      res.writeHead(200, {
        'Content-Type': types[extname(file)] || 'application/octet-stream',
        'Cache-Control': 'no-store',
        'Service-Worker-Allowed': '/',
      });
      res.end(content);
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Test server failed');
  origin = `http://127.0.0.1:${address.port}`;
});
test.afterEach(async () => {
  server.closeAllConnections();
  await new Promise<void>((done) => server.close(() => done()));
});
async function setup(page: Page) {
  await page.addInitScript(() =>
    sessionStorage.setItem(
      'test:loads',
      String(Number(sessionStorage.getItem('test:loads') || 0) + 1),
    ),
  );
  await page.goto(origin);
  await page.getByRole('dialog', { name: 'Bienvenue dans Mobilitor' }).waitFor();
  await page.getByRole('button', { name: 'Continuer', exact: true }).click();
  await page.getByRole('button', { name: 'Continuer', exact: true }).click();
  await page.getByRole('checkbox', { name: /J’ai lu les informations/ }).check();
  await page.getByRole('button', { name: 'Commencer à explorer' }).click();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await page.evaluate(
    () =>
      new Promise<void>((done, reject) => {
        const request = indexedDB.open('mobilite-isochrones-db');
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction('savedPlaces', 'readwrite');
          tx.objectStore('savedPlaces').put({
            id: 'update-fixture',
            name: 'Lieu de test conservé',
            latitude: 48,
            longitude: 2,
          });
          tx.oncomplete = () => {
            db.close();
            done();
          };
          tx.onerror = () => reject(tx.error);
        };
        request.onerror = () => reject(request.error);
      }),
  );
}
async function navigate(page: Page, name: string) {
  await page.getByRole('button', { name: 'Ouvrir le menu' }).click();
  await page
    .getByRole('navigation', { name: 'Navigation principale' })
    .getByRole('link', { name, exact: true })
    .click();
}
async function loads(page: Page) {
  return page.evaluate(() => Number(sessionStorage.getItem('test:loads')));
}
test('vérification périodique et activation automatiques conservent les favoris', async ({
  page,
}) => {
  test.setTimeout(45000);
  await page.clock.install();
  await setup(page);
  const before = await loads(page);
  revision++;
  const reloaded = page.waitForEvent('framenavigated', {
    predicate: (frame) => frame === page.mainFrame(),
  });
  await page.clock.fastForward(30 * 60 * 1000 + 1000);
  await reloaded;
  await page.waitForLoadState('domcontentloaded');
  await expect.poll(() => loads(page), { timeout: 20000 }).toBeGreaterThan(before);
  await navigate(page, 'Paramètres');
  await expect(page.getByText('Lieu de test conservé', { exact: true })).toBeVisible();
});
test('forcer respecte un verrou actif dans un autre onglet puis applique la version sans effacement', async ({
  page,
  context,
}) => {
  test.setTimeout(45000);
  await setup(page);
  await page.evaluate(
    () =>
      new Promise<void>((ready) => {
        void navigator.locks.request('mobilitor-active-operation', { mode: 'shared' }, async () => {
          const hold = new Promise<void>((resolve) => {
            (window as typeof window & { releaseTestLock?: () => void }).releaseTestLock = resolve;
          });
          ready();
          await hold;
        });
      }),
  );
  const other = await context.newPage();
  await other.addInitScript(() =>
    sessionStorage.setItem(
      'test:loads',
      String(Number(sessionStorage.getItem('test:loads') || 0) + 1),
    ),
  );
  await other.goto(`${origin}/#/systeme`);
  await other.getByRole('heading', { name: 'Paramètres système' }).waitFor();
  await other.evaluate(() => navigator.serviceWorker.ready);
  const before = await loads(other);
  revision++;
  await other.getByRole('button', { name: 'Vérifier les mises à jour', exact: true }).click();
  await expect(other.locator('.update-banner')).toBeVisible();
  await other.getByRole('button', { name: 'Forcer la mise à jour', exact: true }).click();
  await expect(
    other.getByText('Mise à jour en attente : une autre fenêtre utilise les données.').last(),
  ).toBeVisible();
  expect(await loads(other)).toBe(before);
  const reloaded = other.waitForEvent('framenavigated', {
    predicate: (frame) => frame === other.mainFrame(),
  });
  await page.evaluate(() =>
    (window as typeof window & { releaseTestLock?: () => void }).releaseTestLock?.(),
  );
  await other.getByRole('button', { name: 'Forcer la mise à jour', exact: true }).click();
  await reloaded;
  await other.waitForLoadState('domcontentloaded');
  await expect.poll(() => loads(other), { timeout: 15000 }).toBeGreaterThan(before);
  await navigate(other, 'Paramètres');
  await expect(other.getByText('Lieu de test conservé', { exact: true })).toBeVisible();
  await other.close();
});
