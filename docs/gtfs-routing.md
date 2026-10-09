# Routage GTFS

Le moteur prépare les connexions des courses actives du jour précédent, courant et suivant, puis les trie par départ. Chaque connexion joint deux arrêts consécutifs avec les heures réelles du fichier. Le scan conserve les arrivées les plus précoces et un chaînage de segments pour reconstruire le trajet. Les états embarqués permettent de rester dans un véhicule aux arrêts sans montée ou descente. La durée inclut l’attente initiale et les correspondances ; l’interface affiche heures et segments.

Calendrier hebdomadaire et calendar_dates (ajout/retrait) ; heures au-delà de 24 h jusqu’à 47:59:59. Horizon maximal 60 minutes. Le fuseau accepté est Europe/Paris. Le modèle de secondes de journée n’est pas adapté aux transitions DST : leurs jours sont refusés. Dates hors bornes de service refusées ; dans la période sans course ce jour-là, seul l’arrêt d’origine peut être atteint.

Transferts inter-arrêts seulement depuis transfers.txt, avec min_transfer_time explicite et types 0/2 ; type 3 interdit. Même arrêt : min_transfer_time type 2, sinon correspondance sans durée supplémentaire (horaire disponible seulement). Pas de relation par proximité, pas de transfert station parente implicite. Les règles spécifiques ligne/course et type 1 sont refusées. Correspondances type 3 sur le même arrêt nécessitent un profil plus riche et doivent être exclues du flux utilisé.

Non pris en charge : fréquences, pathways, transport à la demande, temps réel, tarifs, accessibilité, optimisation de nombre de correspondances, géométrie de trajet ou multi-flux. La route n’est pas un trajet routier ou piéton ; les segments affichés suivent les arrêts. Attention : un sous-réseau peut supprimer des itinéraires valides du réseau complet.
