# Déploiement statique

`npm ci && npm run build`, puis héberger le contenu de dist sur HTTPS. Aucun serveur API. Routes hash : aucune réécriture spécifique nécessaire. Déployer à la racine de l’origine dans cette configuration ; pour un sous-chemin modifier ensemble base Vite, manifeste, URLs d’icônes et portée PWA.

Servir index.html et le Service Worker avec revalidation plutôt qu’un cache permanent. Assets hachés peuvent être immutables. Manifest et icônes doivent rester accessibles. Chaque origine a son propre stockage ; changer domaine ou protocole ne transporte pas les données. Pas de Docker nécessaire.
