import { it, expect } from 'vitest';
import Dexie from 'dexie';
import { LocalDatabase, v1Schema } from '../../src/db/database';
it('migre v1 vers v2 en conservant les lieux', async () => {
  const name = `migration-${Date.now()}`;
  const old = new Dexie(name);
  old.version(1).stores(v1Schema);
  await old.table('savedPlaces').put({ id: 'home', name: 'Maison', latitude: 48, longitude: 2 });
  await old.table('importJobs').put({ id: 'interrupted', status: 'running' });
  old.close();
  const current = new LocalDatabase(name);
  await current.open();
  expect(await current.savedPlaces.count()).toBe(1);
  expect((await current.importJobs.get('interrupted'))?.status).toBe('failed');
  await current.delete();
});
