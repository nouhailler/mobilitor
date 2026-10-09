# Stockage local

Base `mobilite-isochrones-db`. v1 définit les tables ; v2 ajoute l’index composé source/course pour les horaires et marque les imports interrompus en échec. Les favoris sont préservés lors d’une migration et d’un remplacement de jeu. Tests fake-indexeddb couvrent migration, rollback, suppression et remplacement.

Tables : stations, lines, stationLineLinks, lineGeometries, administrativeAreas, dataSources, gtfsFeeds, gtfsStops, gtfsRoutes, gtfsTrips, gtfsStopTimes, gtfsCalendars (calendar + exceptions), gtfsTransfers, gtfsShapes, gtfsAgencies, gtfsFrequencies (réservé, non utilisé), savedPlaces, savedScenarios, preferences, cachedIsochrones (réservé, pas de cache de calcul actif), importJobs.

Index id/sourceId/externalId, latitude/longitude/name sur stations. Recherche bornée à 40 réponses, emprise bornée à 1 500. Les gros flux sont lus en mémoire dans le Worker lors d’un calcul, pas à chaque ouverture. Les grandes géométries ne disposent pas encore de niveaux de détail.

Aucun fichier volumineux dans localStorage. Les estimations navigateur couvrent l’origine entière. La demande persist() peut être refusée. La suppression d’un jeu garde les favoris ; leurs anciennes références de station peuvent devenir indisponibles, leurs coordonnées restent conservées. Effacement global supprime données et caches explicitement. Aucune éviction applicative silencieuse des favoris.
