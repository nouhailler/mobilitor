import Papa from 'papaparse';
import type { Row } from '../db/schema';
export function parseCSV(text: string): Row[] {
  const result = Papa.parse<Row>(text.replace(/^\uFEFF/, ''), {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim(),
  });
  if (result.errors.length) throw new Error(`CSV invalide : ${result.errors[0].message}`);
  if (!result.meta.fields?.length || new Set(result.meta.fields).size !== result.meta.fields.length)
    throw new Error('En-têtes CSV invalides.');
  return result.data;
}
export function requireFields(rows: Row[], fields: string[], name: string) {
  if (!rows.length) throw new Error(`${name} est vide.`);
  for (const row of rows)
    for (const field of fields)
      if (!row[field]?.trim()) throw new Error(`${name} : champ ${field} manquant.`);
}
export function coordinate(value: unknown, limit: number) {
  if (value === '' || value === null || value === undefined)
    throw new Error('Coordonnée manquante.');
  const n = Number(value);
  if (!Number.isFinite(n) || Math.abs(n) > limit) throw new Error('Coordonnée WGS84 invalide.');
  return n;
}
