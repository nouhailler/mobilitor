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
