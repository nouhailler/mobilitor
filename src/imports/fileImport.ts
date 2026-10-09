import type { FeatureCollection, Geometry, Feature } from 'geojson';
import type { Station, GeoRecord, Line } from '../db/schema';
import { coordinate, parseCSV } from './csvParser';
export function parseGeographic(text: string, csv: boolean, sourceId: string) {
  const stations: Station[] = [],
    lines: Line[] = [],
    lineGeometries: GeoRecord[] = [],
    administrativeAreas: GeoRecord[] = [];
  const collection: FeatureCollection = csv
    ? {
        type: 'FeatureCollection',
        features: parseCSV(text).map((r) => ({
          type: 'Feature',
          properties: r,
          geometry: {
            type: 'Point',
            coordinates: [coordinate(r.longitude, 180), coordinate(r.latitude, 90)],
          },
        })),
      }
    : JSON.parse(text);
  if (
    collection.type !== 'FeatureCollection' ||
    !Array.isArray(collection.features) ||
    !collection.features.length
  )
    throw new Error('FeatureCollection GeoJSON non vide requise.');
  const seen = new Set<string>();
  for (const [index, feature] of collection.features.entries()) {
    if (feature.type !== 'Feature' || !feature.geometry) throw new Error('Géométrie manquante.');
    const props = feature.properties || {};
    const externalId = String(props.id ?? feature.id ?? index);
    const id = JSON.stringify([sourceId, externalId]);
    if (seen.has(id)) throw new Error('Identifiant géographique en double.');
    seen.add(id);
    const name = String(props.name ?? props.nom ?? props.nom_gares ?? props.l_ar ?? externalId);
    const geometry = feature.geometry;
    const validateCoordinates = (coords: unknown): void => {
      if (!Array.isArray(coords) || !coords.length)
        throw new Error('Coordonnées GeoJSON invalides.');
      if (typeof coords[0] === 'number') {
        coordinate(coords[0], 180);
        coordinate(coords[1], 90);
      } else coords.forEach(validateCoordinates);
    };
    if (geometry.type === 'GeometryCollection')
      throw new Error('GeometryCollection non prise en charge.');
    validateCoordinates(geometry.coordinates);
    const position = (p: unknown) =>
      Array.isArray(p) &&
      p.length >= 2 &&
      p.every((v) => typeof v === 'number' && Number.isFinite(v));
    const line = (p: unknown) => Array.isArray(p) && p.length >= 2 && p.every(position);
    const ring = (p: unknown) =>
      Array.isArray(p) &&
      p.length >= 4 &&
      p.every(position) &&
      JSON.stringify(p[0]) === JSON.stringify(p.at(-1));
    const polygon = (p: unknown) => Array.isArray(p) && p.length > 0 && p.every(ring);
    const valid =
      geometry.type === 'Point'
        ? position(geometry.coordinates)
        : geometry.type === 'LineString'
          ? line(geometry.coordinates)
          : geometry.type === 'MultiLineString'
            ? geometry.coordinates.every(line)
            : geometry.type === 'Polygon'
              ? polygon(geometry.coordinates)
              : geometry.type === 'MultiPolygon'
                ? geometry.coordinates.every(polygon)
                : false;
    if (!valid) throw new Error('Structure de géométrie GeoJSON invalide (anneaux fermés requis).');
    const record: GeoRecord = { id, sourceId, name, feature: feature as Feature<Geometry> };
    if (geometry.type === 'Point')
      stations.push({
        id,
        sourceId,
        externalId,
        name,
        longitude: geometry.coordinates[0],
        latitude: geometry.coordinates[1],
        commune: String(props.commune || ''),
        importedAt: new Date().toISOString(),
      });
    else if (['LineString', 'MultiLineString'].includes(geometry.type)) {
      lineGeometries.push(record);
      lines.push({
        id,
        sourceId,
        externalId,
        name,
        shortName: String(props.shortName || name),
        color: String(props.color || '307c70'),
        mode: String(props.mode || 'inconnu'),
      });
    } else if (['Polygon', 'MultiPolygon'].includes(geometry.type))
      administrativeAreas.push(record);
    else throw new Error('Type de géométrie non pris en charge.');
  }
  return { stations, lines, lineGeometries, administrativeAreas };
}
