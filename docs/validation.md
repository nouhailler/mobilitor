# Validation exécutée — 9 octobre 2026

Environnement : Node 22.23.3, npm 10.9.9, Chromium Playwright sur Linux.

- `npm run lint` : passe.
- `npm run typecheck` : passe.
- `npm run test` : 30 tests passent, 5 fichiers. Migrations, imports CSV/GeoJSON/GTFS, validation et erreurs, références textuelles, calendriers et exceptions, heures >24 h, graphe, routage, attente et transferts, seuils, export GeoJSON, estimation de quota, persistance Dexie, suppression/remplacement et rollback.
- `npm run build` : passe. Build statique et Service Worker Workbox générés ; shell précaché d’environ 880 Kio, incluant les Workers. Le ZIP GTFS n’est pas dans le cache du Service Worker.
- `npm run test:e2e` : 4 parcours Chromium passent : import/calcul/favori/réouverture offline, état sans données, itinéraire/comparaison/exports/scénario/suppression, affichage mobile sans débordement horizontal. Un défaut intermittent de focus et une course de navigation du test ont été corrigés ; le parcours comparaison/export passe également trois fois consécutivement.
- Captures desktop 1440×900 et mobile 390×844 inspectées visuellement.
- Script de prévalidation exécuté sur la fixture GTFS synthétique. Aucun téléchargement de données officielles, ni téléversement, ni déploiement distant.

À vérifier sur appareils : dialogue d’installation Android/iOS, fermeture complète du navigateur, éviction réelle, quotas variables, mise à jour entre deux versions effectivement hébergées et import d’un sous-réseau IDFM réel. Les tests de manifeste et Service Worker ne remplacent pas ces essais. La couverture exhaustive du réseau francilien, la marche et les fonctionnalités GTFS explicitement refusées ne sont pas revendiquées.

# Validation de la version 0.2.0 — 16 octobre 2026

- `npm run lint` : passe.
- `npm run typecheck` : passe.
- `npm run test` : **37 tests**, 6 fichiers, passent (les 30 précédents et 7 tests de mises à jour).
- `npm run build` : passe, Service Worker généré sans second script d’enregistrement ; environ 908 Kio précachés, Workers compris.
- `npm run test:e2e` : **9 parcours Chromium** passent : les 4 parcours de transport existants, 3 parcours onboarding/menu/aides/thème/installation et 2 transitions réelles de Service Worker.
- Le contrôle périodique simulé par avance d’horloge déclenche effectivement une nouvelle recherche et une activation automatique. Le verrou partagé d’un autre onglet bloque l’activation forcée jusqu’à sa libération. Un favori synthétique est conservé dans les deux cas.
- Le premier démarrage n’entraîne aucun rechargement de mise à jour interrompant l’onboarding. Le prompt d’installation est testé avec un événement simulé ; l’absence de prompt produit un guide.
- Captures de la carte, du thème sombre, du menu, de l’onboarding légal et du système ajoutées à `docs/assets/` et contrôlées visuellement.

Les limites manuelles indiquées au rapport initial restent applicables : vrais gestes d’installation Android/iOS, suspension/éviction par l’OS, essai d’un sous-réseau IDFM réel et transition d’un client 0.1 effectivement déployé vers 0.2. Aucun déploiement distant n’a été effectué. Les coordonnées légales complètes de l’éditeur et de l’hébergeur restent à renseigner pour une diffusion publique.

# Validation de la version 0.3.0 — 27 octobre 2026

- `npm run lint`, `npm run typecheck` et `npm run build` : passent. Le build inclut les deux manifestes et le catalogue anglais, avec environ 957 Kio précachés.
- `npm run test` : **44 tests**, 7 fichiers, passent ; les 37 tests précédents et 7 tests de localisation.
- `npm run test:e2e` : **12 parcours Chromium** passent, incluant les 9 parcours français précédents et 3 parcours anglais.
- Vérifications anglaises : choix dès le premier onboarding, avis légal traduit, menus et écrans, thème et paramètres, infobulles, messages de mise à jour, dates anglaises, installation guidée, mobile sans débordement.
- Import de la fixture GTFS synthétique en anglais ; erreur de date hors période, puis trajet de 25 minutes ; résultat conservé lors de la bascule français/anglais ; recalcul hors ligne après rechargement. Les noms Test Alpha/Test Charlie et les identifiants sont conservés.
- Préférence de langue et `html.lang` restaurés ; manifeste anglais accessible hors ligne. Capture réelle ajoutée dans `docs/assets/mobilitor-english.png`.

Les dialogues du système et les tuiles OpenStreetMap conservent les règles et langues de leurs fournisseurs. Les réserves des rapports précédents sur les appareils réels, les coordonnées légales et les flux IDFM restent applicables. Aucune publication ni push distant n’a été effectué dans cette livraison.

# Validation de la version 0.4.0 — 27 octobre 2026

- `npm run lint`, `npm run typecheck`, `npm run build` : passent.
- `npm run test` : **44 tests** passent, moteur et localisation inchangés.
- `npm run test:e2e` : **15 parcours Chromium** passent, dont 3 pour la présentation bilingue : FAQ, absence d’onboarding à l’arrivée, mentions légales, langues, entrée dans l’application, conservation du thème et installation guidée.
- Mobile 390×844 : absence de débordement horizontal et langue conservée après rechargement. Captures bureau 1440×1000, français, anglais et mobile inspectées.
- Captures JPEG réelles de l’app, environ 676 Kio au total. Build précaché d’environ 1,7 Mio incluant les deux langues et images ; aucun jeu de transport ajouté.
- Les routes historiques de l’app restent en place. Landing aux routes hash `/presentation/fr`, `/presentation/en` et `/presentation` ; pas de backend, de publication distante ou de push dans cette livraison.
