import { featureCollection, point, circle } from '@turf/turf';
import type { Result } from './types';
export function exportGeoJSON(result: Result, minutes = Math.max(...result.request.thresholds)) {
  const arrivals = new Map(result.reachable.map((r) => [r.id, r.seconds]));
  return featureCollection(
    result.stations
      .filter((s) => (arrivals.get(s.externalId) ?? Infinity) <= minutes * 60)
      .map((s) =>
        point([s.longitude, s.latitude], {
          name: s.name,
          externalId: s.externalId,
          seconds: arrivals.get(s.externalId),
          thresholdMinutes: minutes,
          date: result.request.date,
          time: result.request.time,
          source: result.sourceName,
          checksum: result.checksum,
          attribution: result.attribution,
          license: result.license,
          importedAt: result.importedAt,
          method: result.method,
        }),
      ),
  );
}
export function visualization(result: Result, minutes: number) {
  const arrivals = new Map(result.reachable.map((r) => [r.id, r.seconds]));
  return featureCollection(
    result.stations
      .filter((s) => (arrivals.get(s.externalId) ?? Infinity) <= minutes * 60)
      .slice(0, 2000)
      .map((s) =>
        circle([s.longitude, s.latitude], 0.08, {
          steps: 12,
          units: 'kilometers',
          properties: {
            name: s.name,
            minutes,
            method: 'Disque symbolique de 80 m ; aucune accessibilité piétonne garantie',
          },
        }),
      ),
  );
}
