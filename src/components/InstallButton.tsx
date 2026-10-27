import { t } from '../i18n';
import { useLocale } from '../i18n/useLocale';
import { useEffect, useState } from 'react';
import { Dialog } from './Dialog';
interface InstallPrompt extends Event {
  prompt: () => Promise<{ outcome: 'accepted' | 'dismissed' }>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
let deferred: InstallPrompt | undefined;
const subscribers = new Set<() => void>();
export function captureInstallPrompt() {
  const listener = (event: Event) => {
    event.preventDefault();
    deferred = event as InstallPrompt;
    subscribers.forEach((fn) => fn());
  };
  window.addEventListener('beforeinstallprompt', listener);
  return () => window.removeEventListener('beforeinstallprompt', listener);
}
export function InstallButton() {
  useLocale();

  const [installed, setInstalled] = useState(
      () =>
        window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true,
    ),
    [guide, setGuide] = useState(false),
    [message, setMessage] = useState(''),
    [pending, setPending] = useState(false);
  const [, render] = useState(0);
  useEffect(() => {
    const update = () => render((n) => n + 1);
    subscribers.add(update);
    const installed = () => {
      deferred = undefined;
      setInstalled(true);
      setGuide(false);
    };
    window.addEventListener('appinstalled', installed);
    return () => {
      subscribers.delete(update);
      window.removeEventListener('appinstalled', installed);
    };
  }, []);
  async function install() {
    if (!deferred) {
      setGuide(true);
      return;
    }
    const prompt = deferred;
    deferred = undefined;
    setPending(true);
    try {
      const result = await prompt.prompt();
      if (result.outcome === 'dismissed') {
        setMessage('Installation reportée. Vous pouvez réessayer depuis le menu du navigateur.');
        setGuide(true);
      } else setMessage('Demande acceptée. Le navigateur termine l’installation.');
    } catch {
      setGuide(true);
      setMessage('Utilisez le menu d’installation du navigateur.');
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      <button
        className="install-button"
        title={t('Ajouter Mobilitor à l’écran d’accueil ou au bureau')}
        disabled={installed || pending}
        onClick={() => void install()}
      >
        {installed
          ? t('✓ Application installée')
          : pending
            ? t('Installation…')
            : t('↧ Installer l’application')}
      </button>
      {guide && (
        <Dialog title={t('Installer Mobilitor')} onClose={() => setGuide(false)}>
          <p>
            {t(message) ||
              t(
                'Votre navigateur ne propose pas de dialogue automatique sur cette page. Voici comment ajouter Mobilitor à votre appareil.',
              )}
          </p>
          <ul>
            <li>
              <strong>{t('iPhone / iPad :')}</strong>{' '}
              {t(
                'ouvrir dans Safari, toucher Partager, puis « Sur l’écran d’accueil » et « Ajouter ».',
              )}
            </li>
            <li>
              <strong>{t('Android :')}</strong>{' '}
              {t(
                'ouvrir dans Chrome ou un navigateur compatible, menu ⋮, puis « Installer l’application » ou « Ajouter à l’écran d’accueil ».',
              )}
            </li>
            <li>
              <strong>{t('Ordinateur :')}</strong>{' '}
              {t(
                'utiliser l’icône d’installation près de la barre d’adresse ou le menu « Installer cette page en tant qu’application » de Chrome/Edge. Le libellé dépend du navigateur.',
              )}
            </li>
          </ul>
          <p className="muted">
            {t(
              'Si l’option est absente, ouvrez le site dans un navigateur externe sous HTTPS. L’installation ne télécharge pas les données de transport : importez-les séparément.',
            )}
          </p>
          <button className="primary" onClick={() => setGuide(false)}>
            {t('J’ai compris')}
          </button>
        </Dialog>
      )}
    </>
  );
}
