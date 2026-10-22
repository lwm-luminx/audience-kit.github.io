#!/usr/bin/env python3
"""Writes public/assets/qr/<slug>.svg, a QR code for each staff app's stable link (https://audiencekit.com/apps/<slug>/).

Run after adding an app to src/data/staff_apps.json: `python3 -m pip install segno && python3 scripts/qr.py`. The codes
encode the stable link, not the store URLs, so they never need regenerating when an app leaves beta.
"""
import pathlib
import re
import json

import segno

ROOT = pathlib.Path(__file__).resolve().parent.parent
SLUGS = [app['slug'] for app in json.loads((ROOT / 'src/data/staff_apps.json').read_text())]

for slug in SLUGS:
    out = ROOT / 'public/assets/qr' / f'{slug}.svg'
    segno.make(f'https://audiencekit.com/apps/{slug}/', error='m').save(
        out, kind='svg', scale=1, border=2, dark='#21122a', light='#ffffff', xmldecl=False, nl=False)
    svg = out.read_text()
    size = re.search(r'width="(\d+)"', svg).group(1)
    svg = re.sub(r' width="\d+" height="\d+"', f' viewBox="0 0 {size} {size}" shape-rendering="crispEdges"', svg, count=1)
    out.write_text(svg)
    print(out.relative_to(ROOT))
