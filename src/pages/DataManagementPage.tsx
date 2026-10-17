import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, clearDataset } from '../db/database';
import { getStorageUsage } from '../services/storageService';
import { acquireActivity } from '../services/activityService';
import type { Source } from '../db/schema';
export function DataManagementPage() {
  const sources = useLiveQuery(() => db.dataSources.toArray(), [], []);
  const [file, setFile] = useState<File>(),
    [provider, setProvider] = useState(''),
    [license, setLicense] = useState(''),
    [url, setUrl] = useState(''),
    [attribution, setAttribution] = useState(''),
    [replaceId, setReplace] = useState(''),
    [message, setMessage] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [usage, setUsage] = useState<StorageEstimate>({});
  const activityRelease = useRef<(() => void) | undefined>(undefined);
  const workerRef = useRef<Worker | null>(null);
  useEffect(() => {
    void getStorageUsage().then(setUsage);
    return () => {
      workerRef.current?.terminate();
      activityRelease.current?.();
    };
  }, []);
  async function start() {
    if (!file) return;
    setBusy(true);
    setError('');
    setMessage('Démarrage du Worker…');
    activityRelease.current = await acquireActivity();
    try {
      const id = crypto.randomUUID();
      await db.importJobs.put({
        id,
        name: file.name,
        status: 'running',
        message: 'Validation en cours',
        updatedAt: new Date().toISOString(),
      });
      const worker = new Worker(new URL('../workers/import.worker.ts', import.meta.url), {
        type: 'module',
      });
      workerRef.current = worker;
      async function finish(result?: Source, failure?: string) {
        worker.terminate();
        workerRef.current = null;
        activityRelease.current?.();
        activityRelease.current = undefined;
        setBusy(false);
        if (failure) {
          setError(failure);
          setMessage('');
        } else
          setMessage(
            `Import validé : ${Object.values(result!.counts).reduce((a, b) => a + b, 0)} enregistrements. ${result!.warnings.join(' ')}`,
          );
        await db.importJobs.update(id, {
          status: failure ? 'failed' : 'complete',
          message: failure || 'Import terminé',
          updatedAt: new Date().toISOString(),
        });
        setUsage(await getStorageUsage());
      }
      worker.onmessage = (e) => {
        if (e.data.progress) setMessage(e.data.progress);
        else void finish(e.data.result, e.data.error);
      };
      worker.onerror = () => void finish(undefined, 'Erreur du Worker d’import.');
      worker.postMessage({
        file,
        metadata: { provider, license, url, attribution, replaceId: replaceId || undefined },
      });
    } catch (error) {
      activityRelease.current?.();
      activityRelease.current = undefined;
      setBusy(false);
      setError(error instanceof Error ? error.message : String(error));
    }
  }
  async function remove(id: string) {
    if (
      !window.confirm(
        'Supprimer ce jeu de données local ? Vos lieux et scénarios seront conservés.',
      )
    )
      return;
    await clearDataset(id);
    setUsage(await getStorageUsage());
  }
  return (
    <main className="content-page">
      <span className="eyebrow">VOTRE BIBLIOTHÈQUE LOCALE</span>
      <h1>Les données font le trajet.</h1>
      <p className="lead">
        Installez les jeux dont vous avez besoin. Vous gardez la main sur leur source, leur version
        et leur stockage.
      </p>
      <div className="data-grid">
        <section className="card">
          <h2>Importer un fichier</h2>
          <p>ZIP GTFS, CSV de stations ou GeoJSON WGS84. Maximum 40 Mo ; 500 000 horaires.</p>
          <label className="upload">
            ↧<strong>Choisir sur cet appareil</strong>
            <input
              aria-label="Fichier à importer"
              type="file"
              accept=".zip,.csv,.json,.geojson"
              disabled={busy}
              onChange={(e) => setFile(e.target.files?.[0])}
            />
            {file && (
              <small>
                {file.name} · {(file.size / 1024 / 1024).toFixed(2)} Mo
              </small>
            )}
          </label>
          <label>
            Producteur
            <input
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              placeholder="Île-de-France Mobilités"
            />
          </label>
          <label>
            Licence vérifiée sur la fiche officielle
            <input
              value={license}
              onChange={(e) => setLicense(e.target.value)}
              placeholder="Licence et version applicables au fichier"
            />
          </label>
          <label>
            URL de la fiche officielle
            <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} />
          </label>
          <label>
            Attribution
            <input value={attribution} onChange={(e) => setAttribution(e.target.value)} />
          </label>
          <label>
            Version précédente
            <select value={replaceId} onChange={(e) => setReplace(e.target.value)}>
              <option value="">Conserver tous les jeux existants</option>
              {sources.map((s) => (
                <option value={s.id} key={s.id}>
                  Remplacer {s.name}
                </option>
              ))}
            </select>
          </label>
          <button
            className="primary"
            disabled={busy || !file || !provider || !license}
            onClick={() => void start()}
          >
            {busy ? 'Import en cours…' : 'Valider et installer →'}
          </button>
          {busy && (
            <button
              onClick={() => {
                workerRef.current?.terminate();
                workerRef.current = null;
                activityRelease.current?.();
                activityRelease.current = undefined;
                setBusy(false);
                setMessage(
                  'Import interrompu. Une transaction en cours est annulée par IndexedDB ; consultez la liste des jeux.',
                );
              }}
            >
              Annuler
            </button>
          )}
          <p role="status">{message}</p>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
        </section>
        <div>
          <section className="card storage-card">
            <span className="eyebrow">STOCKAGE DU NAVIGATEUR</span>
            <h2>
              {((usage.usage || 0) / 1024 / 1024).toFixed(1)} <small>Mo utilisés</small>
            </h2>
            <progress value={usage.usage || 0} max={usage.quota || 1} />
            <p>
              Quota estimé : {((usage.quota || 0) / 1024 / 1024).toFixed(0)} Mo. L’estimation inclut
              les caches de cette origine.
            </p>
          </section>
          <section className="card">
            <h2>
              Jeux installés <span className="count">{sources.length}</span>
            </h2>
            {!sources.length && (
              <p>Aucun jeu installé. La carte n’affiche aucune donnée de démonstration.</p>
            )}
            {sources.map((s) => (
              <article className="dataset" key={s.id}>
                <strong>{s.name}</strong>
                <span className="badge">
                  Validé · {s.kind === 'gtfs' ? 'Horaires GTFS' : 'Géographie'}
                </span>
                <p>
                  {s.provider} · {(s.bytes / 1024 / 1024).toFixed(2)} Mo compressés
                  <br />
                  Importé le {new Date(s.importedAt).toLocaleString('fr-FR')}
                  <br />
                  {s.validFrom && `Validité : ${s.validFrom} – ${s.validTo}`}
                </p>
                <small>
                  {Object.entries(s.counts)
                    .map(([n, c]) => `${n} : ${c}`)
                    .join(' · ')}
                </small>
                <button className="danger" onClick={() => void remove(s.id)}>
                  Supprimer ce jeu
                </button>
              </article>
            ))}
          </section>
          <section className="notice">
            <strong>Un import sûr</strong>
            <p>
              La nouvelle version est entièrement validée avant le remplacement. Une erreur ne
              supprime pas la version précédente. Prévoir environ 12 fois le poids du fichier libre.
            </p>
            <p>
              Les téléchargements directs ne sont pas activés : récupérez les fichiers depuis les
              fiches officielles, puis importez-les ici.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
