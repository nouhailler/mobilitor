import type { Feature, Geometry } from 'geojson';
export type Row = Record<string, string>;
export interface RecordRow {
  id: string;
  sourceId: string;
  externalId: string;
  data: Row;
}
export interface Station {
  id: string;
  sourceId: string;
  externalId: string;
  name: string;
  latitude: number;
  longitude: number;
  commune?: string;
  importedAt: string;
  attributes?: Row;
}
export interface Line {
  id: string;
  sourceId: string;
  externalId: string;
  name: string;
  shortName: string;
  mode: string;
  color: string;
  operator?: string;
}
export interface GeoRecord {
  id: string;
  sourceId: string;
  name: string;
  feature: Feature<Geometry>;
}
export interface Source {
  id: string;
  name: string;
  provider: string;
  url: string;
  license: string;
  attribution: string;
  importedAt: string;
  verifiedAt: string;
  checksum: string;
  bytes: number;
  status: 'valid';
  kind: 'gtfs' | 'geographic';
  counts: Record<string, number>;
  warnings: string[];
  validFrom?: string;
  validTo?: string;
}
export interface Place {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  stationId?: string;
}
export interface Scenario {
  id: string;
  name: string;
  origins: string[];
  date: string;
  time: string;
}
export interface Preference {
  key: string;
  value: unknown;
}
export interface Job {
  id: string;
  name: string;
  status: 'running' | 'failed' | 'complete';
  message: string;
  updatedAt: string;
}
export const gtfsTables = [
  'gtfsStops',
  'gtfsRoutes',
  'gtfsTrips',
  'gtfsStopTimes',
  'gtfsCalendars',
  'gtfsTransfers',
  'gtfsFrequencies',
  'gtfsShapes',
  'gtfsAgencies',
] as const;
export const datasetTables = [
  'stations',
  'lines',
  'stationLineLinks',
  'lineGeometries',
  'administrativeAreas',
  'gtfsFeeds',
  ...gtfsTables,
] as const;
