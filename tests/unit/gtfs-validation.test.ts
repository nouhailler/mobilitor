import { it, expect } from 'vitest';
import { unzipSync, zipSync, strFromU8, strToU8 } from 'fflate';
import { readFileSync } from 'node:fs';
import { parseGTFS } from '../../src/imports/gtfsImport';
const original = unzipSync(new Uint8Array(readFileSync('data/fixtures/synthetic-gtfs.zip')));
function changed(file: string, transform: (s: string) => string) {
  return zipSync({
    ...original,
    [file]: strToU8(transform(strFromU8(original[file] || new Uint8Array()))),
  });
}
it('accepte calendar_dates sans calendar.txt', () => {
  const files = { ...original };
  delete files['calendar.txt'];
  files['calendar_dates.txt'] = strToU8('service_id,date,exception_type\nDAILY,20261009,1');
  expect(parseGTFS(zipSync(files)).files.calendar_dates[0].service_id).toBe('DAILY');
});
it('refuse les références absentes', () => {
  expect(() =>
    parseGTFS(changed('trips.txt', (s) => s.replace('R,DAILY', 'UNKNOWN,DAILY'))),
  ).toThrow('ligne ou service');
});
it('refuse les identifiants en double', () => {
  expect(() => parseGTFS(changed('stops.txt', (s) => s + 'FR:A,Autre,48,2\n'))).toThrow(
    'Identifiants en double',
  );
});
it('refuse les séquences dupliquées', () => {
  expect(() => parseGTFS(changed('stop_times.txt', (s) => s.replace('FR:B,2', 'FR:B,1')))).toThrow(
    'Séquence dupliquée',
  );
});
it('refuse les heures non monotones', () => {
  expect(() =>
    parseGTFS(
      changed('stop_times.txt', (s) =>
        s.replaceAll('08:15:00', '08:03:00').replaceAll('08:16:00', '08:03:00'),
      ),
    ),
  ).toThrow('horaires incohérents');
});
it('refuse les dates de calendrier impossibles', () => {
  expect(() =>
    parseGTFS(changed('calendar.txt', (s) => s.replace('20260101', '20260230'))),
  ).toThrow('calendrier invalide');
});
it('refuse les exceptions ambiguës', () => {
  expect(() =>
    parseGTFS(
      changed(
        'calendar_dates.txt',
        () => 'service_id,date,exception_type\nDAILY,20261009,1\nDAILY,20261009,2',
      ),
    ),
  ).toThrow('en double');
});
it('accepte les horaires explicites après minuit', () => {
  expect(
    parseGTFS(changed('stop_times.txt', (s) => s.replaceAll('08:', '25:'))).files.stop_times[0]
      .departure_time,
  ).toBe('25:05:00');
});
it('refuse un transfert sans durée connue', () => {
  expect(() =>
    parseGTFS(changed('transfers.txt', () => 'from_stop_id,to_stop_id,transfer_type\nFR:A,FR:B,0')),
  ).toThrow('durée explicite');
});
it('refuse les capacités de transfert spécifiques non modélisées', () => {
  expect(() =>
    parseGTFS(
      changed(
        'transfers.txt',
        () =>
          'from_stop_id,to_stop_id,transfer_type,min_transfer_time,from_route_id\nFR:A,FR:B,2,120,R',
      ),
    ),
  ).toThrow('spécifique');
});
