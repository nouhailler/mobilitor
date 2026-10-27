import english from './en.json';
import { db } from '../db/database';
export type Language = 'fr' | 'en';
const translations: Record<string, string> = english;
const reverse = new Map(Object.entries(translations).map(([fr, en]) => [en, fr]));
let language: Language = 'fr';
let choice = 0;
const listeners = new Set<() => void>();
export const getLanguage = () => language;
export const subscribeLanguage = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};
export const formatLocale = () => (language === 'en' ? 'en-GB' : 'fr-FR');
export const sourceLabel = (text: string) => reverse.get(text) || text;
export function t(text: string, values: Record<string, string | number> = {}): string {
  const source = sourceLabel(text);
  let result = language === 'en' ? (translations[source] ?? dynamicMessage(source)) : source;
  for (const [key, value] of Object.entries(values))
    result = result.replaceAll(`{${key}}`, String(value));
  return result;
}
function dynamicMessage(text: string): string {
  const patterns: [RegExp, (...parts: string[]) => string][] = [
    [
      /^Import validé : (\d+) enregistrements\. ?(.*)$/,
      (count, warnings) =>
        `Import complete: ${count} records. ${translateWarnings(warnings)}`.trim(),
    ],
    [/^(\d+) arrêts atteignables$/, (count) => `${count} reachable stops`],
    [
      /^Origine (\d+)( \(facultative\))?$/,
      (n, optional) => `Origin ${n}${optional ? ' (optional)' : ''}`,
    ],
    [/^Ligne (.*?) · course (.*)$/, (line, trip) => `Line ${line} · trip ${trip}`],
    [/^Validité : (.*)$/, (range) => `Validity: ${range}`],
    [/^CSV invalide : (.*)$/, (reason) => `Invalid CSV: ${reason}`],
    [/^(.+) est vide\.$/, (name) => `${name} is empty.`],
    [/^(.+) : champ (.+) manquant\.$/, (name, field) => `${name}: missing field ${field}.`],
    [
      /^(.+)\.txt n'est pas pris en charge : fournir un flux d'horaires explicites sans ce fichier\.$/,
      (name) =>
        `${name}.txt is not supported: provide an explicit-timetable feed without this file.`,
    ],
    [/^Fichier (.+) en double\.$/, (name) => `Duplicate file: ${name}.`],
    [/^Identifiants en double : (.+)\.$/, (name) => `Duplicate identifiers: ${name}.`],
    [/^Heure GTFS invalide : (.*)$/, (value) => `Invalid GTFS time: ${value}`],
  ];
  for (const [pattern, format] of patterns) {
    const match = text.match(pattern);
    if (match) return format(...match.slice(1));
  }
  return translateWarnings(text);
}
function translateWarnings(text: string) {
  let result = text;
  for (const fr of Object.keys(translations)
    .filter((key) => key.length > 35)
    .sort((a, b) => b.length - a.length))
    result = result.replaceAll(fr, translations[fr]);
  return result;
}
function reflectLanguage() {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = language;
  document
    .querySelector('meta[name="description"]')
    ?.setAttribute(
      'content',
      language === 'en'
        ? 'Explore France and calculate public transport journeys locally on your device.'
        : 'Explorez la France et calculez vos déplacements en transports localement sur votre appareil.',
    );
  document.title =
    language === 'en'
      ? 'Mobilitor — Local mobility & isochrones'
      : 'Mobilitor — Mobilité & isochrones locales';
  const manifest = document.querySelector('link[rel="manifest"]');
  manifest?.setAttribute(
    'href',
    `${import.meta.env.BASE_URL}manifest${language === 'en' ? '.en' : ''}.webmanifest`,
  );
}
function apply(value: Language) {
  language = value;
  reflectLanguage();
  listeners.forEach((fn) => fn());
}
export async function setLanguage(value: Language) {
  choice++;
  apply(value);
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href);
    if (url.searchParams.has('lang')) {
      url.searchParams.set('lang', value);
      window.history.replaceState(window.history.state, '', url);
    }
  }
  try {
    await db.preferences.put({ key: 'language', value });
  } catch {
    /* In restricted storage the selection still works for the current session. */
  }
}
export async function initializeLanguage() {
  const version = choice;
  const query =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('lang') : null;
  if (query === 'en' || query === 'fr') {
    await setLanguage(query);
    return;
  }
  try {
    const row = await db.preferences.get('language');
    if (version === choice) apply(row?.value === 'en' ? 'en' : 'fr');
  } catch {
    reflectLanguage();
  }
}
