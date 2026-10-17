# PWA et mises à jour — version 0.2.0

vite-plugin-pwa / Workbox construit le précache du shell (scripts, styles, icônes et manifeste, Workers compris). Les GTFS et données utilisateur restent dans IndexedDB. Les tuiles OSM ne sont pas précachées.

## Installation guidée

Le bouton **Installer l’application** est présent dans l’en-tête, le menu et Système. Il appelle `beforeinstallprompt.prompt()` seulement après le clic si le navigateur a fourni cet événement. À défaut : instructions Safari → Partager → Sur l’écran d’accueil sur iOS, menus d’installation Android et Chrome/Edge sur ordinateur. L’absence de cet événement ne signifie pas que l’application est installée. L’état installé est détecté via `appinstalled` ou le mode standalone ; le dialogue du système reste sous contrôle du navigateur.

HTTPS en production, localhost pour les tests. Le manifeste déclare nom, langue, portée, standalone et icônes 192/512. En développement le Service Worker reste désactivé ; utiliser build/preview.

## Mise à jour automatique

Un seul gestionnaire natif enregistre `sw.js` avec `updateViaCache: 'none'`. Le plugin ne doit pas injecter un autre script d’enregistrement (`injectRegister: null`). `skipWaiting` reste faux afin de coordonner l’activation et `clientsClaim` vrai pour contrôler le shell après activation.

Le contrôle intervient au démarrage, au retour visible, au retour de la connexion et toutes les 30 minutes. Une vérification réussie enregistre une date ISO dans IndexedDB ; un échec ne remplace pas la dernière réussite. La version et la date de sortie sont centralisées dans `src/release.ts`, l’identifiant du build est injecté par Vite à chaque construction. Le statut ne certifie pas la validité des horaires importés.

Une nouvelle version est téléchargée et installée dans le précache en arrière-plan. Son activation attend une pause de 15 secondes sans saisie active, ou une fenêtre masquée, puis un verrou exclusif Web Locks. Imports et calculs détiennent des verrous partagés ; les opérations actives des autres onglets empêchent l’activation. Après prise de contrôle, rechargement du shell, sans effacement IndexedDB. Le premier contrôle d’une installation neuve ne déclenche pas ce rechargement de mise à jour.

**Forcer** déclenche une recherche et demande l’activation d’une version disponible, sans contourner les opérations ni effacer les données. Si aucun nouveau Service Worker n’est détecté, le résultat l’indique ; aucune nouvelle version n’est simulée. Sans Web Locks, le téléchargement reste automatique mais il faut fermer toutes les fenêtres puis rouvrir l’application pour l’activation sûre. Les formulaires non soumis ne constituent pas une sauvegarde : ne pas laisser un brouillon comme seul exemplaire d’une information importante.

Une PWA fermée ou masquée peut être suspendue par le navigateur : aucun contrôle à intervalle garanti dans cet état, aucun serveur de planification ajouté. La mise à jour des jeux de transport reste manuelle. Depuis 0.1, utiliser une première fois l’ancienne bannière ou fermer/réouvrir toutes les fenêtres pour charger le nouveau mécanisme.

## Vérification et sources techniques

Les tests navigateur servent le build avec deux contenus successifs de `sw.js` pour vérifier la détection, l’activation automatique/forcée, le report inter-onglets et la conservation d’un favori synthétique. Ce serveur est une fixture de test, pas un backend de l’application. Gestes d’installation Android/iOS et suspension du système restent à tester sur appareils.

Références consultées le 16 octobre 2026 : [MDN — BeforeInstallPromptEvent](https://developer.mozilla.org/en-US/docs/Web/API/BeforeInstallPromptEvent), [MDN — ServiceWorkerRegistration.update](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/update). Les API et leur disponibilité restent sous le contrôle des navigateurs.
