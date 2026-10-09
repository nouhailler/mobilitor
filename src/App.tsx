import { useEffect, useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { db } from './db/database';
export function App() {
  const [online, setOnline] = useState(navigator.onLine),
    [dbError, setDbError] = useState('');
  const {
    needRefresh: [refresh],
    offlineReady: [ready],
    updateServiceWorker,
  } = useRegisterSW();
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    void db
      .open()
      .then(async () => {
        await db.importJobs.where('status').equals('running').modify({
          status: 'failed',
          message: 'Import interrompu à la fermeture. Consultez les jeux installés.',
        });
      })
      .catch(() =>
        setDbError('Le stockage IndexedDB est indisponible. Autorisez le stockage pour ce site.'),
      );
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);
  return (
    <>
      <header className="app-header">
        <Link className="brand" to="/">
          <span className="brand-icon">m</span>
          <span>
            mobilité<small>ISOCHRONES LOCALES</small>
          </span>
        </Link>
        <nav aria-label="Navigation principale">
          {[
            ['/', 'Explorer'],
            ['/comparaison', 'Comparer'],
            ['/donnees', 'Mes données'],
            ['/sources', 'Sources'],
            ['/parametres', 'Paramètres'],
          ].map(([path, label]) => (
            <NavLink key={path} to={path} end={path === '/'}>
              {label}
            </NavLink>
          ))}
        </nav>
        <span className={`connection ${online ? '' : 'offline'}`}>
          <i />
          {online ? 'Connecté' : 'Hors ligne'}
        </span>
      </header>
      {dbError && (
        <div role="alert" className="error">
          {dbError}
        </div>
      )}
      {refresh && (
        <div className="update-banner">
          Une nouvelle version est prête. Vos données IndexedDB sont conservées.{' '}
          <button onClick={() => void updateServiceWorker(true)}>Mettre à jour</button>
        </div>
      )}
      {!online && (
        <div className="offline-banner">
          Mode hors ligne · calculs disponibles avec un flux importé. Le fond externe est
          indisponible.
        </div>
      )}
      <Outlet />
      <footer>
        Calculé ici. Conservé ici. <Link to="/a-propos">À propos & confidentialité</Link>
        <span>
          {ready
            ? 'Application mise en cache ; données à importer séparément.'
            : 'Installation HTTPS nécessaire pour la PWA.'}
        </span>
      </footer>
    </>
  );
}
