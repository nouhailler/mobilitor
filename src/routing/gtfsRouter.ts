import type { Feed, Leg, Request, Reachable } from './types';
import type { Row } from '../db/schema';
export function seconds(value: string) {
  if (!/^\d{2,}:\d{2}:\d{2}$/.test(value)) throw new Error(`Heure GTFS invalide : ${value}`);
  const [h, m, s] = value.split(':').map(Number);
  if (m > 59 || s > 59 || h > 47) throw new Error('Heure hors du profil pris en charge (00–47 h).');
  return h * 3600 + m * 60 + s;
}
export function activeService(service: string, date: string, calendars: Row[], exceptions: Row[]) {
  const compact = date.replaceAll('-', '');
  const exception = exceptions.find((r) => r.service_id === service && r.date === compact);
  if (exception) return exception.exception_type === '1';
  const day = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][
    new Date(`${date}T12:00:00Z`).getUTCDay()
  ];
  return calendars.some(
    (r) =>
      r.service_id === service &&
      r.start_date <= compact &&
      r.end_date >= compact &&
      r[day] === '1',
  );
}
interface Node {
  leg: Leg;
  previous?: Node;
}
interface Connection extends Leg {
  trip: string;
  pickup: boolean;
  dropoff: boolean;
}
export function buildConnections(feed: Feed, date: string): Connection[] {
  const trips = new Map(
    feed.trips
      .filter((t) => activeService(t.service_id, date, feed.calendars, feed.exceptions))
      .map((t) => [t.trip_id, t]),
  );
  const grouped = new Map<string, Row[]>();
  for (const row of feed.times) {
    if (!trips.has(row.trip_id)) continue;
    const list = grouped.get(row.trip_id) || [];
    list.push(row);
    grouped.set(row.trip_id, list);
  }
  const result: Connection[] = [];
  for (const [id, times] of grouped) {
    times.sort((a, b) => Number(a.stop_sequence) - Number(b.stop_sequence));
    for (let i = 1; i < times.length; i++) {
      const a = times[i - 1],
        b = times[i];
      result.push({
        from: a.stop_id,
        to: b.stop_id,
        departure: seconds(a.departure_time),
        arrival: seconds(b.arrival_time),
        trip: id,
        line: trips.get(id)!.route_id,
        kind: 'transit',
        pickup: a.pickup_type !== '1',
        dropoff: b.drop_off_type !== '1',
      });
    }
  }
  return result;
}
export function scan(feed: Feed, request: Request) {
  if (!feed.stops.some((s) => s.stop_id === request.origin))
    throw new Error('Origine absente du flux sélectionné.');
  const start = seconds(`${request.time}:00`);
  const horizon = start + Math.max(...request.thresholds) * 60;
  const previousDate = new Date(`${request.date}T12:00:00Z`);
  previousDate.setUTCDate(previousDate.getUTCDate() - 1);
  const tomorrow = new Date(`${request.date}T12:00:00Z`);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const connections = [
    ...buildConnections(feed, previousDate.toISOString().slice(0, 10)).map((c) => ({
      ...c,
      trip: `previous:${c.trip}`,
      departure: c.departure - 86400,
      arrival: c.arrival - 86400,
    })),
    ...buildConnections(feed, request.date),
    ...buildConnections(feed, tomorrow.toISOString().slice(0, 10)).map((c) => ({
      ...c,
      trip: `next:${c.trip}`,
      departure: c.departure + 86400,
      arrival: c.arrival + 86400,
    })),
  ]
    .filter((c) => c.departure >= start && c.departure <= horizon)
    .sort((a, b) => a.departure - b.departure || a.arrival - b.arrival);
  const labels = new Map<string, number>([[request.origin, start]]),
    paths = new Map<string, Node>(),
    onboard = new Map<string, Node>();
  const transfers = new Map<string, Row[]>();
  const minimum = new Map<string, number>();
  for (const row of feed.transfers) {
    if (row.from_stop_id === row.to_stop_id) {
      minimum.set(row.from_stop_id, Number(row.min_transfer_time || 0));
      continue;
    }
    if (row.transfer_type === '3') continue;
    const list = transfers.get(row.from_stop_id) || [];
    list.push(row);
    transfers.set(row.from_stop_id, list);
  }
  function relaxTransfers(origin: string) {
    const queue = [origin];
    while (queue.length) {
      const from = queue.shift()!;
      for (const t of transfers.get(from) || []) {
        const departure = labels.get(from)!;
        const arrival = departure + Number(t.min_transfer_time);
        if (arrival <= horizon && arrival < (labels.get(t.to_stop_id) ?? Infinity)) {
          labels.set(t.to_stop_id, arrival);
          paths.set(t.to_stop_id, {
            leg: { from, to: t.to_stop_id, departure, arrival, kind: 'transfer' },
            previous: paths.get(from),
          });
          queue.push(t.to_stop_id);
        }
      }
    }
  }
  relaxTransfers(request.origin);
  for (const c of connections) {
    const existing = onboard.get(c.trip);
    const ready = labels.get(c.from) ?? Infinity;
    const canBoard =
      c.pickup && ready + (paths.has(c.from) ? minimum.get(c.from) || 0 : 0) <= c.departure;
    if (!existing && !canBoard) continue;
    const node: Node = { leg: c, previous: existing || paths.get(c.from) };
    onboard.set(c.trip, node);
    if (c.dropoff && c.arrival <= horizon && c.arrival < (labels.get(c.to) ?? Infinity)) {
      labels.set(c.to, c.arrival);
      paths.set(c.to, node);
      relaxTransfers(c.to);
    }
  }
  const reachable: Reachable[] = [...labels].map(([id, time]) => ({ id, seconds: time - start }));
  const legs: Leg[] = [];
  let node = request.destination ? paths.get(request.destination) : undefined;
  while (node) {
    legs.unshift(node.leg);
    node = node.previous;
  }
  return {
    reachable,
    legs,
    arrival: request.destination ? labels.get(request.destination) : undefined,
  };
}
