import type { Row, Station } from '../db/schema';
export interface Feed {
  stops: Row[];
  routes: Row[];
  trips: Row[];
  times: Row[];
  calendars: Row[];
  exceptions: Row[];
  transfers: Row[];
}
export interface Request {
  sourceId: string;
  origin: string;
  destination?: string;
  date: string;
  time: string;
  thresholds: number[];
}
export interface Leg {
  from: string;
  to: string;
  departure: number;
  arrival: number;
  trip?: string;
  line?: string;
  kind: 'transit' | 'transfer';
}
export interface Reachable {
  id: string;
  seconds: number;
}
export interface Result {
  request: Request;
  reachable: Reachable[];
  legs: Leg[];
  arrival?: number;
  warnings: string[];
  stations: Station[];
  sourceName: string;
  importedAt: string;
  method: string;
  servingLines?: string[];
  checksum?: string;
  attribution?: string;
  license?: string;
}
