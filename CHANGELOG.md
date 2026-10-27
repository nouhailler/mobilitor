# 📝 Historique

Les changements documentaires non publiés sont séparés des versions applicatives. La version courante de `package.json` est **0.4.0**.

## 0.4.0 — 2026-10-27

### 🌿 Présentation bilingue

- Landing page autonome en français et en anglais : `/#/presentation/fr`, `/#/presentation/en` et route suivant la langue locale `/#/presentation`.
- Présentation des fonctions, captures réelles, prise en main en trois étapes, confidentialité, FAQ dépliable et liens d’ouverture/installation de l’application.
- Lien Présentation dans le menu et le pied de page ; route historique de l’application conservée.
- Langue partagée, thème clair propre à la présentation sans modifier la préférence de l’app, métadonnées adaptées et mise en page responsive.
- Captures JPEG allégées et précachées, attribution OSM conservée. Aucun chiffre d’usage ou témoignage fictif.
- Parcours navigateur ajoutés pour les langues, la FAQ, les mentions légales, l’accès à l’application, l’installation et le mobile.

## 0.3.0 — 2026-10-27

### 🌐 Interface anglaise

- Sélecteur français/anglais dans l’en-tête, l’onboarding et Paramètres ; français conservé par défaut.
- Langue persistée dans IndexedDB, entrée explicite `?lang=en`, changement sans rechargement ni perte des champs ou résultats en cours.
- Traduction des écrans, menus, onboarding légal, guides, infobulles, paramètres système, installation et messages connus d’import/routage/mise à jour.
- Dates adaptées à la langue, fuseau des départs Europe/Paris et données importées inchangés.
- Catalogue embarqué et manifeste PWA anglais précaché ; aucun service de traduction distant.
- Infobulles repositionnées au défilement pour rester lisibles avec les textes plus longs.
- Tests de persistance, parcours anglais et calcul hors ligne ; guide et capture anglais, README et CONTEXT actualisés.

## 0.2.0 — 2026-10-16

### ✨ Interface et prise en main

- Menu hamburger accessible par catégories : Se déplacer, Données et bibliothèque, Application.
- Thèmes clair, sombre et automatique selon le système, persistés dans IndexedDB ; raccourci dans l’en-tête.
- Onboarding initial en trois étapes avec provenance des données, confidentialité et avis de responsabilité dans les limites de la loi applicable ; possibilité de le revoir.
- Guide contextuel masquable/réouvrable pour chaque écran et infobulles accessibles au survol, au clic et au clavier.
- Bouton Installer dans l’en-tête, le menu et Système ; dialogue natif lorsqu’il est disponible, guide iOS/Android/ordinateur sinon.

### ↻ Système et mises à jour

- Nouvel écran Système : version, date de sortie, identifiant du build, dernière vérification réussie et dernière tentative.
- Boutons Vérifier les mises à jour et Forcer la mise à jour, sans suppression de données locales.
- Vérification automatique au démarrage, retour visible, retour réseau et toutes les 30 minutes pendant l’ouverture ; téléchargement en arrière-plan.
- Activation automatique pendant une pause, protégée par les verrous des imports et calculs entre onglets ; report au prochain lancement sans Web Locks.
- Premier démarrage du Service Worker distingué d’une mise à jour pour conserver l’onboarding. Le navigateur peut suspendre les contrôles lorsque l’application est fermée.
- Tests du gestionnaire et parcours navigateur ajoutés, dont transition réelle de Service Worker et conservation des favoris.

### 📚 Documentation

- README, CONTEXT, guides PWA/confidentialité/tests et captures actualisés.
- Version des données tierces et version de l’application explicitement distinguées ; mentions légales complètes à préciser selon l’éditeur et l’hébergement.

## Non publié — 2026-10-16

### 📚 Documentation

- README remanié avec logo, badges SVG locaux, navigation, tableaux et encadrés Markdown.
- Ajout d’une capture réelle de l’application montrant le fond OpenStreetMap de France, sans données de transport fictives.
- Création de `CONTEXT.md` : mission, architecture, état du dépôt, fonctions disponibles, limites, données et procédures de reprise.
- Clarification de la distinction entre couverture de la carte, données GTFS importées et fonctions réellement utilisables hors ligne.
- Actualisation de l’inventaire des fichiers ; les badges restent descriptifs et ne représentent pas un statut de CI.

## Évolution de la version 0.1.0 — 2026-10-09

### 🗺️ Cartographie

- Ouverture sur la France métropolitaine, Corse comprise, avec OpenStreetMap activé par défaut.
- Conservation de la possibilité de désactiver le fond en ligne dans Paramètres.
- Affichage de la carte au-dessus du calculateur sur les écrans et panneaux jusqu’à 900 px de large.
- Actualisation des indications de provenance et de fonctionnement hors ligne ; aucun cache applicatif de tuiles OSM.

## 0.1.0 — 2026-10-09

Première version locale : carte vectorielle, recherche, imports transactionnels CSV/GeoJSON/GTFS, CSA horaire, comparaison, exports, favoris, scénarios, gestion de stockage et PWA. Profil GTFS limité explicitement, pas de marche ni de flux régional complet chargé implicitement.
