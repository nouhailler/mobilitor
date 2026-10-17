import { beforeEach, afterEach, it, expect, vi } from 'vitest';
import { UpdateManager } from '../../src/services/updateService';
import { db } from '../../src/db/database';
import { acquireActivity, isBusy, whenUpdateSafe } from '../../src/services/activityService';
import { UPDATE_INTERVAL_MS } from '../../src/release';
let manager: UpdateManager;
let registration: EventTarget & {
  active: object;
  installing: null;
  waiting: ServiceWorker | null;
  update: ReturnType<typeof vi.fn>;
};
let serviceWorker: EventTarget & { register: ReturnType<typeof vi.fn>; controller: object };
beforeEach(async () => {
  await db.preferences.clear();
  registration = Object.assign(new EventTarget(), {
    active: {},
    installing: null,
    waiting: null,
    update: vi.fn().mockResolvedValue(undefined),
  });
  serviceWorker = Object.assign(new EventTarget(), {
    register: vi.fn().mockResolvedValue(registration),
    controller: {},
  });
  Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: serviceWorker });
  Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
  Object.defineProperty(navigator, 'locks', { configurable: true, value: undefined });
  manager = new UpdateManager(true);
});
afterEach(() => {
  manager.dispose();
  vi.useRealTimers();
});
it('enregistre une vérification réussie, sans toucher aux favoris', async () => {
  await db.savedPlaces.put({ id: 'home-update', name: 'Maison', latitude: 48, longitude: 2 });
  await manager.start();
  expect(manager.getSnapshot().lastChecked).toBeTruthy();
  expect((await db.preferences.get('updates.lastChecked'))?.value).toBe(
    manager.getSnapshot().lastChecked,
  );
  expect(await db.savedPlaces.get('home-update')).toBeTruthy();
  await db.savedPlaces.delete('home-update');
});
it('ne remplace pas la dernière réussite en cas d’échec réseau', async () => {
  await manager.start();
  const before = manager.getSnapshot().lastChecked;
  registration.update.mockRejectedValueOnce(new Error('network'));
  await manager.check();
  expect(manager.getSnapshot().error).toContain('Vérification impossible');
  expect(manager.getSnapshot().lastChecked).toBe(before);
});
it('signale le hors-ligne sans appeler le réseau', async () => {
  await manager.start();
  const calls = registration.update.mock.calls.length;
  Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
  await manager.check();
  expect(manager.getSnapshot().error).toContain('Hors ligne');
  expect(registration.update).toHaveBeenCalledTimes(calls);
});
it('vérifie automatiquement toutes les 30 minutes', async () => {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
  await manager.start();
  const calls = registration.update.mock.calls.length;
  await vi.advanceTimersByTimeAsync(UPDATE_INTERVAL_MS);
  expect(registration.update.mock.calls.length).toBeGreaterThan(calls);
});
it('refuse une activation forcée pendant une opération', async () => {
  await manager.start();
  const postMessage = vi.fn();
  registration.waiting = { postMessage } as unknown as ServiceWorker;
  const release = await acquireActivity();
  expect(isBusy()).toBe(true);
  try {
    await manager.force();
    expect(postMessage).not.toHaveBeenCalled();
    expect(manager.getSnapshot().error).toContain('Terminez ou annulez');
  } finally {
    release();
  }
  expect(isBusy()).toBe(false);
});
it('sans nouvelle version, forcer ne supprime rien et ne recharge pas', async () => {
  await manager.start();
  await manager.force();
  expect(manager.getSnapshot().message).toContain('Aucune nouvelle version');
  expect(manager.getSnapshot().applying).toBe(false);
});
it('sans Web Locks, diffère l’activation au prochain lancement', async () => {
  const action = vi.fn();
  expect(await whenUpdateSafe(action)).toBe(false);
  expect(action).not.toHaveBeenCalled();
});
