#!/usr/bin/env python3
"""Découper un GTFS par lignes sans backend. Aucun téléchargement implicite."""
import argparse, csv, io, json, zipfile, hashlib
from pathlib import Path
p = argparse.ArgumentParser(description=__doc__)
p.add_argument('input', type=Path)
p.add_argument('output', type=Path)
p.add_argument('--routes', required=True, help='Identifiants exacts, séparés par des virgules')
p.add_argument('--license', required=True, help='Licence vérifiée sur la ressource')
p.add_argument('--source-url', required=True)
a = p.parse_args()
if a.input.resolve() == a.output.resolve():
    p.error('Choisir un fichier de sortie distinct.')
with zipfile.ZipFile(a.input) as archive:
    if sum(f.file_size for f in archive.infolist()) > 3_000_000_000:
        p.error('Archive décompressée > 3 Go.')
    tables = {}
    for name in archive.namelist():
        base = name.split('/')[-1]
        if base.endswith('.txt'):
            reader = csv.DictReader(io.StringIO(archive.read(name).decode('utf-8-sig')))
            tables[base] = (reader.fieldnames, list(reader))
def rows(name): return tables.get(name, ([], []))[1]
def retain(name, predicate):
    if name in tables: tables[name] = (tables[name][0], [r for r in rows(name) if predicate(r)])
selected = set(a.routes.split(','))
retain('routes.txt', lambda r: r['route_id'] in selected)
retain('trips.txt', lambda r: r['route_id'] in selected)
trip_ids = {r['trip_id'] for r in rows('trips.txt')}
service_ids = {r['service_id'] for r in rows('trips.txt')}
shape_ids = {r.get('shape_id') for r in rows('trips.txt')}
retain('stop_times.txt', lambda r: r['trip_id'] in trip_ids)
stop_ids = {r['stop_id'] for r in rows('stop_times.txt')}
for row in rows('stops.txt'):
    if row['stop_id'] in stop_ids and row.get('parent_station'): stop_ids.add(row['parent_station'])
retain('stops.txt', lambda r: r['stop_id'] in stop_ids)
for name in ['calendar.txt', 'calendar_dates.txt']:
    retain(name, lambda r: r['service_id'] in service_ids)
retain('transfers.txt', lambda r: r['from_stop_id'] in stop_ids and r['to_stop_id'] in stop_ids)
retain('frequencies.txt', lambda r: r['trip_id'] in trip_ids)
retain('shapes.txt', lambda r: r['shape_id'] in shape_ids)
retain('pathways.txt', lambda r: r['from_stop_id'] in stop_ids and r['to_stop_id'] in stop_ids)
if rows('frequencies.txt') or rows('pathways.txt'):
    p.error('Lignes sélectionnées utilisant fréquences ou pathways : non prises en charge. Ne pas supprimer ces fichiers pour simuler des horaires explicites.')
allowed = {'agency.txt','stops.txt','routes.txt','trips.txt','stop_times.txt','calendar.txt','calendar_dates.txt','transfers.txt','shapes.txt','feed_info.txt'}
with zipfile.ZipFile(a.output, 'w', zipfile.ZIP_DEFLATED) as archive:
    for name, (fields, records) in tables.items():
        if name not in allowed or not records: continue
        out = io.StringIO(newline='')
        writer = csv.DictWriter(out, fieldnames=fields)
        writer.writeheader(); writer.writerows(records)
        archive.writestr(name, out.getvalue())
metadata = {'source': a.source_url, 'license': a.license, 'routes': sorted(selected), 'sha256': hashlib.sha256(a.output.read_bytes()).hexdigest(), 'stop_times':len(rows('stop_times.txt'))}
a.output.with_suffix('.metadata.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2))
print(json.dumps(metadata, ensure_ascii=False, indent=2))
