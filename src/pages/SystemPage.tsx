import { t, formatLocale } from '../i18n';
import { useLocale } from '../i18n/useLocale';
import { useSyncExternalStore } from 'react';
import { updates } from '../services/updateService';
import { RELEASE } from '../release';
import { InstallButton } from '../components/InstallButton';
import { HelpTip } from '../components/HelpTip';
const date = (stamp?: string) =>
  stamp
    ? new Intl.DateTimeFormat(formatLocale(), { dateStyle: 'long', timeStyle: 'short' }).format(
        new Date(stamp),
      )
    : t('Jamais vérifiée avec succès');
export function SystemPage() {
  useLocale();

  const state = useSyncExternalStore(updates.subscribe, updates.getSnapshot);
  return (
    <main className="content-page narrow">
      <span className="eyebrow">{t('APPLICATION & MAINTENANCE')}</span>
      <h1>{t('Paramètres système')}</h1>
      <section className="card">
        <h2>{t('Version de l’application')}</h2>
        <dl className="system-info">
          <dt>{t('Version')}</dt>
          <dd>{RELEASE.version}</dd>
          <dt>
            {t('Date de sortie')}{' '}
            <HelpTip
              text={t(
                'Date déclarée de publication de cette version de Mobilitor. Elle ne correspond pas à la mise à jour des horaires de transport.',
              )}
            />
          </dt>
          <dd>
            <time dateTime={RELEASE.date}>
              {new Intl.DateTimeFormat(formatLocale(), { dateStyle: 'long' }).format(
                new Date(`${RELEASE.date}T12:00:00Z`),
              )}
            </time>
          </dd>
          <dt>{t('Identifiant du build')}</dt>
          <dd>{RELEASE.buildId}</dd>
          <dt>
            {t('Dernière vérification réussie')}{' '}
            <HelpTip
              text={t(
                'Date locale du dernier contrôle réussi du Service Worker sur cet appareil, conservée dans IndexedDB. Un échec réseau ne modifie pas cette date.',
              )}
            />
          </dt>
          <dd>{date(state.lastChecked)}</dd>
          {state.lastAttempt && (
            <>
              <dt>{t('Dernière tentative')}</dt>
              <dd>{date(state.lastAttempt)}</dd>
            </>
          )}
        </dl>
      </section>
      <section className="card">
        <h2>{t('Mises à jour automatiques')}</h2>
        <p>
          {t(
            'Vérification au démarrage, au retour sur l’application, au rétablissement de la connexion et toutes les 30 minutes lorsqu’elle est ouverte. Les fichiers sont téléchargés en arrière-plan, puis la version est activée pendant une pause, sans import ni calcul actif.',
          )}
        </p>
        <p>
          {t(
            'Le navigateur peut suspendre une application fermée ou masquée. Sans verrouillage inter-onglets compatible, la version téléchargée sera activée après fermeture de toutes ses fenêtres et réouverture. Les données de transport ne sont pas mises à jour automatiquement.',
          )}
        </p>
        <div className="system-actions">
          <button
            disabled={state.checking || state.applying}
            onClick={() => void updates.check()}
            title={t('Contrôler la présence d’un nouveau Service Worker sans supprimer de données')}
          >
            {state.checking ? t('Vérification…') : t('Vérifier les mises à jour')}
          </button>
          <button
            className="primary"
            disabled={state.checking || state.applying}
            onClick={() => void updates.force()}
            title={t(
              'Appliquer une nouvelle version téléchargée ; les données IndexedDB et favoris restent conservés',
            )}
          >
            {t('Forcer la mise à jour')}
          </button>
        </div>
        <p role="status">{t(state.message)}</p>
        {state.error && (
          <p role="alert" className="error">
            {t(state.error)}
          </p>
        )}
      </section>
      <section className="card">
        <h2>{t('Installer sur cet appareil')}</h2>
        <p>
          {t(
            'Ajoutez Mobilitor à votre écran d’accueil ou à votre bureau. La disponibilité du dialogue automatique dépend du navigateur.',
          )}
        </p>
        <InstallButton />
      </section>
      <section className="card">
        <h2>{t('Revoir la prise en main')}</h2>
        <p>
          {t(
            'Relisez l’introduction et les informations sur les données, la confidentialité et la responsabilité.',
          )}
        </p>
        <button onClick={() => window.dispatchEvent(new Event('mobilitor:welcome'))}>
          {t('Revoir l’onboarding et les mentions légales')}
        </button>
      </section>
    </main>
  );
}
