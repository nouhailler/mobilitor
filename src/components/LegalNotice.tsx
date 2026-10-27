import { t } from '../i18n';
import { useLocale } from '../i18n/useLocale';
export const LEGAL_VERSION = '2026-10-16';
export function LegalNotice() {
  useLocale();

  return (
    <div className="legal-notice">
      <h3>{t('Données tierces et responsabilité')}</h3>
      <p>
        {t(
          'Les données affichées sont fournies par des producteurs tiers ou importées par l’utilisateur. L’éditeur de Mobilitor n’est pas le producteur de ces données et ne garantit ni leur exactitude, ni leur exhaustivité, ni leur actualité ou leur disponibilité.',
        )}
      </p>
      <p>
        {t(
          'Dans les limites autorisées par la loi applicable, l’éditeur ne peut être tenu responsable des erreurs ou omissions des données fournies, ni des conséquences de leur utilisation. Cette mention n’exclut aucune responsabilité qui ne peut légalement être écartée.',
        )}
      </p>
      <p>
        {t(
          'Les horaires sont théoriques et les isochrones indicatives. Vérifiez vos déplacements auprès des opérateurs. Les symboles cartographiques ne garantissent pas l’accessibilité d’un lieu.',
        )}
      </p>
      <h3>{t('Confidentialité et licences')}</h3>
      <p>
        {t(
          'Les fichiers, favoris et scénarios sont conservés localement. Aucun compte ni télémétrie. Le fond OpenStreetMap en ligne transmet l’adresse IP et les demandes de tuiles à son fournisseur. La géolocalisation est facultative. Les licences et attributions des producteurs restent applicables.',
        )}
      </p>
      <p>
        <strong>{t('Projet et contact :')}</strong> {t('Mobilitor, dépôt')}{' '}
        <a href="https://github.com/nouhailler/mobilitor" target="_blank" rel="noreferrer">
          nouhailler/mobilitor
        </a>{' '}
        {t('; questions via les issues du dépôt. La version du présent avis est datée du')}{' '}
        {LEGAL_VERSION}
        {t(
          '. Les coordonnées légales de l’éditeur et de l’hébergeur devront être précisées pour chaque diffusion publique.',
        )}
      </p>
    </div>
  );
}
