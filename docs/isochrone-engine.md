# Isochrones

Un scan horaire calcule les arrivées à chaque arrêt, puis les seuils 15/30/45/60 minutes filtrent ces résultats. La comparaison réutilise exactement date, heure, flux et seuils pour deux ou trois origines. Les résultats incluent méthode, version importée, flux, date et heure.

Visualisation Turf : disques de 80 m, 12 segments, autour des seuls arrêts atteignables, limités à 2 000 symboles par origine pour garder une carte réactive. Les statistiques et l’export ne sont pas tronqués. Ces disques sont des symboles ; ni accès piéton, ni obstacles, ni surface continue ne sont calculés. Aucune enveloppe convexe n’est annoncée accessible. GeoJSON exporte les points du seuil sélectionné avec temps d’arrivée relatif ; PNG exporte les couches locales sans fond externe.

Marche désactivée tant qu’un vrai réseau piéton routable n’est pas implémenté. Importer un GeoJSON de rues permet seulement de l’afficher ; cela n’active pas un moteur piéton.
