import { t } from '../i18n';
import { useLocale } from '../i18n/useLocale';
import { useEffect, useState } from 'react';
import { listStations } from '../services/stationService';
import type { Station } from '../db/schema';
export function StationSearch({
  label,
  value,
  onChange,
  sourceId,
}: {
  label: string;
  value?: Station;
  onChange: (s: Station) => void;
  sourceId?: string;
}) {
  useLocale();

  const [query, setQuery] = useState(''),
    [open, setOpen] = useState(false),
    [stations, setStations] = useState<Station[]>([]);
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      void listStations(query, sourceId).then((rows) => {
        if (active) setStations(rows);
      });
    }, 120);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, sourceId]);
  return (
    <div
      className="station-search"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <label>
        {label}
        <input
          aria-label={label}
          value={open ? query : value?.name || ''}
          placeholder={t('Rechercher dans les données locales')}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
        />
      </label>
      {open && (
        <div className="suggestions">
          {stations.length ? (
            stations.map((s) => (
              <button
                key={s.id}
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(s);
                  setQuery(s.name);
                  setOpen(false);
                }}
              >
                {s.name}
                <small>{s.externalId}</small>
              </button>
            ))
          ) : (
            <p>{t('Aucun arrêt local correspondant.')}</p>
          )}
        </div>
      )}
    </div>
  );
}
