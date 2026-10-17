export const LEGAL_VERSION = '2026-10-16';
export function LegalNotice() {
  return (
    <div className="legal-notice">
      <h3>Données tierces et responsabilité</h3>
      <p>
        Les données affichées sont fournies par des producteurs tiers ou importées par
        l’utilisateur. L’éditeur de Mobilitor n’est pas le producteur de ces données et ne garantit
        ni leur exactitude, ni leur exhaustivité, ni leur actualité ou leur disponibilité.
      </p>
      <p>
        Dans les limites autorisées par la loi applicable, l’éditeur ne peut être tenu responsable
        des erreurs ou omissions des données fournies, ni des conséquences de leur utilisation.
        Cette mention n’exclut aucune responsabilité qui ne peut légalement être écartée.
      </p>
      <p>
        Les horaires sont théoriques et les isochrones indicatives. Vérifiez vos déplacements auprès
        des opérateurs. Les symboles cartographiques ne garantissent pas l’accessibilité d’un lieu.
      </p>
      <h3>Confidentialité et licences</h3>
      <p>
        Les fichiers, favoris et scénarios sont conservés localement. Aucun compte ni télémétrie. Le
        fond OpenStreetMap en ligne transmet l’adresse IP et les demandes de tuiles à son
        fournisseur. La géolocalisation est facultative. Les licences et attributions des
        producteurs restent applicables.
      </p>
      <p>
        <strong>Projet et contact :</strong> Mobilitor, dépôt{' '}
        <a href="https://github.com/nouhailler/mobilitor" target="_blank" rel="noreferrer">
          nouhailler/mobilitor
        </a>{' '}
        ; questions via les issues du dépôt. La version du présent avis est datée du {LEGAL_VERSION}
        . Les coordonnées légales de l’éditeur et de l’hébergeur devront être précisées pour chaque
        diffusion publique.
      </p>
    </div>
  );
}
