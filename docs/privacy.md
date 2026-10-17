# Confidentialité

Sans compte, télémétrie, API d’itinéraires ou synchronisation. Les favoris et scénarios restent dans IndexedDB. La géolocalisation n’est appelée qu’au clic volontaire et n’est pas persistée automatiquement.

Le fond OSM facultatif transmet IP et coordonnées des tuiles demandées ; aucun favori n’est transmis. Les liens de sources ouvrent des sites tiers. L’hébergement statique peut journaliser les téléchargements du shell et l’IP. Le navigateur contrôle quota, persistance et permission de position. Une autre personne utilisant le même profil navigateur peut consulter les données locales.

Effacement global dans Paramètres : tables IndexedDB et caches de l’origine. Aucun nettoyage silencieux des données utilisateur.

## Prise en main et responsabilité — 0.2.0

L’avis commun à l’onboarding et à À propos précise que l’éditeur n’est pas le producteur des données tierces, n’en garantit pas l’exactitude, l’actualité ou la disponibilité, et limite sa responsabilité dans la mesure autorisée par la loi applicable, sans exclure les responsabilités impératives. Cet avis ne garantit pas une exonération juridique. Le dépôt identifie le projet et son contact via les issues ; les coordonnées légales complètes de l’éditeur et de l’hébergeur sont à préciser avant diffusion publique.

Seule la version de l’avis lu est enregistrée localement (`onboarding.legal`), ainsi que les guides masqués et le thème. Aucune transmission de cette lecture. Les vérifications de mises à jour sollicitent l’hébergeur du shell, qui peut journaliser ces requêtes ; elles ne synchronisent pas les favoris, scénarios ou flux GTFS.
