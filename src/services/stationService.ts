import { db } from '../db/database';
import { distance, point } from '@turf/turf';
export const getStation = (id: string) => db.stations.get(id);
export const listLines = () => db.lines.limit(500).toArray();
export const getLineGeometry = (id: string) => db.lineGeometries.get(id);
export const listAdministrativeAreas = () => db.administrativeAreas.limit(200).toArray();
export const listDataSources = () => db.dataSources.toArray();
export function listStations(query = '', sourceId?: string) {
  return db.stations
    .filter(
      (s) =>
        (!sourceId || s.sourceId === sourceId) &&
        s.name.toLocaleLowerCase('fr').includes(query.toLocaleLowerCase('fr')),
    )
    .limit(40)
    .toArray();
}
export function stationsInBounds(south: number, north: number, west: number, east: number) {
  return db.stations
    .where('latitude')
    .between(south, north, true, true)
    .filter((s) => s.longitude >= west && s.longitude <= east)
    .limit(1500)
    .toArray();
}
export async function findNearbyStations(latitude: number, longitude: number, radius = 0.5) {
  return (
    await stationsInBounds(
      latitude - radius / 110,
      latitude + radius / 110,
      longitude - radius / 70,
      longitude + radius / 70,
    )
  ).filter(
    (s) => distance(point([longitude, latitude]), point([s.longitude, s.latitude])) <= radius,
  );
}
