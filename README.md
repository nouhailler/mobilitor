# Mobilité — Isochrones locales

PWA française React/TypeScript pour explorer les transports en Île-de-France. **Aucun backend, compte, PostgreSQL, PostGIS ou serveur de calcul.** IndexedDB conserve les données ; les Workers importent et calculent sur l’appareil. Le dépôt est volontairement livré sans données officielles.

## Démarrer

Node.js 22 et npm 10 ou plus.

```bash
npm install
npm run dev
npm run test
npm run lint
npm run typecheck
npm run build
npm run preview
npm run test:e2e
```

Pour Playwright : `npx playwright install chromium` (et `--with-deps` sur CI Linux). `dist/` contient les fichiers statiques. HTTPS est nécessaire à la PWA en production ; localhost convient aux tests.

## Importer et calculer

1. Ouvrir **Sources** et consulter la fiche officielle ainsi que la licence du fichier choisi.
2. Télécharger manuellement le fichier. Réduire un gros GTFS avec `scripts/prepare-data.py` si nécessaire.
3. Dans **Mes données**, choisir ZIP GTFS, GeoJSON WGS84 ou CSV `id,name,latitude,longitude`. Renseigner producteur, licence et attribution. Choisir conserver ou remplacer.
4. Attendre la validation. Les données restent disponibles après fermeture et réouverture.
5. Dans **Explorer**, choisir le flux et un arrêt d’origine, la date et l’heure de Paris. Calculer une isochrone ou un itinéraire vers un autre arrêt. La comparaison accepte deux ou trois origines du même flux.
6. Exporter les arrêts atteignables en GeoJSON ou la carte en PNG. L’export PNG exclut les tuiles externes.

Le fichier `data/fixtures/synthetic-gtfs.zip` est une **fixture synthétique de test, jamais une source officielle** : le 9 octobre 2026 à 08:00, de Test Alpha à Test Charlie, arrivée 08:25. Elle n’est jamais importée automatiquement.

## Profil de la première version

- Connection Scan Algorithm, horaires explicites, calendriers hebdomadaires, exceptions, services du jour précédent et suivant, heures GTFS 00–47 h, correspondances explicites avec durée, interdictions simples de montée/descente.
- Pas de temps réel, fréquences, pathways, transport à la demande, correspondances garanties ou spécifiques à une course/ligne, contraintes d’accessibilité, optimisation multi-critères ou fusion entre plusieurs flux. Ces capacités sont refusées ou déclarées indisponibles.
- Fuseau Europe/Paris uniquement ; jours de changement d’heure refusés. L’origine et la destination sont des arrêts : un clic ou la géolocalisation exige ensuite de choisir un arrêt, sans inventer un accès à pied.
- Marche désactivée : pas d’import de réseau piéton routable dans cette version.
- Isochrones : arrêts atteignables à 15/30/45/60 min et disques **symboliques** de 80 m, sans prétendre rendre accessible toute leur surface. Pas d’enveloppe convexe trompeuse.
- Limites : fichier compressé 40 Mo, décompressé 250 Mo, 500 000 horaires. Import en Worker, validation en mémoire puis écriture par lots transactionnelle. Routage charge uniquement le flux sélectionné en Worker, avec calcul annulable. Prévoir approximativement **12 fois la taille compressée** libre ; dépend fortement du contenu. Les imports volumineux régionaux complets nécessitent une préparation, pas seulement une augmentation de quota.
- Carte : 1 500 stations maximum dans l’emprise, 500 tracés, 200 limites et 2 000 symboles d’isochrone par origine maximum. Les comptes et exports ne sont pas tronqués. Les shapes GTFS sont conservées pour provenance mais ne sont pas tracées ; importer les tracés en GeoJSON. Recherche locale limitée à 40 résultats.
- Scénarios enregistrés consultables, réouvrables et supprimables. Fond de carte et seuil par défaut persistés ; un seul moteur disponible.
- Téléchargement direct et import de fond hors ligne non implémentés. Import manuel sans proxy ; fond OSM en ligne facultatif, sans cache applicatif.

## Disposer des transports hors ligne

Construire, héberger sous HTTPS, ouvrir en ligne jusqu’au cache du Service Worker, puis installer depuis le navigateur. Télécharger et importer un GTFS valide pour les lignes nécessaires, ainsi que les stations, tracés et limites souhaités. Vérifier la validité du flux, le stockage et demander la persistance. Tester en mode avion. Les couches vectorielles importées et les calculs restent utilisables ; le fond OSM ne l’est pas. Pour une couverture régionale exhaustive, cette première version doit encore évoluer vers des index binaires et un import en flux : ne pas présenter un sous-réseau comme une couverture complète.

## Structure et documentation

- `src/db` : schéma versionné, migrations et opérations transactionnelles.
- `src/imports` : CSV, GeoJSON, ZIP GTFS, validation et provenance.
- `src/routing`, `src/workers`, `src/services` : moteur horaire, géométrie et API interne.
- `src/components`, `src/pages`, `src/styles` : carte, recherche, comparaison, données, paramètres et sources.
- `public` : manifeste, icônes et ressources PWA.
- `tests` : unités, intégration IndexedDB et parcours navigateur hors ligne.
- `scripts`, `data/fixtures`, `.github/workflows` : préparation facultative, fixtures et CI.
- [Architecture](docs/architecture.md), [imports](docs/data-import.md), [sources](docs/data-sources.md), [routage](docs/gtfs-routing.md), [tests](docs/testing.md), [déploiement](docs/deployment.md).

Voir `docs/file-inventory.md` pour la liste des fichiers créés. Licence du code MIT ; licences des données séparées.
