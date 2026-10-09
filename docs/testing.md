# Tests

`npm run test` : CSV, GeoJSON, identifiants textuels, validation GTFS, calendriers/exceptions, >24h, connexions consécutives, reconstruction de route, seuils, transferts explicites, interdictions simples de montée/descente, GeoJSON, stockage insuffisant, migration, intégration import→routage, persistance après réouverture Dexie, suppression/remplacement et rollback.

`npm run test:e2e` après build : shell, Service Worker, manifeste, import, calcul local, favoris, rechargement hors ligne et état sans données. Installer Chromium via Playwright. Les gestes d’installation Android/iOS, fermeture complète du navigateur, mise à jour à partir d’une version antérieure déployée et éviction réelle exigent une recette manuelle ; ne pas confondre rechargement et redémarrage du système.

GitHub Actions : npm ci, lint, typecheck, test, build puis Playwright Chromium. Fixtures synthétiques uniquement. Les validations exécutées et limitations de l’environnement sont consignées dans validation.md.
