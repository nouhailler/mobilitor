import Dexie, { type Table } from 'dexie';
import type {
  Station,
  Line,
  GeoRecord,
  Source,
  Place,
  Scenario,
  Preference,
  Job,
  RecordRow,
} from './schema';
import { datasetTables } from './schema';
const base = Object.fromEntries(datasetTables.map((name) => [name, 'id,sourceId,externalId']));
export const v1Schema = {
  ...base,
  stations: 'id,sourceId,externalId,name,latitude,longitude',
  dataSources: 'id,checksum,importedAt',
  savedPlaces: 'id,name',
  savedScenarios: 'id,name',
  preferences: 'key',
  cachedIsochrones: 'id,sourceId',
  importJobs: 'id,status',
};
export class LocalDatabase extends Dexie {
  stations!: Table<Station, string>;
  lines!: Table<Line, string>;
  lineGeometries!: Table<GeoRecord, string>;
  administrativeAreas!: Table<GeoRecord, string>;
  dataSources!: Table<Source, string>;
  savedPlaces!: Table<Place, string>;
  savedScenarios!: Table<Scenario, string>;
  preferences!: Table<Preference, string>;
  importJobs!: Table<Job, string>;
  constructor(name = 'mobilite-isochrones-db') {
    super(name);
    this.version(1).stores(v1Schema);
    this.version(2)
      .stores({ ...v1Schema, gtfsStopTimes: 'id,sourceId,externalId,[sourceId+externalId]' })
      .upgrade(async (tx) => {
        await tx
          .table('importJobs')
          .where('status')
          .equals('running')
          .modify({ status: 'failed', message: 'Import interrompu ; réimportez le fichier.' });
      });
  }
  rows(name: string) {
    return this.table<RecordRow, string>(name);
  }
}
export const db = new LocalDatabase();
export async function clearDataset(id: string) {
  await db.transaction(
    'rw',
    [...datasetTables.map((t) => db.table(t)), db.dataSources, db.table('cachedIsochrones')],
    async () => {
      for (const name of [...datasetTables, 'cachedIsochrones'])
        await db.table(name).where('sourceId').equals(id).delete();
      await db.dataSources.delete(id);
    },
  );
}
export async function clearAll() {
  await db.transaction('rw', db.tables, async () => {
    for (const table of db.tables) await table.clear();
  });
}
