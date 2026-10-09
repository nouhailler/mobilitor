import { unzipSync, strFromU8 } from 'fflate';
import { parseCSV, requireFields, coordinate } from './csvParser';
import { seconds } from '../routing/gtfsRouter';
import type { Row } from '../db/schema';
export interface Parsed {
  files: Record<string, Row[]>;
  warnings: string[];
}
export function parseGTFS(bytes: Uint8Array): Parsed {
  // Bound declared ZIP sizes before decompression; only import trusted source files.
  let total = 0;
  for (let i = 0; i + 46 < bytes.length; i++)
    if (bytes[i] === 80 && bytes[i + 1] === 75 && bytes[i + 2] === 1 && bytes[i + 3] === 2) {
      total += new DataView(bytes.buffer, bytes.byteOffset + i, 46).getUint32(24, true);
      if (total > 250 * 1024 * 1024)
        throw new Error('Archive décompressée > 250 Mo : préparer un sous-réseau.');
    }
  const zip = unzipSync(bytes);
  const files: Record<string, Row[]> = {};
  const supported = new Set([
    'agency',
    'stops',
    'routes',
    'trips',
    'stop_times',
    'calendar',
    'calendar_dates',
    'transfers',
    'shapes',
    'feed_info',
  ]);
  for (const [path, content] of Object.entries(zip)) {
    const name = path
      .split('/')
      .pop()!
      .toLowerCase()
      .replace(/\.txt$/, '');
    if (path.endsWith('.txt')) {
      if (['frequencies', 'pathways'].includes(name))
        throw new Error(
          `${name}.txt n'est pas pris en charge : fournir un flux d'horaires explicites sans ce fichier.`,
        );
      if (supported.has(name)) {
        if (files[name]) throw new Error(`Fichier ${name} en double.`);
        files[name] = parseCSV(strFromU8(content));
      }
    }
  }
  for (const [name, fields] of Object.entries({
    agency: ['agency_name', 'agency_url', 'agency_timezone'],
    stops: ['stop_id', 'stop_name'],
    routes: ['route_id', 'route_type'],
    trips: ['route_id', 'service_id', 'trip_id'],
    stop_times: ['trip_id', 'arrival_time', 'departure_time', 'stop_id', 'stop_sequence'],
  }))
    requireFields(files[name] || [], fields, name);
  if (!files.calendar?.length && !files.calendar_dates?.length)
    throw new Error('calendar.txt ou calendar_dates.txt nécessaire.');
  if (files.stop_times.length > 500000)
    throw new Error('Limite : 500 000 horaires. Préparez un sous-réseau sur ordinateur.');
  for (const name of ['stops', 'routes', 'trips']) {
    const key = { stops: 'stop_id', routes: 'route_id', trips: 'trip_id' }[name]!;
    const ids = files[name].map((r) => r[key]);
    if (new Set(ids).size !== ids.length) throw new Error(`Identifiants en double : ${name}.`);
  }
  for (const name of ['calendar', 'calendar_dates']) {
    const keys = (files[name] || []).map((r) =>
      name === 'calendar' ? r.service_id : JSON.stringify([r.service_id, r.date]),
    );
    if (new Set(keys).size !== keys.length) throw new Error('Calendrier ou exception en double.');
    if (keys.some((k) => !k)) throw new Error('Identifiant de service manquant.');
  }
  for (const route of files.routes) {
    if (!route.route_short_name && !route.route_long_name)
      throw new Error('Nom de ligne manquant.');
    for (const field of ['continuous_pickup', 'continuous_drop_off'])
      if (route[field] && route[field] !== '1')
        throw new Error('Montée ou descente continue non prise en charge.');
  }
  const stops = new Set(files.stops.map((s) => s.stop_id)),
    routes = new Set(files.routes.map((r) => r.route_id)),
    services = new Set(
      [...(files.calendar || []), ...(files.calendar_dates || [])].map((r) => r.service_id),
    );
  const trips = new Set(files.trips.map((t) => t.trip_id));
  for (const s of files.stops) {
    coordinate(s.stop_lat, 90);
    coordinate(s.stop_lon, 180);
    if (s.parent_station && !stops.has(s.parent_station))
      throw new Error('Station parente absente.');
  }
  for (const t of files.trips)
    if (!routes.has(t.route_id) || !services.has(t.service_id))
      throw new Error('Course : ligne ou service absent.');
  const sequences = new Set<string>();
  const ordered = new Map<string, Row[]>();
  for (const t of files.stop_times) {
    if (!trips.has(t.trip_id) || !stops.has(t.stop_id))
      throw new Error('Horaire : course ou arrêt absent.');
    if (!/^\d+$/.test(t.stop_sequence)) throw new Error('Séquence invalide.');
    const key = JSON.stringify([t.trip_id, Number(t.stop_sequence)]);
    if (sequences.has(key)) throw new Error('Séquence dupliquée.');
    sequences.add(key);
    if (seconds(t.arrival_time) > seconds(t.departure_time))
      throw new Error('Départ avant arrivée.');
    for (const field of ['continuous_pickup', 'continuous_drop_off'])
      if (t[field] && t[field] !== '1')
        throw new Error('Montée ou descente continue non prise en charge.');
    for (const field of ['pickup_type', 'drop_off_type'])
      if (t[field] && !['0', '1'].includes(t[field]))
        throw new Error('Transport à la demande non pris en charge.');
    const list = ordered.get(t.trip_id) || [];
    list.push(t);
    ordered.set(t.trip_id, list);
  }
  for (const list of ordered.values()) {
    list.sort((a, b) => Number(a.stop_sequence) - Number(b.stop_sequence));
    for (let i = 1; i < list.length; i++)
      if (seconds(list[i].arrival_time) <= seconds(list[i - 1].departure_time))
        throw new Error('Durée inter-arrêts non positive ou horaires incohérents.');
  }
  const validDate = (date: string) => {
    if (!/^\d{8}$/.test(date)) return false;
    const iso = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
    return !Number.isNaN(Date.parse(iso)) && new Date(iso).toISOString().slice(0, 10) === iso;
  };
  for (const c of files.calendar || []) {
    if (!validDate(c.start_date) || !validDate(c.end_date) || c.start_date > c.end_date)
      throw new Error('Période calendrier invalide.');
    for (const day of [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ])
      if (!['0', '1'].includes(c[day])) throw new Error('Jour calendrier invalide.');
  }
  for (const c of files.calendar_dates || [])
    if (!validDate(c.date) || !['1', '2'].includes(c.exception_type))
      throw new Error('Exception calendrier invalide.');
  for (const t of files.transfers || []) {
    if (t.transfer_type === '3' && t.from_stop_id === t.to_stop_id)
      throw new Error('Interdiction de correspondance au même arrêt non prise en charge.');
    if (!stops.has(t.from_stop_id) || !stops.has(t.to_stop_id))
      throw new Error('Correspondance : arrêt absent.');
    if (
      !['0', '2', '3'].includes(t.transfer_type) ||
      t.from_route_id ||
      t.to_route_id ||
      t.from_trip_id ||
      t.to_trip_id
    )
      throw new Error('Correspondance spécifique ou garantie non prise en charge.');
    if (t.transfer_type !== '3' && !/^\d+$/.test(t.min_transfer_time || ''))
      throw new Error('Correspondance sans durée explicite non prise en charge.');
  }
  if (files.agency.some((a) => a.agency_timezone !== 'Europe/Paris'))
    throw new Error('Cette version exige le fuseau Europe/Paris.');
  return {
    files,
    warnings: [
      'Horaires théoriques ; pas de temps réel ni de garantie d’accessibilité.',
      'Correspondances explicites uniquement ; aucun accès à pied implicite.',
      'Dates et heures dans le fuseau Europe/Paris ; jours de changement d’heure non pris en charge.',
    ],
  };
}
