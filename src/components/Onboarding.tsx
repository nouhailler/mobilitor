import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { db } from '../db/database';
import { Dialog } from './Dialog';
import { LegalNotice, LEGAL_VERSION } from './LegalNotice';
export function Welcome() {
  const [open, setOpen] = useState(false),
    [step, setStep] = useState(0),
    [read, setRead] = useState(false),
    [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    void db.preferences
      .get('onboarding.legal')
      .then((row) => {
        if (active && row?.value !== LEGAL_VERSION) setOpen(true);
      })
      .catch(() => setOpen(true));
    const replay = () => {
      setStep(0);
      setRead(false);
      setOpen(true);
    };
    window.addEventListener('mobilitor:welcome', replay);
    return () => {
      active = false;
      window.removeEventListener('mobilitor:welcome', replay);
    };
  }, []);
  async function finish() {
    try {
      await db.preferences.put({ key: 'onboarding.legal', value: LEGAL_VERSION });
      setOpen(false);
    } catch {
      setError('Avis lu pour cette session. Le navigateur ne permet pas de mémoriser ce choix.');
      setOpen(false);
    }
  }
  if (!open)
    return error ? (
      <p className="notice" role="status">
        {error}
      </p>
    ) : null;
  return (
    <Dialog
      title={
        step === 0
          ? 'Bienvenue dans Mobilitor'
          : step === 1
            ? 'Vos données, votre appareil'
            : 'Informations légales et responsabilité'
      }
      onClose={() => {
        if (step < 2) setStep(2);
        else setOpen(false);
      }}
    >
      <p className="eyebrow">PRISE EN MAIN · {step + 1} / 3</p>
      {step === 0 ? (
        <>
          <h3>Une carte pour explorer vos déplacements</h3>
          <p>
            Découvrez la France sur OpenStreetMap, puis importez vos horaires pour calculer vos
            trajets et comparer des points de départ. Le menu ☰ regroupe toutes les fonctionnalités
            par catégorie.
          </p>
          <p>
            Le bouton « Installer l’application » vous accompagne pour ajouter Mobilitor à votre
            écran d’accueil ou à votre bureau.
          </p>
        </>
      ) : step === 1 ? (
        <>
          <h3>Aucun compte, aucun serveur de calcul</h3>
          <p>
            Importez un fichier GTFS dans « Mes données ». Les calculs, favoris et scénarios restent
            sur cet appareil. Les aides de chaque écran et les boutons ⓘ expliquent les champs.
          </p>
          <p>
            Le fond cartographique nécessite Internet. Les fonctions locales restent utilisables
            hors ligne après mise en cache de l’application et import des données.
          </p>
          <p>
            Les mises à jour de l’application se téléchargent automatiquement lorsqu’elle est
            ouverte et connectée. Les données de transport ne sont jamais actualisées implicitement.
          </p>
        </>
      ) : (
        <>
          <LegalNotice />
          <label className="toggle">
            <input type="checkbox" checked={read} onChange={(e) => setRead(e.target.checked)} />
            J’ai lu les informations sur les données et les limites de responsabilité.
          </label>
        </>
      )}
      <div className="dialog-actions">
        {step > 0 && <button onClick={() => setStep(step - 1)}>Précédent</button>}
        {step < 2 ? (
          <button className="primary" onClick={() => setStep(step + 1)}>
            Continuer
          </button>
        ) : (
          <button className="primary" disabled={!read} onClick={() => void finish()}>
            Commencer à explorer
          </button>
        )}
      </div>
    </Dialog>
  );
}
export const SCREEN_HELP: Record<string, { title: string; steps: string[] }> = {
  '/': {
    title: 'Explorer et calculer',
    steps: [
      'Choisissez un flux GTFS importé puis un arrêt d’origine. Le clic sur la carte propose des arrêts proches, sans inventer un trajet à pied.',
      'Réglez la date et l’heure de Paris. Passez d’Isochrones à Itinéraire pour choisir une destination.',
      'Les seuils 15/30/45/60 minutes filtrent les arrêts atteignables. Utilisez les couches de carte, les exports et les favoris après calcul.',
    ],
  },
  '/comparaison': {
    title: 'Comparer des origines',
    steps: [
      'Sélectionnez deux ou trois arrêts du même flux.',
      'Utilisez une date, une heure et un seuil communs. Les couleurs distinguent les origines.',
      'Comparez les comptes d’arrêts, exportez les résultats ou enregistrez le scénario.',
    ],
  },
  '/donnees': {
    title: 'Installer vos données',
    steps: [
      'Choisissez un CSV de stations, un GeoJSON WGS84 ou un ZIP GTFS compatible (40 Mo maximum).',
      'Renseignez producteur, licence, attribution et provenance. Gardez les jeux existants ou choisissez celui à remplacer.',
      'L’import valide les données avant écriture. Consultez le rapport, la validité et l’espace utilisé avant de calculer.',
    ],
  },
  '/sources': {
    title: 'Comprendre la provenance',
    steps: [
      'Consultez les fiches officielles des producteurs avant de télécharger un jeu.',
      'Vérifiez la licence, la date et la couverture de la ressource. Aucun lien ne certifie la validité actuelle d’un fichier.',
      'La partie des jeux installés restitue la provenance et le checksum renseignés à l’import.',
    ],
  },
  '/parametres': {
    title: 'Personnaliser et conserver',
    steps: [
      'Choisissez un thème clair, sombre ou celui du système, ainsi que le seuil temporel par défaut.',
      'Le fond en ligne est facultatif. Demandez la persistance pour réduire le risque d’éviction par le navigateur.',
      'Gérez vos lieux et scénarios ; l’effacement global supprime explicitement les données et les caches.',
    ],
  },
  '/systeme': {
    title: 'Installation et mises à jour',
    steps: [
      'La date de sortie et la version décrivent cette application ; la dernière vérification correspond à un contrôle réussi du Service Worker.',
      '« Vérifier les mises à jour » interroge le serveur sans effacer vos données. « Forcer la mise à jour » applique une version téléchargée dès que les opérations sont terminées.',
      'L’installation sur l’appareil utilise le dialogue du navigateur lorsqu’il existe, sinon des instructions adaptées vous guident.',
    ],
  },
  '/a-propos': {
    title: 'Informations et responsabilité',
    steps: [
      'Lisez les limites des données tierces et des calculs théoriques.',
      'Retrouvez les informations de confidentialité, les contacts du projet et les conditions d’utilisation des données.',
      'Vous pouvez revoir le parcours de bienvenue depuis les paramètres système.',
    ],
  },
};
export function ContextualHelp() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(true);
  const help = SCREEN_HELP[pathname];
  useEffect(() => {
    let active = true;
    setOpen(false);
    setHidden(true);
    void db.preferences
      .get(`guide:${pathname}`)
      .then((row) => {
        if (active) setHidden(row?.value === true);
      })
      .catch(() => setHidden(false));
    return () => {
      active = false;
    };
  }, [pathname]);
  if (!help) return null;
  return (
    <aside className="contextual-help" aria-label="Aide de cet écran">
      <button
        className="help-toggle"
        aria-expanded={open || !hidden}
        onClick={() => {
          if (!hidden) {
            setHidden(true);
            setOpen(false);
          } else setOpen(!open);
        }}
      >
        ⓘ Guide de cet écran
      </button>
      {(open || !hidden) && (
        <div className="help-body">
          <strong>{help.title}</strong>
          <ol>
            {help.steps.map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ol>
          <button
            onClick={() => {
              setOpen(false);
              setHidden(true);
              void db.preferences.put({ key: `guide:${pathname}`, value: true });
            }}
          >
            J’ai compris, masquer ce guide
          </button>
        </div>
      )}
    </aside>
  );
}
