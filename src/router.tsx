import { t } from './i18n';
import { useLocale } from './i18n/useLocale';
import { createHashRouter, Link } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { App } from './App';
import { MapPage } from './pages/MapPage';
import { DataManagementPage } from './pages/DataManagementPage';
import { SourcesPage } from './pages/SourcesPage';
import { SystemPage } from './pages/SystemPage';
import { LegalNotice } from './components/LegalNotice';
import { RELEASE } from './release';
import { SettingsPage } from './pages/SettingsPage';
function AboutPage() {
  useLocale();
  return (
    <main className="content-page narrow">
      <span className="eyebrow">
        {t('MOBILITÉ · VERSION')} {RELEASE.version}
      </span>
      <h1>{t('À propos et mentions légales')}</h1>
      <section className="card">
        <LegalNotice />
      </section>
      <section className="card">
        <h2>{t('Locale, indépendante, transparente.')}</h2>
        <p>
          {t(
            'Cette application calcule dans votre navigateur. Aucun compte, aucune télémétrie et aucune synchronisation distante. Les données importées restent dans IndexedDB.',
          )}
        </p>
        <p>
          {t(
            'Les horaires sont théoriques. La marche, les fréquences GTFS, le temps réel et les jours de changement d’heure ne sont pas pris en charge. Les résultats ne constituent pas une garantie de déplacement.',
          )}
        </p>
        <p>
          {t(
            'La géolocalisation est demandée seulement au clic. La position n’est persistée que si vous enregistrez volontairement un lieu.',
          )}
        </p>
        <p>
          {t(
            'Installez la PWA depuis votre navigateur sur HTTPS : menu d’installation sur Android et ordinateur ; Partager → Sur l’écran d’accueil sur iOS. Importez ensuite les données nécessaires.',
          )}
        </p>
        <p>
          {t(
            'Le navigateur et l’hébergeur peuvent conserver des journaux techniques. Le stockage peut être supprimé ou évincé. Gardez les fichiers sources pour réimporter vos données.',
          )}
        </p>
      </section>
    </main>
  );
}

function NotFoundPage() {
  useLocale();
  return (
    <main className="content-page">
      <h1>{t('Cette page n’existe pas.')}</h1>
      <Link to="/">{t('Revenir à la carte')}</Link>
    </main>
  );
}

export const router = createHashRouter([
  { path: '/presentation', element: <LandingPage /> },
  { path: '/presentation/fr', element: <LandingPage language="fr" /> },
  { path: '/presentation/en', element: <LandingPage language="en" /> },
  {
    element: <App />,
    children: [
      { path: '/', element: <MapPage /> },
      { path: '/comparaison', element: <MapPage key="compare" comparison /> },
      { path: '/donnees', element: <DataManagementPage /> },
      { path: '/sources', element: <SourcesPage /> },
      { path: '/parametres', element: <SettingsPage /> },
      { path: '/systeme', element: <SystemPage /> },
      {
        path: '/a-propos',
        element: <AboutPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
