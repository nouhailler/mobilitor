import { beforeEach, it, expect } from 'vitest';
import { zipSync, strToU8 } from 'fflate';
import { db, clearAll, clearDataset } from '../../src/db/database';
import { importDataset } from '../../src/imports/importManager';
import { parseGTFS } from '../../src/imports/gtfsImport';
import { calculateLocal } from '../../src/routing/localEngine';
import { readFileSync } from 'node:fs';
const bytes = new Uint8Array(readFileSync('data/fixtures/synthetic-gtfs.zip'));
const makeFile = (data: Uint8Array, name = 'test.zip') =>
  ({
    name,
    size: data.byteLength,
    arrayBuffer: async () => data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength),
  }) as File;
const metadata = {
  provider: 'Fixture synthétique',
  license: 'CC0',
  attribution: 'Tests uniquement',
  url: '',
};
beforeEach(async () => {
  await clearAll();
});
it('importe un GTFS puis calcule sans réseau, persiste et supprime', async () => {
  const source = await importDataset(makeFile(bytes), metadata);
  expect(await db.stations.count()).toBe(3);
  db.close();
  await db.open();
  const r = await calculateLocal({
    sourceId: source.id,
    origin: 'FR:A',
    destination: 'FR:C',
    date: '2026-10-09',
    time: '08:00',
    thresholds: [15, 30, 45, 60],
  });
  expect(r.arrival).toBe(8 * 3600 + 25 * 60);
  expect(r.legs).toHaveLength(2);
  expect(r.stations).toHaveLength(3);
  await expect(importDataset(makeFile(bytes), metadata)).rejects.toThrow('déjà importée');
  await clearDataset(source.id);
  expect(await db.stations.count()).toBe(0);
});
it('refuse un GTFS incohérent et les capacités non prises en charge', () => {
  expect(() => parseGTFS(zipSync({ 'stops.txt': strToU8('stop_id,stop_name\nA,Gare') }))).toThrow();
  expect(() => parseGTFS(zipSync({ 'frequencies.txt': strToU8('trip_id\nT') }))).toThrow(
    'pas pris en charge',
  );
});
it('remplace uniquement après validation et conserve les favoris', async () => {
  const first = await importDataset(makeFile(bytes), metadata);
  await db.savedPlaces.put({ id: 'home', name: 'Maison', latitude: 48, longitude: 2 });
  await expect(
    importDataset(makeFile(strToU8('invalid'), 'broken.geojson'), {
      ...metadata,
      replaceId: first.id,
    }),
  ).rejects.toThrow();
  expect(await db.stations.count()).toBe(3);
  const next = await importDataset(
    makeFile(strToU8('id,name,latitude,longitude\nX,Gare,48,2'), 'stations.csv'),
    { ...metadata, replaceId: first.id },
  );
  expect(await db.dataSources.count()).toBe(1);
  expect((await db.dataSources.toArray())[0].id).toBe(next.id);
  expect(await db.savedPlaces.count()).toBe(1);
});
it('rollback intégral en cas d’erreur d’écriture', async () => {
  const first = await importDataset(makeFile(bytes), metadata);
  const fail = () => {
    throw new DOMException('Quota dépassé', 'QuotaExceededError');
  };
  db.dataSources.hook('creating', fail);
  try {
    await expect(
      importDataset(makeFile(strToU8('id,name,latitude,longitude\nX,Gare,48,2'), 'stations.csv'), {
        ...metadata,
        replaceId: first.id,
      }),
    ).rejects.toThrow();
    expect(await db.stations.count()).toBe(3);
    expect(await db.dataSources.count()).toBe(1);
  } finally {
    db.dataSources.hook('creating').unsubscribe(fail);
  }
});
