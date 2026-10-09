# Préparation facultative
Python 3, bibliothèque standard uniquement. Aucun serveur. Aucun téléchargement automatique.

Télécharger manuellement le GTFS officiel après lecture de la licence, puis sélectionner des identifiants de lignes exacts :

```bash
python3 scripts/prepare-data.py offre.zip sous-reseau.zip --routes 'ID:ligne1,ID:ligne2' --license 'Licence vérifiée' --source-url 'URL officielle de la ressource'
python3 scripts/validate-data.py sous-reseau.zip
```

Le ZIP de sortie est importable dans la PWA ; le JSON adjacent conserve la provenance pour renseigner l’interface. Le script garde les calendriers, stations parentes et correspondances internes aux arrêts sélectionnés. Le sous-réseau peut perdre des correspondances vers les lignes exclues. Il refuse les lignes à fréquences et les pathways, plutôt que d’inventer une conversion. Mémoire : lecture complète du flux sur ordinateur. Le contrôle de licence est une déclaration humaine, pas une vérification juridique automatisée. Les champs facultatifs non interprétés sont conservés dans les fichiers supportés.
