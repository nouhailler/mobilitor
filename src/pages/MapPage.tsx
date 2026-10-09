import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { toPng } from 'html-to-image';
import { db } from '../db/database';
import type { Station } from '../db/schema';
import { StationSearch } from '../components/StationSearch';
import { MobilityMap } from '../components/MobilityMap';
import { calculateRoute, compareOrigins } from '../services/routeService';
import { exportGeoJSON } from '../routing/geometry';
import { findNearbyStations } from '../services/stationService';
import { download } from '../services/storageService';
import type { Result } from '../routing/types';
const initialDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Paris',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(new Date());
function clock(n: number) {
  return `${String(Math.floor(n / 3600)).padStart(2, '0')}:${String(Math.floor((n % 3600) / 60)).padStart(2, '0')}`;
}
export function MapPage({ comparison = false }: { comparison?: boolean }) {
  const [params] = useSearchParams();
  const sources = useLiveQuery(
    () => db.dataSources.filter((s) => s.kind === 'gtfs').toArray(),
    [],
    [],
  );
  const [sourceId, setSource] = useState(''),
    [origins, setOrigins] = useState<(Station | undefined)[]>([undefined, undefined, undefined]),
    [destination, setDestination] = useState<Station>(),
    [coordinate, setCoordinate] = useState<[number, number]>(),
    [nearby, setNearby] = useState<Station[]>([]),
    [date, setDate] = useState(initialDate),
    [time, setTime] = useState('08:00'),
    [threshold, setThreshold] = useState(30),
    [results, setResults] = useState<Result[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [progress, setProgress] = useState(''),
    [route, setRoute] = useState(false),
    [onlineTiles, setOnlineTiles] = useState(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => {
    void db.preferences.get('onlineTiles').then((p) => setOnlineTiles(p?.value === true));
    void db.preferences.get('threshold').then((p) => {
      if ([15, 30, 45, 60].includes(Number(p?.value))) setThreshold(Number(p?.value));
    });
    return () => controller.current?.abort();
  }, []);
  useEffect(() => {
    const id = params.get('scenario');
    if (!id) return;
    let active = true;
    void db.savedScenarios.get(id).then(async (scenario) => {
      if (!scenario) return;
      const stops = await db.stations.bulkGet(scenario.origins);
      if (!active) return;
      if (stops.some((s) => !s)) {
        setError('Un jeu du scénario a été supprimé ; choisissez à nouveau les arrêts.');
        return;
      }
      setOrigins([...stops, undefined, undefined].slice(0, 3));
      setSource(stops[0]!.sourceId);
      setDate(scenario.date);
      setTime(scenario.time);
      setCoordinate([stops[0]!.latitude, stops[0]!.longitude]);
    });
    return () => {
      active = false;
    };
  }, [params]);
  const selectedSource = sourceId || sources[0]?.id || '';
  function select(s: Station, index = 0) {
    setOrigins((prev) => prev.map((p, i) => (i === index ? s : p)));
    if (index === 0) {
      setCoordinate([s.latitude, s.longitude]);
      setNearby([]);
    }
    setResults([]);
  }
  async function pickCoordinate(p: [number, number]) {
    setCoordinate(p);
    setOrigins((prev) => [undefined, ...prev.slice(1)]);
    setResults([]);
    setNearby((await findNearbyStations(...p, 1)).filter((s) => s.sourceId === selectedSource));
  }
  async function run() {
    setError('');
    setResults([]);
    const points = origins.filter((s): s is Station => !!s);
    if (!points.length || (comparison && points.length < 2)) {
      setError(
        comparison ? 'Choisissez au moins deux origines.' : 'Choisissez un arrêt d’origine.',
      );
      return;
    }
    if (points.some((s) => s.sourceId !== selectedSource)) {
      setError('Les origines doivent appartenir au même flux.');
      return;
    }
    if (route && !destination) {
      setError('Choisissez une destination.');
      return;
    }
    setBusy(true);
    controller.current = new AbortController();
    try {
      const request = {
        sourceId: selectedSource,
        origin: points[0].externalId,
        destination: route ? destination?.externalId : undefined,
        date,
        time,
        thresholds: [15, 30, 45, 60],
      };
      setResults(
        comparison
          ? await compareOrigins(
              request,
              points.map((s) => s.externalId),
              controller.current.signal,
            )
          : [await calculateRoute(request, controller.current.signal, setProgress)],
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    if (!origins[0]) return;
    await db.savedPlaces.put({
      id: crypto.randomUUID(),
      name: origins[0].name,
      latitude: origins[0].latitude,
      longitude: origins[0].longitude,
      stationId: origins[0].id,
    });
    setProgress('Lieu enregistré sur cet appareil.');
  }
  async function image() {
    try {
      const node = document.getElementById('map-export');
      if (!node) return;
      const url = await toPng(node, {
        filter: (el) => !el.classList?.contains('leaflet-tile-pane'),
        backgroundColor: '#e9eee7',
      });
      download(await (await fetch(url)).blob(), 'mobilite-carte.png', 'image/png');
    } catch {
      setError('Export image impossible dans ce navigateur.');
    }
  }
  const total = results[0]?.reachable.filter((r) => r.seconds <= threshold * 60).length;
  return (
    <div className="explorer">
      <aside className="explore-panel">
        <span className="eyebrow">EXPLORER LES POSSIBLES</span>
        <h1>{comparison ? 'Comparez vos points de départ.' : 'Jusqu’où pouvez-vous aller ?'}</h1>
        <p className="muted">
          {comparison
            ? 'Deux ou trois origines. Les mêmes horaires. Une lecture commune.'
            : 'Explorez les transports autour de vous, avec des calculs qui restent sur votre appareil.'}
        </p>
        {!comparison && (
          <div className="segmented">
            <button
              className={!route ? 'active' : ''}
              onClick={() => {
                setRoute(false);
                setResults([]);
              }}
            >
              Isochrones
            </button>
            <button
              className={route ? 'active' : ''}
              onClick={() => {
                setRoute(true);
                setResults([]);
              }}
            >
              Itinéraire
            </button>
          </div>
        )}
        <label>
          Jeu d’horaires
          <select
            value={selectedSource}
            onChange={(e) => {
              setSource(e.target.value);
              setOrigins([undefined, undefined, undefined]);
              setDestination(undefined);
              setResults([]);
            }}
          >
            <option value="">Aucun flux importé</option>
            {sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <StationSearch
          label="Point de départ"
          value={origins[0]}
          sourceId={selectedSource || undefined}
          onChange={(s) => select(s)}
        />
        {comparison &&
          [1, 2].map((i) => (
            <StationSearch
              key={i}
              label={`Origine ${i + 1}${i === 2 ? ' (facultative)' : ''}`}
              value={origins[i]}
              sourceId={selectedSource || undefined}
              onChange={(s) => select(s, i)}
            />
          ))}
        {coordinate && !origins[0] && (
          <div className="notice">
            Point sélectionné : {coordinate.map((n) => n.toFixed(4)).join(', ')}. Choisissez un
            arrêt proche ; aucun trajet piéton implicite.
            {nearby.map((s) => (
              <button className="text-button" key={s.id} onClick={() => select(s)}>
                {s.name}
              </button>
            ))}
            {!nearby.length && <p>Aucun arrêt du flux à moins de 1 km.</p>}
          </div>
        )}
        {!comparison && (
          <div className="inline-actions">
            <button
              className="text-button"
              onClick={() => {
                if (!navigator.geolocation) {
                  setError('Géolocalisation indisponible.');
                  return;
                }
                navigator.geolocation.getCurrentPosition(
                  (p) => void pickCoordinate([p.coords.latitude, p.coords.longitude]),
                  () => setError('Position indisponible ou autorisation refusée.'),
                  { enableHighAccuracy: false, maximumAge: 0 },
                );
              }}
            >
              ◎ Ma position
            </button>
            <button className="text-button" disabled={!origins[0]} onClick={() => void save()}>
              ☆ Enregistrer
            </button>
          </div>
        )}
        {route && (
          <StationSearch
            label="Destination"
            value={destination}
            sourceId={selectedSource || undefined}
            onChange={setDestination}
          />
        )}
        <div className="field-row">
          <label>
            Date de départ
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setResults([]);
              }}
            />
          </label>
          <label>
            Heure · Paris
            <input
              type="time"
              value={time}
              onChange={(e) => {
                setTime(e.target.value);
                setResults([]);
              }}
            />
          </label>
        </div>
        <label>
          Moteur
          <select value="gtfs" onChange={() => {}}>
            <option value="gtfs">Transports · horaires GTFS</option>
            <option disabled>Marche · réseau piéton absent</option>
          </select>
        </label>
        <label>Temps disponible</label>
        <div className="thresholds">
          {[15, 30, 45, 60].map((n) => (
            <button
              className={threshold === n ? 'active' : ''}
              key={n}
              onClick={() => setThreshold(n)}
            >
              {n}
              <small>min</small>
            </button>
          ))}
        </div>
        <button className="primary" disabled={busy || !sources.length} onClick={() => void run()}>
          {busy
            ? 'Calcul en cours…'
            : comparison
              ? 'Comparer les origines →'
              : route
                ? 'Trouver mon itinéraire →'
                : 'Calculer mon isochrone →'}
        </button>
        {busy && <button onClick={() => controller.current?.abort()}>Annuler le calcul</button>}
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        {progress && (
          <p role="status" className="muted">
            {progress}
          </p>
        )}
        {!sources.length && (
          <div className="empty-card">
            <span>↧</span>
            <strong>Votre carte commence ici.</strong>
            <p>
              Importez vos données pour rechercher des arrêts et calculer vos déplacements hors
              ligne.
            </p>
            <Link to="/donnees">Installer mes données →</Link>
          </div>
        )}
        {!!results.length && (
          <section className="results">
            <span className="eyebrow">RÉSULTATS LOCAUX</span>
            {results.map((r, i) => (
              <div key={i}>
                <h2>{comparison ? origins[i]?.name : `${total} arrêts atteignables`}</h2>
                {comparison && (
                  <p>
                    {r.reachable.filter((s) => s.seconds <= threshold * 60).length} arrêts en{' '}
                    {threshold} min
                  </p>
                )}
                {!!r.servingLines?.length && (
                  <p className="muted">
                    {r.servingLines.length} ligne(s) desservant les arrêts atteignables sur 60 min :{' '}
                    {r.servingLines.slice(0, 20).join(', ')}
                  </p>
                )}
                {route &&
                  (r.arrival === undefined ? (
                    <p>Aucun trajet dans les 60 prochaines minutes.</p>
                  ) : (
                    <>
                      <p>
                        <strong>
                          {Math.ceil(
                            (r.arrival -
                              Number(time.slice(0, 2)) * 3600 -
                              Number(time.slice(3)) * 60) /
                              60,
                          )}{' '}
                          min
                        </strong>{' '}
                        · arrivée {clock(r.arrival)}
                      </p>
                      {r.legs.map((leg, j) => (
                        <div className="leg" key={j}>
                          {leg.departure >
                            (j
                              ? r.legs[j - 1].arrival
                              : Number(time.slice(0, 2)) * 3600 + Number(time.slice(3)) * 60) && (
                            <small>
                              Attente :{' '}
                              {Math.ceil(
                                (leg.departure -
                                  (j
                                    ? r.legs[j - 1].arrival
                                    : Number(time.slice(0, 2)) * 3600 +
                                      Number(time.slice(3)) * 60)) /
                                  60,
                              )}{' '}
                              min
                            </small>
                          )}
                          <small>
                            {clock(leg.departure)} → {clock(leg.arrival)}
                          </small>
                          <strong>
                            {r.stations.find((s) => s.externalId === leg.from)?.name || leg.from} →{' '}
                            {r.stations.find((s) => s.externalId === leg.to)?.name || leg.to}
                          </strong>
                          <small>
                            {leg.kind === 'transfer'
                              ? 'Correspondance'
                              : `Ligne ${leg.line} · course ${leg.trip}`}
                          </small>
                        </div>
                      ))}
                    </>
                  ))}
                <small>
                  {r.request.date} · {r.request.time} · {r.sourceName}
                  <br />
                  Version importée le {new Date(r.importedAt).toLocaleString('fr-FR')}
                </small>
              </div>
            ))}
            <p className="muted">
              Arrêts uniquement. Les disques affichés ne prouvent aucune accessibilité entre les
              arrêts.
            </p>
            <button
              onClick={() =>
                download(
                  JSON.stringify({
                    type: 'FeatureCollection',
                    features: results.flatMap((r) => exportGeoJSON(r, threshold).features),
                  }),
                  'mobilite-isochrones.geojson',
                )
              }
            >
              Exporter GeoJSON
            </button>
            <button onClick={() => void image()}>Exporter la carte PNG</button>
            <button
              onClick={() =>
                void db.savedScenarios
                  .put({
                    id: crypto.randomUUID(),
                    name: `${comparison ? 'Comparaison' : 'Départ'} ${date} ${time}`,
                    origins: origins.filter((s): s is Station => !!s).map((s) => s.id),
                    date,
                    time,
                  })
                  .then(() => setProgress('Scénario enregistré.'))
              }
            >
              Enregistrer le scénario
            </button>
            {results[0].warnings.map((w) => (
              <p className="muted" key={w}>
                {w}
              </p>
            ))}
          </section>
        )}
        <div className="privacy-note">
          ⌁ Sans compte. Sans serveur de calcul.
          <br />
          Vos données restent sur cet appareil.
        </div>
      </aside>
      <MobilityMap
        origin={coordinate}
        onCoordinate={(p) => void pickCoordinate(p)}
        onStation={(s) => select(s)}
        results={results}
        threshold={threshold}
        onlineTiles={onlineTiles}
      />
    </div>
  );
}
