# PWA

vite-plugin-pwa / Workbox génère un Service Worker versionné et le précache du shell, scripts, styles, icônes et manifeste. Le manifeste déclare nom, langue, portée, standalone et icônes PNG 192/512. Le Service Worker ne met pas les tuiles ou flux GTFS dans son cache. Les Workers de calcul et import font partie du build.

Mise à jour : bannière d’acceptation, pas de rechargement silencieux. IndexedDB reste séparé du cache. Android/ordinateur : menu d’installation du navigateur. iOS : Partager → Sur l’écran d’accueil. Les gestes d’installation natifs doivent être vérifiés manuellement sur appareils ; Playwright vérifie le manifeste et le Service Worker, pas le dialogue du système.

HTTPS en production, localhost en développement. Le Service Worker de développement n’est pas activé ; tester avec build/preview. L’état offlineReady concerne seulement le shell, pas les données.
