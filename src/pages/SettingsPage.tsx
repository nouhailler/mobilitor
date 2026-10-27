import { LanguageSelector } from '../components/LanguageSelector';
import { t } from '../i18n';
import { useLocale } from '../i18n/useLocale';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, clearAll } from '../db/database';
import { useAppTheme } from '../components/RuntimeContext';
import type { Theme } from '../hooks/useTheme';
import { requestPersistence } from '../services/storageService';
export function SettingsPage() {
  useLocale();

  const { theme, setTheme } = useAppTheme();
  const places = useLiveQuery(() => db.savedPlaces.toArray(), [], []),
    scenarios = useLiveQuery(() => db.savedScenarios.toArray(), [], []);
  const [tiles, setTiles] = useState(true),
    [threshold, setThreshold] = useState(30),
    [message, setMessage] = useState('');
  useEffect(() => {
    void db.preferences.get('onlineTiles').then((p) => setTiles(p?.value !== false));
    void db.preferences.get('threshold').then((p) => {
      if ([15, 30, 45, 60].includes(Number(p?.value))) setThreshold(Number(p?.value));
    });
  }, []);
  async function erase() {
    if (
      !window.confirm(
        t('Effacer tous les jeux, lieux, scénarios et préférences sur cet appareil ?'),
      )
    )
      return;
    await clearAll();
    for (const name of await caches.keys()) await caches.delete(name);
    setTiles(true);
    setMessage(
      'Données et caches effacés. Reconnectez-vous et rechargez pour préparer à nouveau le mode hors ligne.',
    );
  }
  return (
    <main className="content-page narrow">
      <span className="eyebrow">{t('SUR CET APPAREIL')}</span>
      <h1>{t('Vous gardez le contrôle.')}</h1>
      <section className="card">
        <h2>{t('Apparence')}</h2>
        <LanguageSelector />
        <p>
          {t('Choisissez le français ou l’anglais. Votre choix est conservé sur cet appareil.')}
        </p>
        <label>
          {t('Thème de l’interface')}
          <select value={theme} onChange={(e) => setTheme(e.target.value as Theme)}>
            <option value="system">{t('Automatique · suivre le système')}</option>
            <option value="light">{t('Clair')}</option>
            <option value="dark">{t('Sombre')}</option>
          </select>
        </label>
        <p>
          {t(
            'Ce choix est enregistré sur cet appareil. Le fond OpenStreetMap reste dans son style d’origine.',
          )}
        </p>
        <Link to="/systeme">{t('Paramètres système, installation et mises à jour →')}</Link>
      </section>
      <section className="card">
        <h2>{t('Fond cartographique')}</h2>
        <label className="toggle">
          <input
            type="checkbox"
            checked={tiles}
            onChange={(e) => {
              setTiles(e.target.checked);
              void db.preferences.put({ key: 'onlineTiles', value: e.target.checked });
            }}
          />
          {t('Activer le fond OpenStreetMap en ligne')}
        </label>
        <p>
          {t(
            'L’activation transmet au fournisseur les demandes de tuiles et l’adresse IP. Aucun favori ni horaire de recherche n’est envoyé. Ce fond n’est pas disponible hors ligne.',
          )}
        </p>
      </section>
      <section className="card">
        <h2>{t('Seuil par défaut')}</h2>
        <label>
          {t('Temps disponible')}
          <select
            value={threshold}
            onChange={(e) => {
              setThreshold(Number(e.target.value));
              void db.preferences.put({ key: 'threshold', value: Number(e.target.value) });
            }}
          >
            {[15, 30, 45, 60].map((n) => (
              <option key={n} value={n}>
                {n} {t('minutes')}
              </option>
            ))}
          </select>
        </label>
      </section>
      <section className="card">
        <h2>{t('Préserver le stockage')}</h2>
        <p>
          {t(
            'Le navigateur peut évincer les données. Une demande de persistance réduit ce risque lorsqu’elle est acceptée.',
          )}
        </p>
        <button
          onClick={() =>
            void requestPersistence().then((ok) =>
              setMessage(
                ok ? 'Persistance autorisée.' : 'Persistance non accordée par ce navigateur.',
              ),
            )
          }
        >
          {t('Demander la persistance')}
        </button>
      </section>
      <section className="card">
        <h2>{t('Lieux enregistrés')}</h2>
        {!places.length && <p>{t('Aucun lieu enregistré.')}</p>}
        {places.map((p) => (
          <article className="dataset" key={p.id}>
            <strong>{p.name}</strong>
            <small>
              {p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}
            </small>
            <button onClick={() => void db.savedPlaces.delete(p.id)}>{t('Supprimer')}</button>
          </article>
        ))}
      </section>
      <section className="card">
        <h2>{t('Scénarios enregistrés')}</h2>
        {!scenarios.length && <p>{t('Aucun scénario enregistré.')}</p>}
        {scenarios.map((s) => (
          <article className="dataset" key={s.id}>
            <strong>{s.name}</strong>
            <small>
              {s.origins.length} {t('origine(s) ·')} {s.date} · {s.time}
            </small>
            <Link to={`${s.origins.length > 1 ? '/comparaison' : '/'}?scenario=${s.id}`}>
              {t('Rouvrir ce scénario →')}
            </Link>
            <button onClick={() => void db.savedScenarios.delete(s.id)}>{t('Supprimer')}</button>
          </article>
        ))}
      </section>
      <section className="card">
        <h2>{t('Effacement local')}</h2>
        <p>{t('Cette action supprime également les favoris et les ressources mises en cache.')}</p>
        <button className="danger" onClick={() => void erase()}>
          {t('Effacer toutes mes données')}
        </button>
      </section>
      <p role="status">{t(message)}</p>
    </main>
  );
}
