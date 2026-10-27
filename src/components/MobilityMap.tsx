import { t } from '../i18n';
import { useLocale } from '../i18n/useLocale';
import { useEffect, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Marker,
  Popup,
  GeoJSON,
  useMapEvents,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import { db } from '../db/database';
import { stationsInBounds } from '../services/stationService';
import type { Station, GeoRecord } from '../db/schema';
import type { Result } from '../routing/types';
import { HelpTip } from './HelpTip';
import { visualization } from '../routing/geometry';
const colors = ['#237b66', '#d18a36', '#7f65ad'];
const originIcon = L.divIcon({
  className: 'origin-pin',
  html: '<span></span>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});
function Contents({
  origin,
  onCoordinate,
  onStation,
  showStations,
  showLines,
  showAreas,
}: {
  origin?: [number, number];
  onCoordinate: (p: [number, number]) => void;
  onStation: (s: Station) => void;
  showStations: boolean;
  showLines: boolean;
  showAreas: boolean;
}) {
  useLocale();

  const [stations, setStations] = useState<Station[]>([]),
    [lines, setLines] = useState<GeoRecord[]>([]),
    [areas, setAreas] = useState<GeoRecord[]>([]);
  const map = useMapEvents({
    moveend: load,
    click: (e) => onCoordinate([e.latlng.lat, e.latlng.lng]),
  });
  async function load() {
    const b = map.getBounds();
    setStations(await stationsInBounds(b.getSouth(), b.getNorth(), b.getWest(), b.getEast()));
  }
  useEffect(() => {
    void load();
    void db.lineGeometries.limit(500).toArray().then(setLines);
    void db.administrativeAreas.limit(200).toArray().then(setAreas);
  }, []); // bounded map data, never reads stop_times
  useEffect(() => {
    if (origin) map.panTo(origin);
  }, [origin?.[0], origin?.[1]]);
  return (
    <>
      {showAreas &&
        areas.map((a) => (
          <GeoJSON
            key={a.id}
            data={a.feature}
            style={{ color: '#718b80', weight: 1, fillOpacity: 0.04 }}
          />
        ))}
      {showLines &&
        lines.map((l) => (
          <GeoJSON key={l.id} data={l.feature} style={{ color: '#507e77', weight: 3 }} />
        ))}
      {showStations &&
        stations.map((s) => (
          <CircleMarker
            key={s.id}
            center={[s.latitude, s.longitude]}
            radius={4}
            bubblingMouseEvents={false}
            pathOptions={{ color: '#32665f', fillColor: '#fff', fillOpacity: 1, weight: 2 }}
            eventHandlers={{ click: () => onStation(s) }}
          >
            <Popup>
              <strong>{s.name}</strong>
              <br />
              <button onClick={() => onStation(s)}>{t('Choisir comme origine')}</button>
            </Popup>
          </CircleMarker>
        ))}
      {origin && (
        <Marker
          position={origin}
          icon={originIcon}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const p = (e.target as L.Marker).getLatLng();
              onCoordinate([p.lat, p.lng]);
            },
          }}
        >
          <Popup>{t('Point sélectionné. Choisissez un arrêt pour le moteur GTFS.')}</Popup>
        </Marker>
      )}
    </>
  );
}
function Resize() {
  const map = useMap();
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return null;
}
export function MobilityMap({
  origin,
  onCoordinate,
  onStation,
  results,
  threshold,
  onlineTiles,
}: {
  origin?: [number, number];
  onCoordinate: (p: [number, number]) => void;
  onStation: (s: Station) => void;
  results: Result[];
  threshold: number;
  onlineTiles: boolean;
}) {
  useLocale();

  const [stations, setStations] = useState(true),
    [lines, setLines] = useState(true),
    [areas, setAreas] = useState(true);
  return (
    <div className="map-frame" id="map-export">
      <MapContainer
        bounds={[
          [41.3, -5.3],
          [51.2, 9.7],
        ]}
        boundsOptions={{ padding: [16, 16] }}
        preferCanvas
        className="map"
      >
        <Resize />
        {onlineTiles && (
          <TileLayer
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            crossOrigin="anonymous"
          />
        )}
        <Contents
          origin={origin}
          onCoordinate={onCoordinate}
          onStation={onStation}
          showStations={stations}
          showLines={lines}
          showAreas={areas}
        />
        {results.map((r, index) => (
          <GeoJSON
            key={JSON.stringify([r.request, index, threshold])}
            data={visualization(r, threshold)}
            style={{ color: colors[index], fillColor: colors[index], fillOpacity: 0.3, weight: 1 }}
          />
        ))}
      </MapContainer>
      <div className="map-label">
        <span className="eyebrow">{t('FRANCE')}</span>
        <strong>{t('Votre territoire, à votre rythme.')}</strong>
        {!onlineTiles && (
          <small>{t('Fond externe désactivé · couches importées disponibles hors ligne')}</small>
        )}
      </div>
      <div className="layers">
        {[
          [t('Arrêts'), stations, setStations],
          [t('Lignes'), lines, setLines],
          [t('Limites'), areas, setAreas],
        ].map(([name, value, set]) => (
          <label key={String(name)}>
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => (set as (v: boolean) => void)(e.target.checked)}
            />
            {String(name)}
          </label>
        ))}
      </div>
      <div className="map-legend">
        <HelpTip
          text={t(
            'Déplacez ou zoomez la carte. Cliquez sur un point pour chercher un arrêt proche ; activez les couches importées avec les cases. Les disques sont symboliques, sans garantie d’accès piéton.',
          )}
        />
        <span className="dot" /> {t('Arrêts importés')} <span className="legend-rule" />{' '}
        {t('Tracés importés')}{' '}
        {results.length > 0 && (
          <small>
            {t('Disques symboliques de 80 m · affichage limité à 2 000 symboles par origine.')}
            <br />
            {results
              .map(
                (r) =>
                  `${r.request.date} ${r.request.time} · ${r.sourceName} · ${r.attribution || ''}`,
              )
              .join(' / ')}
          </small>
        )}
      </div>
    </div>
  );
}
