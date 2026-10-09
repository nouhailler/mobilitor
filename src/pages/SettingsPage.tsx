import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, clearAll } from '../db/database';
import { requestPersistence } from '../services/storageService';
export function SettingsPage() {
  const places = useLiveQuery(() => db.savedPlaces.toArray(), [], []),
    scenarios = useLiveQuery(() => db.savedScenarios.toArray(), [], []);
  const [tiles, setTiles] = useState(false),
    [threshold, setThreshold] = useState(30),
    [message, setMessage] = useState('');
  useEffect(() => {
    void db.preferences.get('onlineTiles').then((p) => setTiles(p?.value === true));
    void db.preferences.get('threshold').then((p) => {
      if ([15, 30, 45, 60].includes(Number(p?.value))) setThreshold(Number(p?.value));
    });
  }, []);
  async function erase() {
    if (
      !window.confirm('Effacer tous les jeux, lieux, scénarios et préférences sur cet appareil ?')
    )
      return;
    await clearAll();
    for (const name of await caches.keys()) await caches.delete(name);
    setTiles(false);
    setMessage(
      'Données et caches effacés. Reconnectez-vous et rechargez pour préparer à nouveau le mode hors ligne.',
    );
  }
  return (
    <main className="content-page narrow">
      <span className="eyebrow">SUR CET APPAREIL</span>
      <h1>Vous gardez le contrôle.</h1>
      <section className="card">
        <h2>Fond cartographique</h2>
        <label className="toggle">
          <input
            type="checkbox"
            checked={tiles}
            onChange={(e) => {
              setTiles(e.target.checked);
              void db.preferences.put({ key: 'onlineTiles', value: e.target.checked });
            }}
          />
          Activer le fond OpenStreetMap en ligne
        </label>
        <p>
          L’activation transmet au fournisseur les demandes de tuiles et l’adresse IP. Aucun favori
          ni horaire de recherche n’est envoyé. Ce fond n’est pas disponible hors ligne.
        </p>
      </section>
      <section className="card">
        <h2>Seuil par défaut</h2>
        <label>
          Temps disponible
          <select
            value={threshold}
            onChange={(e) => {
              setThreshold(Number(e.target.value));
              void db.preferences.put({ key: 'threshold', value: Number(e.target.value) });
            }}
          >
            {[15, 30, 45, 60].map((n) => (
              <option key={n} value={n}>
                {n} minutes
              </option>
            ))}
          </select>
        </label>
      </section>
      <section className="card">
        <h2>Préserver le stockage</h2>
        <p>
          Le navigateur peut évincer les données. Une demande de persistance réduit ce risque
          lorsqu’elle est acceptée.
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
          Demander la persistance
        </button>
      </section>
      <section className="card">
        <h2>Lieux enregistrés</h2>
        {!places.length && <p>Aucun lieu enregistré.</p>}
        {places.map((p) => (
          <article className="dataset" key={p.id}>
            <strong>{p.name}</strong>
            <small>
              {p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}
            </small>
            <button onClick={() => void db.savedPlaces.delete(p.id)}>Supprimer</button>
          </article>
        ))}
      </section>
      <section className="card">
        <h2>Scénarios enregistrés</h2>
        {!scenarios.length && <p>Aucun scénario enregistré.</p>}
        {scenarios.map((s) => (
          <article className="dataset" key={s.id}>
            <strong>{s.name}</strong>
            <small>
              {s.origins.length} origine(s) · {s.date} · {s.time}
            </small>
            <Link to={`${s.origins.length > 1 ? '/comparaison' : '/'}?scenario=${s.id}`}>
              Rouvrir ce scénario →
            </Link>
            <button onClick={() => void db.savedScenarios.delete(s.id)}>Supprimer</button>
          </article>
        ))}
      </section>
      <section className="card">
        <h2>Effacement local</h2>
        <p>Cette action supprime également les favoris et les ressources mises en cache.</p>
        <button className="danger" onClick={() => void erase()}>
          Effacer toutes mes données
        </button>
      </section>
      <p role="status">{message}</p>
    </main>
  );
}
