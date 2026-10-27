import { beforeEach, it, expect } from 'vitest';
import { db } from '../../src/db/database';
import {
  setLanguage,
  getLanguage,
  t,
  formatLocale,
  initializeLanguage,
  sourceLabel,
} from '../../src/i18n';
import english from '../../src/i18n/en.json';
beforeEach(async () => {
  window.history.replaceState(null, '', '/');
  await setLanguage('fr');
});
it('conserve le français par défaut et les textes inconnus', () => {
  expect(getLanguage()).toBe('fr');
  expect(t('Point de départ')).toBe('Point de départ');
  expect(t('FR:Station:Étoile')).toBe('FR:Station:Étoile');
});
it('traduit les écrans, aides et avis légal à partir du catalogue local', async () => {
  await setLanguage('en');
  expect(t('Paramètres système')).toBe('System settings');
  expect(t('Données tierces et responsabilité')).toBe('Third-party data and liability');
  expect(formatLocale()).toBe('en-GB');
  expect(document.documentElement.lang).toBe('en');
  expect(Object.keys(english).length).toBeGreaterThan(400);
});
it('enregistre et restaure le choix depuis IndexedDB', async () => {
  await setLanguage('en');
  expect((await db.preferences.get('language'))?.value).toBe('en');
  await db.preferences.put({ key: 'language', value: 'fr' });
  await initializeLanguage();
  expect(getLanguage()).toBe('fr');
});
it('localise les messages dynamiques sans modifier les identifiants', async () => {
  await setLanguage('en');
  expect(t('Identifiants en double : FR:Route.')).toBe('Duplicate identifiers: FR:Route.');
  expect(t('3 arrêts atteignables')).toBe('3 reachable stops');
  expect(t('Ligne FR:R · course T:01')).toBe('Line FR:R · trip T:01');
  expect(t('stops : champ stop_id manquant.')).toBe('stops: missing field stop_id.');
});
it('retraduit les messages existants au retour en français', async () => {
  await setLanguage('en');
  const text = t('Calcul annulé.');
  await setLanguage('fr');
  expect(t(text)).toBe('Calcul annulé.');
  expect(sourceLabel('Origin 2')).toBe('Origine 2');
});
it('permet une entrée anglaise explicite et met le paramètre à jour lors du changement', async () => {
  window.history.replaceState(null, '', '/?lang=en#/systeme');
  await initializeLanguage();
  expect(getLanguage()).toBe('en');
  await setLanguage('fr');
  expect(new URLSearchParams(window.location.search).get('lang')).toBe('fr');
  expect(window.location.hash).toBe('#/systeme');
});
it('ne modifie pas les données enregistrées quand la langue change', async () => {
  await db.savedPlaces.put({
    id: 'locale-place',
    name: 'Gare de l’Étoile',
    latitude: 48,
    longitude: 2,
  });
  await setLanguage('en');
  expect((await db.savedPlaces.get('locale-place'))?.name).toBe('Gare de l’Étoile');
  await db.savedPlaces.delete('locale-place');
});
