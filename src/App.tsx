import { useEffect, useState, useSyncExternalStore } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { updates } from './services/updateService';
import { Navigation } from './components/Navigation';
import { InstallButton } from './components/InstallButton';
import { ContextualHelp, Welcome } from './components/Onboarding';
import { FieldHelp } from './components/FieldHelp';
import { useTheme } from './hooks/useTheme';
import { ThemeContext } from './components/RuntimeContext';
import { db } from './db/database';
export function App() {
  const [online, setOnline] = useState(navigator.onLine),
    [dbError, setDbError] = useState('');
  const state = useSyncExternalStore(updates.subscribe, updates.getSnapshot);
  const theme = useTheme();
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
    <ThemeContext.Provider value={theme}>
      <header className="app-header">
        <Link className="brand" to="/">
          <span className="brand-icon">m</span>
          <span>
            mobilité<small>ISOCHRONES LOCALES</small>
          </span>
        </Link>
        <div className="header-tools">
          <InstallButton />
          <button
            className="theme-toggle"
            aria-label={
              theme.theme === 'dark' ? 'Activer le thème clair' : 'Activer le thème sombre'
            }
            title="Basculer entre les thèmes clair et sombre"
            onClick={() => theme.setTheme(theme.theme === 'dark' ? 'light' : 'dark')}
          >
            {theme.theme === 'dark' ? '☀' : '☾'}
          </button>
          <Navigation />
        </div>
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
      {state.pending && (
        <div className="update-banner" role="status">
          {state.message} <Link to="/systeme">Suivre la mise à jour</Link>
        </div>
      )}
      {!online && (
        <div className="offline-banner">
          Mode hors ligne · calculs disponibles avec un flux importé. Le fond externe est
          indisponible.
        </div>
      )}
      <ContextualHelp />
      <div id="page-content">
        <Outlet />
      </div>
      <FieldHelp />
      <Welcome />
      <footer>
        Calculé ici. Conservé ici. <Link to="/a-propos">À propos & confidentialité</Link>
        <span>
          {state.ready
            ? 'Application mise en cache ; données à importer séparément.'
            : 'Installation HTTPS nécessaire pour la PWA.'}
        </span>
      </footer>
    </ThemeContext.Provider>
  );
}
