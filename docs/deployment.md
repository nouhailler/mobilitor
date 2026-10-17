# Déploiement statique

`npm ci && npm run build`, puis héberger le contenu de dist sur HTTPS. Aucun serveur API. Routes hash : aucune réécriture spécifique nécessaire. Déployer à la racine de l’origine dans cette configuration ; pour un sous-chemin modifier ensemble base Vite, manifeste, URLs d’icônes et portée PWA.

Servir index.html et le Service Worker avec revalidation plutôt qu’un cache permanent. Assets hachés peuvent être immutables. Manifest et icônes doivent rester accessibles. Chaque origine a son propre stockage ; changer domaine ou protocole ne transporte pas les données. Pas de Docker nécessaire.

## Version 0.2 et actualisations

Mettre à jour ensemble `package.json`, le lockfile et `src/release.ts` pour chaque version publiée. Vite génère un identifiant de build, configurable par `MOBILITOR_BUILD_ID`. Déployer atomiquement le nouveau `dist/` complet ; conserver si possible les anciens assets hachés pendant la transition des clients. Servir `sw.js` et `index.html` avec revalidation, pas de cache HTTP permanent. Ne pas ajouter de second script d’enregistrement Service Worker : il est géré par `src/services/updateService.ts`.

L’actualisation en arrière-plan concerne une application déjà chargée en 0.2. Les clients 0.1 doivent d’abord charger ce mécanisme depuis leur bannière ou après fermeture/réouverture. L’installation mobile/desktop reste un geste explicite de l’utilisateur.
