export const landingContent = {
  fr: {
    tagline: 'LA MOBILITÉ, À VOTRE ÉCHELLE',
    nav: ['Fonctionnalités', 'Comment ça marche', 'Questions fréquentes'],
    open: 'Ouvrir l’application',
    skip: 'Aller au contenu',
    eyebrow: 'UNE AUTRE FAÇON D’EXPLORER',
    title: 'Vos prochains trajets.\nVos propres horizons.',
    intro:
      'Explorez la carte de France, découvrez les arrêts accessibles et comparez vos points de départ en Île-de-France. Avec vos données, sur votre appareil.',
    heroAction: 'Explorer mes possibilités',
    howAction: 'Découvrir le fonctionnement',
    trust: ['Sans compte', 'Calculs sur votre appareil', 'Français & English'],
    preview: 'L’application, tout simplement',
    previewCaption: 'Capture réelle · carte de France · aucun horaire préinstallé',
    previewAlt: 'Interface française de Mobilitor : carte de France et calculateur d’isochrones',
    strip: ['Une carte pour prendre du recul.', 'Des horaires pour passer à l’action.'],
    featuresEyebrow: 'POUR MIEUX CHOISIR VOS DÉPLACEMENTS',
    featuresTitle: 'Plus de perspective.\nMoins d’incertitude.',
    featuresIntro:
      'Un point de départ, une heure, un temps disponible. Mobilitor transforme vos horaires importés en une lecture plus claire de vos possibilités.',
    features: [
      {
        title: 'Jusqu’où pouvez-vous aller ?',
        text: 'Repérez les arrêts atteignables en 15, 30, 45 ou 60 minutes. Les temps sont calculés à partir des horaires GTFS que vous importez.',
        caption: 'Des arrêts atteignables. Pas une promesse d’accès à toute une surface.',
      },
      {
        title: 'Un trajet qui tient compte de l’heure.',
        text: 'Choisissez votre départ et votre destination. Consultez les étapes, l’attente et les correspondances prises en charge par le moteur local.',
      },
      {
        title: 'Plusieurs départs. Une même lecture.',
        text: 'Comparez deux ou trois origines avec les mêmes horaires et le même seuil. Enregistrez un scénario pour le retrouver plus tard.',
      },
    ],
    tools: ['Favoris et scénarios locaux', 'Exports GeoJSON et PNG', 'Interface claire ou sombre'],
    stepsEyebrow: 'VOTRE CARTE COMMENCE ICI',
    stepsTitle: 'Trois étapes.\nEt un territoire à explorer.',
    stepsIntro:
      'Pas d’inscription, pas de configuration serveur. L’application démarre avec une carte ; vous choisissez ensuite les données à installer.',
    steps: [
      {
        title: 'Installez vos données.',
        text: 'Téléchargez un jeu compatible depuis sa source officielle, vérifiez sa licence, puis importez votre ZIP GTFS, CSV ou GeoJSON.',
      },
      {
        title: 'Choisissez votre départ.',
        text: 'Recherchez un arrêt, indiquez une date et une heure de Paris. Sélectionnez votre destination ou votre temps disponible.',
      },
      {
        title: 'Explorez et gardez ce qui compte.',
        text: 'Calculez, comparez et exportez vos résultats. Retrouvez vos lieux et vos scénarios sur ce même appareil.',
      },
    ],
    privacyEyebrow: 'LOCAL PAR CONCEPTION',
    privacyTitle: 'Votre mobilité\nvous appartient.',
    privacyText:
      'Les données importées, vos favoris et vos scénarios restent dans le navigateur. Les itinéraires sont calculés sur votre appareil, sans compte et sans serveur de calcul.',
    privacyNote:
      'En ligne, le fond OpenStreetMap transmet l’IP et les demandes de tuiles à son fournisseur. L’hébergeur reçoit aussi les requêtes de l’application et de ses mises à jour. Aucune télémétrie n’est ajoutée.',
    privacyItems: [
      'Vos fichiers, sur votre appareil',
      'Aucune synchronisation implicite',
      'Géolocalisation facultative',
      'Un code ouvert, sous licence MIT',
    ],
    faqEyebrow: 'AVANT DE PRENDRE LA ROUTE',
    faqTitle: 'Les bonnes questions.',
    faqs: [
      {
        q: 'Est-ce que Mobilitor fonctionne hors ligne ?',
        a: 'Oui pour l’interface et les fonctions locales, après mise en cache de l’application et import des données nécessaires. Le fond OpenStreetMap en ligne n’est pas disponible hors connexion ; vos couches vectorielles importées restent visibles.',
      },
      {
        q: 'Les données de transport sont-elles déjà installées ?',
        a: 'Non. Vous choisissez vos sources et importez vos propres fichiers compatibles. La carte couvre la France ; le moteur vise les flux GTFS importés pour l’Île-de-France. Aucun jeu régional ou national exhaustif n’est préinstallé.',
      },
      {
        q: 'Quelles sont les limites des calculs ?',
        a: 'Le moteur utilise des horaires théoriques explicites. La marche, le temps réel, les fréquences GTFS et les jours de changement d’heure ne sont pas pris en charge. Les disques d’isochrone sont des symboles autour des arrêts atteignables. Les gros flux doivent être préparés en sous-réseaux : 40 Mo compressés et 500 000 horaires au maximum.',
      },
      {
        q: 'Puis-je l’ajouter à mon téléphone ou à mon ordinateur ?',
        a: 'Oui, Mobilitor est une PWA. Le bouton d’installation ouvre le dialogue du navigateur quand il existe, ou un guide pour Android, iPhone/iPad et ordinateur. Sur iOS, l’ajout à l’écran d’accueil passe par le menu Partager de Safari.',
      },
      {
        q: 'Puis-je utiliser l’application en anglais ?',
        a: 'Oui. La présentation et l’application proposent le français et l’anglais. Votre choix reste enregistré sur l’appareil, sans changer les noms des stations ni les données importées.',
      },
    ],
    finalEyebrow: 'FAITES PLACE À VOS POSSIBLES',
    finalTitle: 'Votre territoire vous attend.',
    finalText: 'Ouvrez la carte. Installez vos données.\nEt regardez vos déplacements autrement.',
    legal: 'Mentions légales & confidentialité',
    code: 'Voir le code source',
    footer: 'Calculé ici. Conservé ici.',
    footerNote: 'Un outil indépendant. Données tierces, horaires théoriques.',
    legalTitle: 'Informations légales et confidentialité',
  },
  en: {
    tagline: 'MOBILITY, ON YOUR TERMS',
    nav: ['Features', 'How it works', 'Questions'],
    open: 'Open the app',
    skip: 'Skip to content',
    eyebrow: 'A DIFFERENT WAY TO EXPLORE',
    title: 'Your next journeys.\nYour own horizons.',
    intro:
      'Explore the map of France, discover reachable stops and compare origins in Île-de-France. With your data, on your device.',
    heroAction: 'Explore my possibilities',
    howAction: 'See how it works',
    trust: ['No account', 'On-device calculations', 'Français & English'],
    preview: 'A closer look at the app',
    previewCaption: 'Actual app screenshot · map of France · no preinstalled timetables',
    previewAlt: 'Mobilitor in English: map of France and local isochrone calculator',
    strip: ['A map to see the bigger picture.', 'Timetables to take the next step.'],
    featuresEyebrow: 'A CLEARER VIEW OF YOUR JOURNEYS',
    featuresTitle: 'More perspective.\nLess guesswork.',
    featuresIntro:
      'An origin, a departure time, a time limit. Mobilitor turns your imported timetables into a clearer picture of your options.',
    features: [
      {
        title: 'How far could you go?',
        text: 'Find stops reachable in 15, 30, 45 or 60 minutes. Travel times are calculated from the GTFS timetables you import.',
        caption: 'Reachable stops, not a promise of access to an entire area.',
      },
      {
        title: 'A journey that knows the time.',
        text: 'Choose an origin and destination. View journey legs, waiting times and the transfers supported by the local engine.',
      },
      {
        title: 'Several origins. One shared view.',
        text: 'Compare two or three origins with the same departure time and time limit. Save a scenario to revisit it later.',
      },
    ],
    tools: [
      'Local saved places and scenarios',
      'GeoJSON and PNG exports',
      'Light and dark interface',
    ],
    stepsEyebrow: 'YOUR MAP STARTS HERE',
    stepsTitle: 'Three steps.\nA whole area to explore.',
    stepsIntro:
      'No sign-up, no server to configure. Start with a map, then choose the data you want to install.',
    steps: [
      {
        title: 'Bring your data.',
        text: 'Download a compatible dataset from its official source, check its licence, then import your GTFS ZIP, CSV or GeoJSON.',
      },
      {
        title: 'Choose your departure.',
        text: 'Search for a stop and select a date and Paris departure time. Choose a destination or a time limit.',
      },
      {
        title: 'Explore and keep what matters.',
        text: 'Calculate, compare and export your results. Find your saved places and scenarios on the same device.',
      },
    ],
    privacyEyebrow: 'LOCAL BY DESIGN',
    privacyTitle: 'Your mobility.\nYour business.',
    privacyText:
      'Imported data, saved places and scenarios stay in your browser. Journeys are calculated on your device, without an account or a routing server.',
    privacyNote:
      'Online, the OpenStreetMap basemap sends your IP address and tile requests to its provider. The hosting provider also receives app and update requests. No telemetry is added.',
    privacyItems: [
      'Your files stay on your device',
      'No implicit synchronisation',
      'Optional location access',
      'Open code, under the MIT licence',
    ],
    faqEyebrow: 'BEFORE YOU SET OFF',
    faqTitle: 'A few good questions.',
    faqs: [
      {
        q: 'Does Mobilitor work offline?',
        a: 'Yes for the interface and local features, once the app is cached and the data you need has been imported. The online OpenStreetMap basemap is not available offline; your imported vector layers remain visible.',
      },
      {
        q: 'Is transport data already installed?',
        a: 'No. You choose your sources and import compatible files. The map covers France; the engine is intended for imported GTFS feeds for Île-de-France. No complete regional or national dataset is preinstalled.',
      },
      {
        q: 'What are the calculation limits?',
        a: 'The engine uses explicit scheduled timetables. Walking, real-time information, GTFS frequencies and daylight saving transition days are not supported. Isochrone discs are symbols around reachable stops. Large feeds need to be reduced to subnetworks: maximum 40 MB compressed and 500,000 stop times.',
      },
      {
        q: 'Can I add it to my phone or computer?',
        a: 'Yes, Mobilitor is a PWA. The install button opens the browser dialog when available, or a guide for Android, iPhone/iPad and desktop. On iOS, use Share → Add to Home Screen in Safari.',
      },
      {
        q: 'Can I use the app in French?',
        a: 'Yes. Both this page and the app are available in French and English. Your choice is saved on your device without changing station names or imported data.',
      },
    ],
    finalEyebrow: 'MAKE ROOM FOR THE POSSIBILITIES',
    finalTitle: 'Your area is waiting.',
    finalText: 'Open the map. Bring your data.\nSee your journeys in a different light.',
    legal: 'Legal notice & privacy',
    code: 'View the source code',
    footer: 'Calculated here. Stored here.',
    footerNote: 'An independent tool. Third-party data, scheduled timetables.',
    legalTitle: 'Legal information and privacy',
  },
} as const;
