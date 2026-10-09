import { db } from '../db/database';
import { scan } from './gtfsRouter';
import type { Feed, Request, Result } from './types';
export async function calculateLocal(request: Request): Promise<Result> {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(request.date) ||
    !/^\d{2}:\d{2}$/.test(request.time) ||
    !request.thresholds.length ||
    request.thresholds.some((n) => n < 1 || n > 60)
  )
    throw new Error('Date, heure ou seuil invalide.');
  const validatedDate = new Date(`${request.date}T12:00:00Z`);
  if (
    Number.isNaN(validatedDate.getTime()) ||
    validatedDate.toISOString().slice(0, 10) !== request.date ||
    Number(request.time.slice(0, 2)) > 23 ||
    Number(request.time.slice(3)) > 59 ||
    request.thresholds.some((n) => !Number.isFinite(n))
  )
    throw new Error('Date, heure ou seuil invalide.');
  const source = await db.dataSources.get(request.sourceId);
  if (!source || source.kind !== 'gtfs') throw new Error('Importez un flux GTFS compatible.');
  const day = request.date.replaceAll('-', '');
  if (day < source.validFrom! || day > source.validTo!)
    throw new Error('Date hors de la période couverte par le flux.');
  const d = new Date(`${request.date}T12:00:00Z`);
  if (d.getUTCDay() === 0 && [2, 9].includes(d.getUTCMonth())) {
    const next = new Date(d);
    next.setUTCDate(d.getUTCDate() + 7);
    if (next.getUTCMonth() !== d.getUTCMonth())
      throw new Error('Jour de changement d’heure non pris en charge.');
  }
  const read = async (name: string) =>
    (await db.rows(name).where('sourceId').equals(source.id).toArray()).map((r) => r.data);
  const [stops, routes, trips, times, calendarsAll, transfers] = await Promise.all(
    ['gtfsStops', 'gtfsRoutes', 'gtfsTrips', 'gtfsStopTimes', 'gtfsCalendars', 'gtfsTransfers'].map(
      read,
    ),
  );
  const feed: Feed = {
    stops,
    routes,
    trips,
    times,
    calendars: calendarsAll.filter((c) => c.__file === 'calendar'),
    exceptions: calendarsAll.filter((c) => c.__file === 'calendar_dates'),
    transfers,
  };
  const computed = scan(feed, request);
  const ids = new Set(computed.reachable.map((r) => r.id));
  const stations = (await db.stations.where('sourceId').equals(source.id).toArray()).filter((s) =>
    ids.has(s.externalId),
  );
  const internalIds = new Set(stations.map((s) => s.id));
  const links = await db
    .table<{ sourceId: string; stationId: string; lineId: string }>('stationLineLinks')
    .where('sourceId')
    .equals(source.id)
    .filter((l) => internalIds.has(l.stationId))
    .toArray();
  const lineIds = new Set(links.map((l) => l.lineId));
  const servingLines = (
    await db.lines
      .where('sourceId')
      .equals(source.id)
      .filter((l) => lineIds.has(l.id))
      .toArray()
  ).map((l) => l.shortName);
  return {
    ...computed,
    request,
    stations,
    servingLines,
    checksum: source.checksum,
    attribution: source.attribution || source.provider,
    license: source.license,
    warnings: source.warnings,
    sourceName: source.name,
    importedAt: source.importedAt,
    method: 'Connection Scan Algorithm · arrêts atteignables',
  };
}
