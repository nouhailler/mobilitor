import { db } from '../db/database';
import { datasetTables } from '../db/schema';
import type { Source, RecordRow } from '../db/schema';
import { parseGTFS } from './gtfsImport';
import { parseGeographic } from './fileImport';
export interface Metadata {
  provider: string;
  url: string;
  license: string;
  attribution: string;
  replaceId?: string;
}
export function checkSpace(size: number, quota?: number, usage = 0) {
  if (quota !== undefined && size * 12 > quota - usage)
    throw new Error('Stockage insuffisant : prévoir 12 fois la taille du fichier libre.');
}
export async function importDataset(
  file: File,
  metadata: Metadata,
  progress: (message: string) => void = () => {},
) {
  if (file.size > 40 * 1024 * 1024) throw new Error('Fichier > 40 Mo : préparer un sous-réseau.');
  if (!metadata.license.trim() || !metadata.provider.trim())
    throw new Error('Producteur et licence nécessaires.');
  checkSpace(
    file.size,
    (await navigator.storage?.estimate?.())?.quota,
    (await navigator.storage?.estimate?.())?.usage,
  );
  progress('Lecture et vérification SHA-256…');
  const bytes = await file.arrayBuffer();
  const checksum = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))]
    .map((n) => n.toString(16).padStart(2, '0'))
    .join('');
  if (await db.dataSources.where('checksum').equals(checksum).count())
    throw new Error('Cette version est déjà importée.');
  const sourceId = crypto.randomUUID();
  const importedAt = new Date().toISOString();
  const prepared: Record<string, unknown[]> = {};
  let warnings: string[] = [],
    validFrom: string | undefined,
    validTo: string | undefined;
  progress('Validation des données…');
  const gtfs = file.name.toLowerCase().endsWith('.zip');
  if (gtfs) {
    const parsed = parseGTFS(new Uint8Array(bytes));
    warnings = parsed.warnings;
    const f = parsed.files;
    const mapping: Record<string, string> = {
      agency: 'gtfsAgencies',
      stops: 'gtfsStops',
      routes: 'gtfsRoutes',
      trips: 'gtfsTrips',
      stop_times: 'gtfsStopTimes',
      calendar: 'gtfsCalendars',
      calendar_dates: 'gtfsCalendars',
      transfers: 'gtfsTransfers',
      shapes: 'gtfsShapes',
    };
    for (const [name, rows] of Object.entries(f))
      if (mapping[name]) {
        const records: RecordRow[] = rows.map((data, index) => ({
          id: JSON.stringify([sourceId, name, index]),
          sourceId,
          externalId:
            data.trip_id || data.stop_id || data.route_id || data.service_id || String(index),
          data: { ...data, __file: name },
        }));
        prepared[mapping[name]] = [...(prepared[mapping[name]] || []), ...records];
      }
    prepared.stations = f.stops
      .filter((s) => !s.location_type || ['0', '1'].includes(s.location_type))
      .map((s) => ({
        id: JSON.stringify([sourceId, s.stop_id]),
        sourceId,
        externalId: s.stop_id,
        name: s.stop_name,
        latitude: Number(s.stop_lat),
        longitude: Number(s.stop_lon),
        importedAt,
        attributes: s,
      }));
    prepared.lines = f.routes.map((r) => ({
      id: JSON.stringify([sourceId, r.route_id]),
      sourceId,
      externalId: r.route_id,
      name: r.route_long_name || r.route_short_name,
      shortName: r.route_short_name || r.route_id,
      mode: r.route_type,
      color: /^[0-9a-f]{6}$/i.test(r.route_color) ? r.route_color : '307c70',
    }));
    const tripRoutes = new Map(f.trips.map((t) => [t.trip_id, t.route_id]));
    const links = new Map<string, unknown>();
    for (const t of f.stop_times) {
      const stationId = JSON.stringify([sourceId, t.stop_id]),
        lineId = JSON.stringify([sourceId, tripRoutes.get(t.trip_id)]);
      const id = JSON.stringify([stationId, lineId]);
      links.set(id, { id, sourceId, stationId, lineId });
    }
    prepared.stationLineLinks = [...links.values()];
    const dates = [
      ...(f.calendar || []).flatMap((c) => [c.start_date, c.end_date]),
      ...(f.calendar_dates || []).filter((c) => c.exception_type === '1').map((c) => c.date),
    ].sort();
    validFrom = dates[0];
    validTo = dates.at(-1);
    prepared.gtfsFeeds = [
      { id: sourceId, sourceId, externalId: sourceId, validFrom, validTo, importedAt },
    ];
  } else {
    if (!/\.(csv|json|geojson)$/i.test(file.name))
      throw new Error('Formats acceptés : CSV, GeoJSON et ZIP GTFS.');
    Object.assign(
      prepared,
      parseGeographic(new TextDecoder().decode(bytes), /\.csv$/i.test(file.name), sourceId),
    );
  }
  const counts = Object.fromEntries(
    Object.entries(prepared).map(([name, rows]) => [name, rows.length]),
  );
  const source: Source = {
    id: sourceId,
    name: file.name,
    ...metadata,
    importedAt,
    verifiedAt: importedAt.slice(0, 10),
    checksum,
    bytes: file.size,
    status: 'valid',
    kind: gtfs ? 'gtfs' : 'geographic',
    counts,
    warnings,
    validFrom,
    validTo,
  };
  progress('Écriture transactionnelle…');
  await db.transaction(
    'rw',
    [...datasetTables.map((t) => db.table(t)), db.dataSources, db.table('cachedIsochrones')],
    async () => {
      for (const [name, rows] of Object.entries(prepared))
        for (let i = 0; i < rows.length; i += 2000)
          await db.table(name).bulkPut(rows.slice(i, i + 2000));
      if (metadata.replaceId) {
        for (const name of [...datasetTables, 'cachedIsochrones'])
          await db.table(name).where('sourceId').equals(metadata.replaceId).delete();
        await db.dataSources.delete(metadata.replaceId);
      }
      await db.dataSources.put(source);
    },
  );
  return source;
}
