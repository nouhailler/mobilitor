import { createHashRouter, Link } from 'react-router-dom';
import { App } from './App';
import { MapPage } from './pages/MapPage';
import { DataManagementPage } from './pages/DataManagementPage';
import { SourcesPage } from './pages/SourcesPage';
import { SettingsPage } from './pages/SettingsPage';
export const router = createHashRouter([
  {
    element: <App />,
    children: [
      { path: '/', element: <MapPage /> },
      { path: '/comparaison', element: <MapPage key="compare" comparison /> },
      { path: '/donnees', element: <DataManagementPage /> },
      { path: '/sources', element: <SourcesPage /> },
      { path: '/parametres', element: <SettingsPage /> },
      {
        path: '/a-propos',
        element: (
          <main className="content-page narrow">
            <span className="eyebrow">MOBILITÉ · VERSION 0.1</span>
            <h1>Une carte à vous.</h1>
            <section className="card">
              <h2>Locale, indépendante, transparente.</h2>
              <p>
                Cette application calcule dans votre navigateur. Aucun compte, aucune télémétrie et
                aucune synchronisation distante. Les données importées restent dans IndexedDB.
              </p>
              <p>
                Les horaires sont théoriques. La marche, les fréquences GTFS, le temps réel et les
                jours de changement d’heure ne sont pas pris en charge. Les résultats ne constituent
                pas une garantie de déplacement.
              </p>
              <p>
                La géolocalisation est demandée seulement au clic. La position n’est persistée que
                si vous enregistrez volontairement un lieu.
              </p>
              <p>
                Installez la PWA depuis votre navigateur sur HTTPS : menu d’installation sur Android
                et ordinateur ; Partager → Sur l’écran d’accueil sur iOS. Importez ensuite les
                données nécessaires.
              </p>
              <p>
                Le navigateur et l’hébergeur peuvent conserver des journaux techniques. Le stockage
                peut être supprimé ou évincé. Gardez les fichiers sources pour réimporter vos
                données.
              </p>
            </section>
          </main>
        ),
      },
      {
        path: '*',
        element: (
          <main className="content-page">
            <h1>Cette page n’existe pas.</h1>
            <Link to="/">Revenir à la carte</Link>
          </main>
        ),
      },
    ],
  },
]);
