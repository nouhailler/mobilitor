# Architecture

React et React Router (routes hash, hébergement statique sans réécriture). Leaflet/React-Leaflet cartographient des couches locales ; Dexie est la source de vérité IndexedDB. Aucun API HTTP métier.

Les services indépendants exposent recherche et proximité des stations, lignes, géométries, limites, sources, stockage, import, routage, isochrones, comparaison et export GeoJSON. Import et calcul démarrent des Workers distincts ; chacun lit ou écrit IndexedDB, évitant d’envoyer le flux complet depuis le fil principal. Annuler termine le Worker. L’écriture est une seule transaction avec lots de 2 000 objets.

Le graphe est construit depuis les arrêts consécutifs des courses ; CSA tient compte des horaires, jamais de coûts fixes inventés. Le réseau piéton n’est pas implémenté. Turf produit les symboles GeoJSON.

Versions demandées : React 19, TypeScript 5.9, Vite 6, Router 7, Leaflet 1.9, React-Leaflet 5, Dexie 4, Turf 7, Vite PWA 1, Vitest 3, Playwright 1. Les versions exactes résolues sont figées dans package-lock.json. Node 22 est utilisé pour la validation. TanStack Query et OPFS ne sont pas nécessaires à cette première version.
