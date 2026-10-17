# 🧭 Contexte du projet — Mobilitor

> Dernière mise à jour documentaire : **16 octobre 2026**. Version applicative : **0.2.0** (`package.json` et `src/release.ts`).

## Mission

Mobilitor est une PWA française de cartographie et de mobilité. La carte s’ouvre sur la France métropolitaine, Corse comprise, avec OpenStreetMap en ligne activé par défaut. Le routage vise les flux GTFS compatibles importés pour l’Île-de-France ; aucune couverture nationale ou régionale exhaustive n’est préinstallée.

**Contraintes à conserver :** aucun backend obligatoire, compte, base distante, télémétrie ou synchronisation implicite. Les données utilisateur et les jeux importés restent sur l’appareil. La géolocalisation est facultative et déclenchée par l’utilisateur.

## État du dépôt

- Dépôt : [nouhailler/mobilitor](https://github.com/nouhailler/mobilitor), branche de travail `main`.
- `43f7685` : version initiale de la PWA, imports, calculs et tests.
- `e422f41` : carte de France et OpenStreetMap activé par défaut, préférences et documentation associées.
- Mise à jour documentaire du 16 octobre : README illustré, badges locaux, création de ce contexte et actualisation du changelog. La documentation précédente a été conservée et enrichie pour la version 0.2.0.
- Version 0.2.0 (16 octobre) : menu hamburger catégorisé, paramètres système, mises à jour automatiques protégées, installation guidée, thèmes et onboarding. Les modifications sont locales tant qu’un commit/push n’a pas été demandé pour cette livraison.

## Architecture réelle

| Responsabilité | Implémentation                                                                                                         |
| -------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Interface      | React 19, TypeScript 5.9, Vite 6, React Router 7 avec routes hash                                                      |
| Carte          | Leaflet 1.9 et React-Leaflet 5 ; vue France par défaut et disposition adaptée aux panneaux étroits                     |
| Persistance    | Dexie 4 / IndexedDB, base `mobilite-isochrones-db`, schéma versionné v2                                                |
| Import         | PapaParse, fflate, validation puis transaction IndexedDB par lots ; Worker dédié                                       |
| Routage        | Connection Scan Algorithm dans un Worker ; services indépendants des composants                                        |
| Géométrie      | Turf 7 ; arrêts atteignables et disques symboliques de 80 m                                                            |
| PWA            | vite-plugin-pwa / Workbox génère le shell ; enregistrement natif et orchestration dans `src/services/updateService.ts` |
| Vérification   | Vitest, React Testing Library, fake-indexeddb, Playwright et GitHub Actions                                            |

Les versions exactes sont verrouillées dans `package-lock.json`. Les tables réservées aux fréquences et au cache de calcul ne signifient pas que ces fonctions sont actives. Aucun réseau piéton routable n’est implémenté.

## Fonctionnalités disponibles

Menu hamburger (Se déplacer / Données et bibliothèque / Application), thèmes clair-sombre-système, onboarding légal versionné, guides contextuels et infobulles, bouton d’installation avec repli guidé, écran Système, carte, couches vectorielles importées, recherche locale, sélection d’arrêt, date et heure de Paris, itinéraires GTFS, seuils 15/30/45/60 minutes, comparaison de deux ou trois origines, favoris, scénarios réouvrables, exports GeoJSON/PNG, gestion des sources et du stockage, suppression explicite des données et demande de persistance.

Les imports acceptent CSV de stations, GeoJSON WGS84 et ZIP GTFS compatibles. Les identifiants externes restent textuels. Les calendriers, exceptions, services des jours adjacents et heures GTFS de 00 à 47 h sont interprétés. Les transferts reposent sur les règles explicites compatibles, jamais sur une proximité inventée.

## Limites à annoncer

- Fichier compressé ≤ **40 Mo**, taille ZIP décompressée déclarée ≤ **250 Mo**, maximum **500 000 horaires**. Prévoir environ **12× le poids compressé** libre ; ce n’est pas une garantie de consommation.
- Routage chargé en mémoire dans le Worker pour le seul flux sélectionné. Préparer les gros flux sur ordinateur avec les scripts facultatifs ; pas d’import régional complet en flux ni d’index binaire compact à ce stade.
- Fuseau **Europe/Paris**, horizon maximal **60 minutes** ; jours de changement d’heure refusés.
- Pas de marche, fréquences, pathways, temps réel, transport à la demande, optimisation multicritère, fusion de flux ou correspondances spécifiques/garanties non modélisées.
- Un clic sur la carte ou la géolocalisation exige ensuite de choisir un arrêt. Aucun accès à pied n’est calculé implicitement.
- Les disques d’isochrone sont des symboles, pas une preuve d’accessibilité de leur surface. Maximum 2 000 symboles par origine ; comptes et exports non tronqués.
- Carte bornée à 1 500 stations par emprise, 500 tracés et 200 limites ; recherche limitée à 40 réponses. Les shapes GTFS sont conservées mais pas tracées.
- Aucun téléchargement direct de flux ni fond hors ligne importable. OpenStreetMap nécessite Internet ; ne pas mettre ses tuiles dans un cache hors ligne ou les télécharger massivement.

## Cycle de mise à jour de l’application

- `src/release.ts` : version 0.2.0 et date de sortie 2026-10-16. `vite.config.ts` injecte un identifiant unique à chaque build (ou `MOBILITOR_BUILD_ID` fourni par l’environnement).
- `src/main.tsx` enregistre le Service Worker via le gestionnaire natif et capture `beforeinstallprompt` avant le montage React. Ne pas ajouter un second enregistrement automatique du plugin.
- Workbox : `skipWaiting: false`, `clientsClaim: true`, `injectRegister: null`. Le gestionnaire vérifie au démarrage, retour visible, retour réseau et toutes les 30 minutes ; les ressources sont précachées en arrière-plan.
- Une version téléchargée attend une pause de 15 secondes sans champ actif (ou une fenêtre masquée), puis l’activation obtient un verrou exclusif. Import et routage détiennent un verrou partagé via `activityService.ts`, y compris entre onglets.
- « Forcer » ne signifie ni effacer les caches ni supprimer des données ; il ne contourne pas les opérations actives. Sans Web Locks, activation au prochain lancement après fermeture de toutes les fenêtres. Aucune périodicité garantie lorsque le navigateur suspend l’application.
- Dernière vérification réussie dans `preferences`, clé `updates.lastChecked`. Les erreurs hors ligne ne la remplacent pas.
- Le premier chargement d’un Service Worker ne doit pas être confondu avec une mise à jour : aucun rechargement initial qui interromprait l’onboarding. Depuis 0.1, charger une première fois 0.2 via la bannière existante ou fermeture/réouverture.

## Prise en main et préférences

- Onboarding en trois étapes avec avis de responsabilité et lecture signalée ; seul l’identifiant de version de l’avis est mémorisé (`onboarding.legal`). Ce n’est ni un compte ni une garantie d’exonération juridique.
- Guides indépendants pour `/`, `/comparaison`, `/donnees`, `/sources`, `/parametres`, `/systeme`, `/a-propos`, mémorisés par `guide:<chemin>` ; réouvrables.
- Thème (`theme`) dans IndexedDB : `light`, `dark`, `system`. Le fond OSM reste inchangé. Les infobulles conservent des noms de champs stables pour le clavier et les lecteurs d’écran.
- Installation : prompt natif facultatif ; repli Safari/Android/ordinateur. Seul `appinstalled` ou le mode standalone confirme l’installation détectée par l’application.
- Avis légal dans `LegalNotice.tsx`, commun à l’onboarding et à À propos. Les coordonnées complètes d’éditeur/hébergeur restent à fournir avant diffusion publique ; aucune responsabilité impérative n’est écartée.

## Données et confidentialité

Les sources et licences sont documentées dans [docs/data-sources.md](docs/data-sources.md), avec une consultation des fiches officielles datée du 9 octobre 2026. Le producteur, la licence et l’attribution sont renseignés à l’import et conservés avec le checksum et les dates. Ne pas présenter cette provenance déclarative comme une certification automatique de licence.

La base démarre vide. `data/fixtures/synthetic-gtfs.zip` est uniquement un jeu synthétique : Test Alpha → Test Charlie, le 9 octobre 2026 à 08:00, arrivée attendue à 08:25. Aucun jeu officiel volumineux n’est versionné.

Le fond OSM transmet les demandes de tuiles et l’IP au fournisseur ; les favoris ne sont pas transmis. Les caches de l’application et IndexedDB sont distincts. La persistance peut être refusée et les données peuvent être évincées par le navigateur.

## Vérifications et reprise

Le [rapport du 9 octobre 2026](docs/validation.md) consigne 30 tests unitaires/intégration, 4 parcours Chromium, lint, TypeScript et build réussis. Ne pas interpréter cette date comme une nouvelle exécution quotidienne des tests. Le rapport est complété pour les contrôles de la version 0.2.0 : tests du gestionnaire, scénarios navigateur et vraie transition de Service Worker sans perte des favoris. Pour 0.2.0 : **37 tests et 9 parcours Chromium passent**, dont les transitions de Service Worker. Les horodatages des rapports ne sont pas la date de vérification affichée à l’utilisateur dans Système.

Les dialogues d’installation Android/iOS, la fermeture complète du navigateur, l’éviction réelle, les mises à jour entre deux versions hébergées et un sous-réseau IDFM réel restent à vérifier sur appareils et données représentatives.

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
npx playwright install chromium
npm run test:e2e
npm run preview
```

Node 22 et npm 10 ou plus. La PWA se teste avec le build et `preview` sur localhost, ou un hébergement HTTPS ; le Service Worker n’est pas activé en développement. Déploiement statique du contenu de `dist/` à la racine de l’origine.

## Capture et documentation

- Capture réelle : [docs/assets/mobilitor-france.png](docs/assets/mobilitor-france.png), réalisée le 16 octobre 2026, sans données de transport importées.
- Les badges SVG du README sont locaux et statiques : ils décrivent le projet, sans annoncer un état de CI en temps réel.
- Toute évolution doit maintenir les limites annoncées et les migrations sans perte de favoris. Ne pas simuler une capacité indisponible.
- Pour poursuivre : voir le [README](README.md), le [changelog](CHANGELOG.md) et les guides dans `docs/`.
