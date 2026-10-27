import { t, formatLocale } from '../i18n';
import { useLocale } from '../i18n/useLocale';
import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, clearDataset } from '../db/database';
import { getStorageUsage } from '../services/storageService';
import { acquireActivity } from '../services/activityService';
import type { Source } from '../db/schema';
export function DataManagementPage() {
  useLocale();

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
        message: t('Validation en cours'),
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
          message: failure || t('Import terminé'),
          updatedAt: new Date().toISOString(),
        });
        setUsage(await getStorageUsage());
      }
      worker.onmessage = (e) => {
        if (e.data.progress) setMessage(e.data.progress);
        else void finish(e.data.result, e.data.error);
      };
      worker.onerror = () => void finish(undefined, t('Erreur du Worker d’import.'));
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
        t('Supprimer ce jeu de données local ? Vos lieux et scénarios seront conservés.'),
      )
    )
      return;
    await clearDataset(id);
    setUsage(await getStorageUsage());
  }
  return (
    <main className="content-page">
      <span className="eyebrow">{t('VOTRE BIBLIOTHÈQUE LOCALE')}</span>
      <h1>{t('Les données font le trajet.')}</h1>
      <p className="lead">
        {t(
          'Installez les jeux dont vous avez besoin. Vous gardez la main sur leur source, leur version et leur stockage.',
        )}
      </p>
      <div className="data-grid">
        <section className="card">
          <h2>{t('Importer un fichier')}</h2>
          <p>
            {t('ZIP GTFS, CSV de stations ou GeoJSON WGS84. Maximum 40 Mo ; 500 000 horaires.')}
          </p>
          <label className="upload">
            ↧<strong>{t('Choisir sur cet appareil')}</strong>
            <input
              aria-label={t('Fichier à importer')}
              type="file"
              accept=".zip,.csv,.json,.geojson"
              disabled={busy}
              onChange={(e) => setFile(e.target.files?.[0])}
            />
            {file && (
              <small>
                {file.name} · {(file.size / 1024 / 1024).toFixed(2)} {t('Mo')}
              </small>
            )}
          </label>
          <label>
            {t('Producteur')}
            <input
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              placeholder="Île-de-France Mobilités"
            />
          </label>
          <label>
            {t('Licence vérifiée sur la fiche officielle')}
            <input
              value={license}
              onChange={(e) => setLicense(e.target.value)}
              placeholder={t('Licence et version applicables au fichier')}
            />
          </label>
          <label>
            {t('URL de la fiche officielle')}
            <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} />
          </label>
          <label>
            {t('Attribution')}
            <input value={attribution} onChange={(e) => setAttribution(e.target.value)} />
          </label>
          <label>
            {t('Version précédente')}
            <select value={replaceId} onChange={(e) => setReplace(e.target.value)}>
              <option value="">{t('Conserver tous les jeux existants')}</option>
              {sources.map((s) => (
                <option value={s.id} key={s.id}>
                  {t('Remplacer')} {s.name}
                </option>
              ))}
            </select>
          </label>
          <button
            className="primary"
            disabled={busy || !file || !provider || !license}
            onClick={() => void start()}
          >
            {busy ? t('Import en cours…') : t('Valider et installer →')}
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
              {t('Annuler')}
            </button>
          )}
          <p role="status">{t(message)}</p>
          {error && (
            <p role="alert" className="error">
              {t(error)}
            </p>
          )}
        </section>
        <div>
          <section className="card storage-card">
            <span className="eyebrow">{t('STOCKAGE DU NAVIGATEUR')}</span>
            <h2>
              {((usage.usage || 0) / 1024 / 1024).toFixed(1)} <small>{t('Mo utilisés')}</small>
            </h2>
            <progress value={usage.usage || 0} max={usage.quota || 1} />
            <p>
              {t('Quota estimé :')} {((usage.quota || 0) / 1024 / 1024).toFixed(0)}{' '}
              {t('Mo. L’estimation inclut les caches de cette origine.')}
            </p>
          </section>
          <section className="card">
            <h2>
              {t('Jeux installés')} <span className="count">{sources.length}</span>
            </h2>
            {!sources.length && (
              <p>{t('Aucun jeu installé. La carte n’affiche aucune donnée de démonstration.')}</p>
            )}
            {sources.map((s) => (
              <article className="dataset" key={s.id}>
                <strong>{s.name}</strong>
                <span className="badge">
                  {t('Validé ·')} {s.kind === 'gtfs' ? t('Horaires GTFS') : t('Géographie')}
                </span>
                <p>
                  {s.provider} · {(s.bytes / 1024 / 1024).toFixed(2)} {t('Mo compressés')}
                  <br />
                  {t('Importé le')} {new Date(s.importedAt).toLocaleString(formatLocale())}
                  <br />
                  {s.validFrom && t(`Validité : ${s.validFrom} – ${s.validTo}`)}
                </p>
                <small>
                  {Object.entries(s.counts)
                    .map(([n, c]) => `${n} : ${c}`)
                    .join(' · ')}
                </small>
                <button className="danger" onClick={() => void remove(s.id)}>
                  {t('Supprimer ce jeu')}
                </button>
              </article>
            ))}
          </section>
          <section className="notice">
            <strong>{t('Un import sûr')}</strong>
            <p>
              {t(
                'La nouvelle version est entièrement validée avant le remplacement. Une erreur ne supprime pas la version précédente. Prévoir environ 12 fois le poids du fichier libre.',
              )}
            </p>
            <p>
              {t(
                'Les téléchargements directs ne sont pas activés : récupérez les fichiers depuis les fiches officielles, puis importez-les ici.',
              )}
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
