#!/usr/bin/env python3
"""Prévalidation structurelle ; la PWA effectue la validation métier finale."""
import argparse, csv, io, zipfile
p=argparse.ArgumentParser(description=__doc__);p.add_argument('file');a=p.parse_args()
with zipfile.ZipFile(a.file) as z:
    names={n.split('/')[-1]:n for n in z.namelist()}
    for required in ['agency.txt','stops.txt','routes.txt','trips.txt','stop_times.txt']:
        if required not in names: p.error(f'{required} manquant')
    if not {'calendar.txt','calendar_dates.txt'} & names.keys(): p.error('Calendrier manquant')
    for name,path in names.items():
        if name.endswith('.txt'):
            reader=csv.DictReader(io.StringIO(z.read(path).decode('utf-8-sig')))
            print(f'{name}: {sum(1 for _ in reader)} lignes')
print('Structure présente. Importer dans la PWA pour valider références et horaires.')
