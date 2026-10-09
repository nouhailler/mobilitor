import { describe, it, expect } from 'vitest';
import { seconds, activeService, scan, buildConnections } from '../../src/routing/gtfsRouter';
import { parseCSV } from '../../src/imports/csvParser';
import { parseGeographic } from '../../src/imports/fileImport';
import { checkSpace } from '../../src/imports/importManager';
import { exportGeoJSON, visualization } from '../../src/routing/geometry';
import type { Feed, Request, Result } from '../../src/routing/types';
export const feed: Feed = {
  stops: ['A', 'B', 'C', 'D'].map((stop_id) => ({ stop_id })),
  routes: [{ route_id: 'R' }],
  trips: [
    { trip_id: 'T', route_id: 'R', service_id: 'S' },
    { trip_id: 'U', route_id: 'R', service_id: 'S' },
  ],
  times: [
    {
      trip_id: 'T',
      stop_id: 'A',
      stop_sequence: '1',
      arrival_time: '08:05:00',
      departure_time: '08:05:00',
    },
    {
      trip_id: 'T',
      stop_id: 'B',
      stop_sequence: '2',
      arrival_time: '08:15:00',
      departure_time: '08:16:00',
    },
    {
      trip_id: 'T',
      stop_id: 'C',
      stop_sequence: '3',
      arrival_time: '08:25:00',
      departure_time: '08:25:00',
    },
    {
      trip_id: 'U',
      stop_id: 'C',
      stop_sequence: '1',
      arrival_time: '08:30:00',
      departure_time: '08:30:00',
    },
    {
      trip_id: 'U',
      stop_id: 'D',
      stop_sequence: '2',
      arrival_time: '08:40:00',
      departure_time: '08:40:00',
    },
  ],
  calendars: [
    {
      service_id: 'S',
      start_date: '20260101',
      end_date: '20261231',
      monday: '1',
      tuesday: '1',
      wednesday: '1',
      thursday: '1',
      friday: '1',
      saturday: '0',
      sunday: '0',
    },
  ],
  exceptions: [],
  transfers: [],
};
const request: Request = {
  sourceId: 'test',
  origin: 'A',
  destination: 'D',
  date: '2026-10-09',
  time: '08:00',
  thresholds: [15, 30, 45, 60],
};
describe('Horaires locaux', () => {
  it('préserve les heures au-delà de 24 h', () => {
    expect(seconds('25:12:03')).toBe(90723);
    expect(() => seconds('12:61:00')).toThrow();
  });
  it('applique calendriers et exceptions', () => {
    expect(activeService('S', '2026-10-10', feed.calendars, [])).toBe(false);
    expect(
      activeService('S', '2026-10-10', feed.calendars, [
        { service_id: 'S', date: '20261010', exception_type: '1' },
      ]),
    ).toBe(true);
    expect(
      activeService('S', '2026-10-09', feed.calendars, [
        { service_id: 'S', date: '20261009', exception_type: '2' },
      ]),
    ).toBe(false);
  });
  it('construit seulement des connexions entre arrêts consécutifs', () => {
    expect(buildConnections(feed, request.date)).toHaveLength(3);
  });
  it('reconstruit un trajet avec attente et correspondance', () => {
    const r = scan(feed, request);
    expect(r.arrival).toBe(seconds('08:40:00'));
    expect(r.legs.map((l) => l.to)).toEqual(['B', 'C', 'D']);
    expect(r.reachable.filter((s) => s.seconds <= 900).map((s) => s.id)).toEqual(['A', 'B']);
  });
  it('ne crée pas de transfert par proximité', () => {
    const noTransfer = {
      ...feed,
      times: feed.times.map((t) =>
        t.trip_id === 'U' && t.stop_id === 'C' ? { ...t, stop_id: 'X' } : t,
      ),
      stops: [...feed.stops, { stop_id: 'X' }],
    };
    expect(scan(noTransfer, request).arrival).toBeUndefined();
  });
  it('applique une durée minimale de correspondance sur le même arrêt', () => {
    expect(
      scan(
        {
          ...feed,
          transfers: [
            { from_stop_id: 'C', to_stop_id: 'C', transfer_type: '2', min_transfer_time: '600' },
          ],
        },
        request,
      ).arrival,
    ).toBeUndefined();
  });
  it('applique un transfert explicite', () => {
    const f = {
      ...feed,
      transfers: [
        { from_stop_id: 'A', to_stop_id: 'D', transfer_type: '2', min_transfer_time: '120' },
      ],
    };
    expect(scan(f, request).legs[0].kind).toBe('transfer');
  });
  it('continue dans le même véhicule malgré une interdiction de montée', () => {
    const f = {
      ...feed,
      times: feed.times.map((t) =>
        t.stop_id === 'B' ? { ...t, pickup_type: '1', drop_off_type: '1' } : t,
      ),
    };
    expect(scan(f, request).arrival).toBe(seconds('08:40:00'));
    expect(scan(f, { ...request, origin: 'B' }).arrival).toBeUndefined();
  });
  it('utilise le service précédent après minuit', () => {
    const f = {
      ...feed,
      trips: feed.trips.slice(0, 1),
      times: feed.times
        .filter((t) => t.trip_id === 'T')
        .map((t) => ({
          ...t,
          arrival_time: t.arrival_time.replace('08', '24'),
          departure_time: t.departure_time.replace('08', '24'),
        })),
    };
    expect(
      scan(f, { ...request, date: '2026-10-10', time: '00:00', destination: 'C' }).arrival,
    ).toBe(25 * 60);
  });
  it('émet des erreurs explicites', () => {
    expect(() => scan(feed, { ...request, origin: 'absent' })).toThrow('Origine');
    expect(() => checkSpace(100, 1000, 1)).toThrow('Stockage');
  });
});
describe('Géographie', () => {
  it('parse guillemets, BOM et identifiants textuels', () => {
    expect(parseCSV('\uFEFFid,name\r\nFR:01,"Paris, gare"')[0]).toEqual({
      id: 'FR:01',
      name: 'Paris, gare',
    });
  });
  it('importe CSV et GeoJSON et détecte les erreurs', () => {
    expect(
      parseGeographic('id,name,latitude,longitude\nFR:01,Gare,48.8,2.3', true, 'source').stations[0]
        .externalId,
    ).toBe('FR:01');
    expect(() => parseGeographic('id,name,latitude,longitude\nA,Gare,999,2', true, 's')).toThrow();
    expect(() => parseGeographic('{}', false, 's')).toThrow();
    expect(
      parseGeographic(
        '{"type":"FeatureCollection","features":[{"type":"Feature","properties":{"name":"Rue"},"geometry":{"type":"LineString","coordinates":[[2,48],[2.1,48.1]]}}]}',
        false,
        's',
      ).lines,
    ).toHaveLength(1);
  });
  it('exporte uniquement des arrêts atteignables et des symboles documentés', () => {
    const r: Result = {
      ...scan(feed, request),
      request,
      stations: [
        {
          id: 'id',
          externalId: 'A',
          sourceId: 's',
          name: 'A',
          latitude: 48,
          longitude: 2,
          importedAt: 'now',
        },
      ],
      warnings: [],
      sourceName: 'Synthétique',
      importedAt: 'now',
      method: 'CSA',
    };
    expect(exportGeoJSON(r).features[0].properties?.method).toBe('CSA');
    r.stations.push({ ...r.stations[0], id: 'C', externalId: 'C' });
    expect(exportGeoJSON(r, 15).features).toHaveLength(1);
    expect(exportGeoJSON(r, 30).features).toHaveLength(2);
    expect(visualization(r, 15).features[0].geometry.type).toBe('Polygon');
  });
});
