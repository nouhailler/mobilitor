# Tests

`npm run test` : CSV, GeoJSON, identifiants textuels, validation GTFS, calendriers/exceptions, >24h, connexions consécutives, reconstruction de route, seuils, transferts explicites, interdictions simples de montée/descente, GeoJSON, stockage insuffisant, migration, intégration import→routage, persistance après réouverture Dexie, suppression/remplacement et rollback.

`npm run test:e2e` après build : shell, Service Worker, manifeste, import, calcul local, favoris, rechargement hors ligne et état sans données. Installer Chromium via Playwright. Les gestes d’installation Android/iOS, fermeture complète du navigateur, mise à jour à partir d’une version antérieure déployée et éviction réelle exigent une recette manuelle ; ne pas confondre rechargement et redémarrage du système.

GitHub Actions : npm ci, lint, typecheck, test, build puis Playwright Chromium. Fixtures synthétiques uniquement. Les validations exécutées et limitations de l’environnement sont consignées dans validation.md.

## Version 0.2.0 — 16 octobre 2026

Les unités du gestionnaire couvrent : date de contrôle réussie persistée, conservation des favoris, erreur réseau sans écrasement de la dernière réussite, hors ligne sans requête, contrôle périodique à 30 minutes, refus de forcer pendant une opération et repli sans Web Locks.

Les parcours navigateur couvrent désormais aussi : onboarding légal versionné et case de lecture, menu catégorisé, guide par écran, thème sombre conservé après rechargement, infobulles et touche Échap, écran système, installation guidée ou prompt simulé puis `appinstalled`.

Deux tests servent le build sur une origine temporaire et modifient réellement le contenu de `sw.js` : vérification périodique et activation automatiques, puis activation forcée bloquée par un verrou partagé d’un autre onglet. Les deux vérifient qu’un favori synthétique reste présent après rechargement. L’horloge de page est avancée dans le test périodique ; le Service Worker et IndexedDB sont réels dans Chromium. La simulation du prompt ne valide pas l’installation par le système d’exploitation.
