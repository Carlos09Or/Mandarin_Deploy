"""Cut a boat sheet (4 types x sailing/anchored on flat magenta) into transparent sprites.

Usage: python3 tools/cut_boats.py                      the small boats (sheet-barcos.webp)
       python3 tools/cut_boats.py sheet-naves.webp container-ship,tanker,bulk-carrier,cruise-ship 340
                                                       the ships waiting for the Canal (sheet, 4 type names, width px)

Reads  design/assets/boats/<sheet>   (row 1 = sailing, row 2 = at anchor, one type per column)
Writes app/public/journey/boats/<type>-<sail|anchor>.webp and adds their sizes to design/assets/boats/boats.json.
"""
import json
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHEET = sys.argv[1] if len(sys.argv) > 1 else "sheet-barcos.webp"
SRC = os.path.join(ROOT, "design", "assets", "boats", SHEET)
OUT = os.path.join(ROOT, "app", "public", "journey", "boats")
TYPES = sys.argv[2].split(",") if len(sys.argv) > 2 else ["sailboat", "fishing-boat", "cayuco", "ferry"]
STATES = ["sail", "anchor"]
WIDTH = int(sys.argv[3]) if len(sys.argv) > 3 else 260  # px; shown at ~60 px on a phone, so this stays sharp at 3x

img = Image.open(SRC).convert("RGB")
a = np.asarray(img).astype(float)
# Distance from magenta: 0 = pure background, 1 = clearly boat.
d = np.sqrt((a[..., 0] - 255) ** 2 + a[..., 1] ** 2 + (a[..., 2] - 255) ** 2)
alpha = np.clip((d - 40) / 90, 0, 1)
solid = alpha > 0.5
solid = ndi.binary_closing(solid, iterations=6)
lab, n = ndi.label(solid)
objs = ndi.find_objects(lab)
sizes = ndi.sum(solid, lab, range(1, n + 1))
# the 8 big blobs; small specks (stray bits of wake) get merged into the nearest cell below
big = [i for i in range(n) if sizes[i] > 4000]
assert len(big) == 8, f"expected 8 sprites, found {len(big)}"
cells = []
for i in big:
    sl = objs[i]
    cells.append((sl[0].start, sl[0].stop, sl[1].start, sl[1].stop, i + 1))
cells.sort(key=lambda c: (c[0] + c[1]) / 2 > img.height / 2)  # row 1 then row 2 (stable)
rows = [sorted([c for c in cells if (c[0] + c[1]) / 2 < img.height / 2], key=lambda c: c[2]),
        sorted([c for c in cells if (c[0] + c[1]) / 2 >= img.height / 2], key=lambda c: c[2])]

# De-spill: pull magenta out of edge pixels, then use the soft alpha.
rgb = a.copy()
spill = (1 - alpha)[..., None]
rgb = np.where(alpha[..., None] > 0, (rgb - spill * np.array([255, 0, 255])) / np.maximum(alpha[..., None], 0.05), rgb)
rgb = np.clip(rgb, 0, 255)
rgba = np.dstack([rgb, alpha * 255]).astype(np.uint8)
full = Image.fromarray(rgba)

os.makedirs(OUT, exist_ok=True)
META = os.path.join(ROOT, "design", "assets", "boats", "boats.json")
meta = json.load(open(META)) if os.path.exists(META) else {}
for r, state in enumerate(STATES):
    for c, kind in enumerate(TYPES):
        y0, y1, x0, x1, ident = rows[r][c]
        pad = 6
        # keep only this blob's own pixels (the wake specks of its neighbours stay out)
        # only this ship's own pixels (and its wake, close by): a neighbour's wake tail must not come along
        own = ndi.binary_dilation(lab == ident, iterations=8)
        keep = np.asarray(full).copy()
        keep[..., 3] = np.where(own, keep[..., 3], 0)
        crop = Image.fromarray(keep).crop((max(0, x0 - pad), max(0, y0 - pad), x1 + pad, y1 + pad))
        bb = crop.getchannel("A").point(lambda v: 255 if v > 24 else 0).getbbox()
        crop = crop.crop(bb)
        h = round(crop.height * WIDTH / crop.width)
        crop = crop.resize((WIDTH, h), Image.LANCZOS)
        crop.save(os.path.join(OUT, f"{kind}-{state}.webp"), quality=92, method=6)
        meta[f"{kind}-{state}"] = {"w": WIDTH, "h": h}
        print(kind, state, WIDTH, h)
json.dump(meta, open(META, "w"), indent=1)
