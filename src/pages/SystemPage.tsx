import { useSyncExternalStore } from 'react';
import { updates } from '../services/updateService';
import { RELEASE } from '../release';
import { InstallButton } from '../components/InstallButton';
import { HelpTip } from '../components/HelpTip';
const date = (stamp?: string) =>
  stamp
    ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' }).format(
        new Date(stamp),
      )
    : 'Jamais vérifiée avec succès';
export function SystemPage() {
  const state = useSyncExternalStore(updates.subscribe, updates.getSnapshot);
  return (
    <main className="content-page narrow">
      <span className="eyebrow">APPLICATION & MAINTENANCE</span>
      <h1>Paramètres système</h1>
      <section className="card">
        <h2>Version de l’application</h2>
        <dl className="system-info">
          <dt>Version</dt>
          <dd>{RELEASE.version}</dd>
          <dt>
            Date de sortie{' '}
            <HelpTip text="Date déclarée de publication de cette version de Mobilitor. Elle ne correspond pas à la mise à jour des horaires de transport." />
          </dt>
          <dd>
            <time dateTime={RELEASE.date}>
              {new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(
                new Date(`${RELEASE.date}T12:00:00Z`),
              )}
            </time>
          </dd>
          <dt>Identifiant du build</dt>
          <dd>{RELEASE.buildId}</dd>
          <dt>
            Dernière vérification réussie{' '}
            <HelpTip text="Date locale du dernier contrôle réussi du Service Worker sur cet appareil, conservée dans IndexedDB. Un échec réseau ne modifie pas cette date." />
          </dt>
          <dd>{date(state.lastChecked)}</dd>
          {state.lastAttempt && (
            <>
              <dt>Dernière tentative</dt>
              <dd>{date(state.lastAttempt)}</dd>
            </>
          )}
        </dl>
      </section>
      <section className="card">
        <h2>Mises à jour automatiques</h2>
        <p>
          Vérification au démarrage, au retour sur l’application, au rétablissement de la connexion
          et toutes les 30 minutes lorsqu’elle est ouverte. Les fichiers sont téléchargés en
          arrière-plan, puis la version est activée pendant une pause, sans import ni calcul actif.
        </p>
        <p>
          Le navigateur peut suspendre une application fermée ou masquée. Sans verrouillage
          inter-onglets compatible, la version téléchargée sera activée après fermeture de toutes
          ses fenêtres et réouverture. Les données de transport ne sont pas mises à jour
          automatiquement.
        </p>
        <div className="system-actions">
          <button
            disabled={state.checking || state.applying}
            onClick={() => void updates.check()}
            title="Contrôler la présence d’un nouveau Service Worker sans supprimer de données"
          >
            {state.checking ? 'Vérification…' : 'Vérifier les mises à jour'}
          </button>
          <button
            className="primary"
            disabled={state.checking || state.applying}
            onClick={() => void updates.force()}
            title="Appliquer une nouvelle version téléchargée ; les données IndexedDB et favoris restent conservés"
          >
            Forcer la mise à jour
          </button>
        </div>
        <p role="status">{state.message}</p>
        {state.error && (
          <p role="alert" className="error">
            {state.error}
          </p>
        )}
      </section>
      <section className="card">
        <h2>Installer sur cet appareil</h2>
        <p>
          Ajoutez Mobilitor à votre écran d’accueil ou à votre bureau. La disponibilité du dialogue
          automatique dépend du navigateur.
        </p>
        <InstallButton />
      </section>
      <section className="card">
        <h2>Revoir la prise en main</h2>
        <p>
          Relisez l’introduction et les informations sur les données, la confidentialité et la
          responsabilité.
        </p>
        <button onClick={() => window.dispatchEvent(new Event('mobilitor:welcome'))}>
          Revoir l’onboarding et les mentions légales
        </button>
      </section>
    </main>
  );
}
