import { t } from '../i18n';
import { useLocale } from '../i18n/useLocale';
import { sourceRegistry } from '../imports/sourceRegistry';
import { db } from '../db/database';
import { useLiveQuery } from 'dexie-react-hooks';
export function SourcesPage() {
  useLocale();

  const installed = useLiveQuery(() => db.dataSources.toArray(), [], []);
  return (
    <main className="content-page">
      <span className="eyebrow">{t('PROVENANCE & TRANSPARENCE')}</span>
      <h1>{t('Chaque donnée a une source.')}</h1>
      <p className="lead">
        {t(
          'Fiches officielles consultées le 9 octobre 2026. Aucun jeu public n’est livré avec l’application.',
        )}
      </p>
      <div className="source-grid">
        {sourceRegistry.map((s) => (
          <section className="card" key={t(s.name)}>
            <span className="eyebrow">{s.provider}</span>
            <h2>{t(s.name)}</h2>
            <span className="badge">{t(s.format)}</span>
            <p>{t(s.license)}</p>
            <p className="muted">{t(s.limits)}</p>
            <small>
              {t('Champs utilisés :')} {t(s.fields)}
            </small>
            <a href={s.url} target="_blank" rel="noreferrer">
              {t('Consulter la fiche officielle ↗')}
            </a>
          </section>
        ))}
      </div>
      <h2>{t('Provenance des fichiers installés')}</h2>
      {installed.map((s) => (
        <section className="card" key={s.id}>
          <strong>{s.name}</strong>
          <p>
            {s.attribution || s.provider} · {s.license}
          </p>
          {s.url && (
            <a href={s.url} rel="noreferrer" target="_blank">
              {t('Fiche renseignée à l’import ↗')}
            </a>
          )}
          <small>
            {t('Import :')} {s.importedAt} {t('· SHA-256 :')} {s.checksum}
          </small>
        </section>
      ))}
      <p>
        {t(
          'La disponibilité publique ne remplace pas les obligations d’attribution et de redistribution. Vérifiez la licence du fichier téléchargé.',
        )}
      </p>
    </main>
  );
}
