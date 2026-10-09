import { sourceRegistry } from '../imports/sourceRegistry';
import { db } from '../db/database';
import { useLiveQuery } from 'dexie-react-hooks';
export function SourcesPage() {
  const installed = useLiveQuery(() => db.dataSources.toArray(), [], []);
  return (
    <main className="content-page">
      <span className="eyebrow">PROVENANCE & TRANSPARENCE</span>
      <h1>Chaque donnée a une source.</h1>
      <p className="lead">
        Fiches officielles consultées le 9 octobre 2026. Aucun jeu public n’est livré avec
        l’application.
      </p>
      <div className="source-grid">
        {sourceRegistry.map((s) => (
          <section className="card" key={s.name}>
            <span className="eyebrow">{s.provider}</span>
            <h2>{s.name}</h2>
            <span className="badge">{s.format}</span>
            <p>{s.license}</p>
            <p className="muted">{s.limits}</p>
            <small>Champs utilisés : {s.fields}</small>
            <a href={s.url} target="_blank" rel="noreferrer">
              Consulter la fiche officielle ↗
            </a>
          </section>
        ))}
      </div>
      <h2>Provenance des fichiers installés</h2>
      {installed.map((s) => (
        <section className="card" key={s.id}>
          <strong>{s.name}</strong>
          <p>
            {s.attribution || s.provider} · {s.license}
          </p>
          {s.url && (
            <a href={s.url} rel="noreferrer" target="_blank">
              Fiche renseignée à l’import ↗
            </a>
          )}
          <small>
            Import : {s.importedAt} · SHA-256 : {s.checksum}
          </small>
        </section>
      ))}
      <p>
        La disponibilité publique ne remplace pas les obligations d’attribution et de
        redistribution. Vérifiez la licence du fichier téléchargé.
      </p>
    </main>
  );
}
