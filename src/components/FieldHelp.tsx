import { t, sourceLabel } from '../i18n';
import { useLocale } from '../i18n/useLocale';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { HelpTip } from './HelpTip';
const tips: Record<string, string> = {
  'Langue de l’interface':
    'Choisissez le français ou l’anglais. Votre choix est conservé sur cet appareil.',
  Arrêts: 'Afficher ou masquer les stations importées dans l’emprise visible (1 500 au maximum).',
  Lignes:
    'Afficher ou masquer les tracés géographiques importés ; ils ne créent pas de connexions de transport.',
  Limites: 'Afficher ou masquer les limites administratives importées.',
  'Jeu d’horaires':
    'Choisissez le jeu GTFS utilisé pour les calculs. Les stations géographiques seules ne fournissent aucun horaire.',
  'Point de départ':
    'Cherchez un arrêt dans les données locales du flux choisi. Aucun accès à pied n’est ajouté.',
  Destination: 'Choisissez l’arrêt d’arrivée dans le même flux que l’origine.',
  'Origine 2': 'Deuxième point de départ, comparé avec les mêmes horaires et seuils.',
  'Origine 3 (facultative)': 'Troisième origine facultative. Elle doit appartenir au même flux.',
  'Date de départ':
    'Jour de service du flux importé. Une date hors couverture produit une erreur explicite.',
  'Heure · Paris':
    'Heure locale Europe/Paris. Les jours de changement d’heure ne sont pas pris en charge.',
  Moteur:
    'Le moteur GTFS utilise les horaires locaux. La marche est indisponible sans réseau piéton routable.',
  'Fichier à importer':
    'Sélectionnez un CSV, un GeoJSON WGS84 ou un ZIP GTFS compatible. Maximum 40 Mo et 500 000 horaires.',
  Producteur:
    'Organisme ayant produit les données. Cette information est conservée localement avec la source.',
  'Licence vérifiée sur la fiche officielle':
    'Indiquez la licence exacte de la ressource téléchargée, après lecture de la fiche officielle.',
  'URL de la fiche officielle':
    'Lien de provenance du jeu, consultable ensuite dans Sources. Aucun téléchargement automatique.',
  Attribution:
    'Texte de crédit demandé par la licence des données (producteur, auteur et date, si nécessaires).',
  'Version précédente':
    'Conservez tous les jeux ou sélectionnez celui à remplacer. La version précédente reste intacte si la validation échoue.',
  'Temps disponible':
    'Durée de déplacement en minutes. Le seuil par défaut sera repris à l’ouverture du calculateur.',
  'Activer le fond OpenStreetMap en ligne':
    'Le fond utilise Internet et transmet l’adresse IP et les demandes de tuiles au fournisseur ; il ne fonctionne pas hors ligne.',
  'Thème de l’interface':
    'Choisissez clair, sombre ou suivez les préférences de votre système. Ce choix reste sur cet appareil.',
};
/** Attach visible, keyboard/touch-accessible hints to existing fields without changing label names. */
export function FieldHelp() {
  const language = useLocale();

  const { pathname } = useLocation();
  const [targets, setTargets] = useState<{ node: HTMLLabelElement; text: string }[]>([]);
  useEffect(() => {
    const scan = () => {
      const labels = [...document.querySelectorAll<HTMLLabelElement>('#page-content label')];
      const next = labels.flatMap((node) => {
        const input = node.querySelector('input,select,textarea');
        if (!input) return [];
        const name = sourceLabel(
          input.getAttribute('aria-label') ||
            [...node.childNodes]
              .filter((n) => n.nodeType === Node.TEXT_NODE)
              .map((n) => n.textContent)
              .join('')
              .trim(),
        );
        input.setAttribute('aria-label', t(name));
        const text = tips[name] || (name.startsWith('Origine') ? tips['Origine 2'] : undefined);
        return text ? [{ node, text }] : [];
      });
      setTargets((previous) =>
        previous.length === next.length &&
        previous.every((p, i) => p.node === next[i].node && p.text === next[i].text)
          ? previous
          : next,
      );
    };
    scan();
    const root = document.getElementById('page-content');
    const observer = new MutationObserver(scan);
    if (root) observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [pathname, language]);
  return (
    <>
      {targets.map(({ node, text }, index) =>
        createPortal(<HelpTip text={text} />, node, `${pathname}-${index}`),
      )}
    </>
  );
}
