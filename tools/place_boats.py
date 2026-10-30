"""Pick where the boats of the Panama map sail or rest, always on open water.

Usage: python3 tools/place_boats.py [debug.png]   (needs Pillow, numpy, scipy)

Reads  app/public/journey/map-illustrated-clean.webp (land = anything that is not blue sea, so coasts,
       reefs, palms, clouds and the Canal ship all count) and app/src/data/map-provinces.json.
Writes app/src/data/sea-boats.ts. Every boat keeps clear of land and of every other boat: moving
boats are checked along their whole lane, so two of them can never meet whatever the timing.
Coordinates are map (viewBox) units, VB = x -40, y -89, 1080 x 607.5; one unit is one pixel of the
1080 px wide copy used here.
"""
import json
import math
import os
import random
import re
import sys

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VBX, VBY, W, H = -40, -89, 1080, 608

# ---- what the boats look like ----
SIZE = {  # share of map width
    "ferry": 0.052, "sailboat": 0.036, "fishing-boat": 0.036, "cayuco": 0.034,
    "container-ship": 0.064, "tanker": 0.064, "bulk-carrier": 0.062, "cruise-ship": 0.066,
}
SPEED = {  # units per second
    "ferry": 2.4, "sailboat": 2.6, "fishing-boat": 3.0, "cayuco": 2.0,
    "container-ship": 2.0, "tanker": 1.7, "bulk-carrier": 1.8, "cruise-ship": 2.2,
}

# ---- who lives where ----
# Each boat names the province whose waters it belongs to (it shows when that province's fog clears), what it is,
# how it spends its time, and where on the 1080 px map (px = map unit + (40, 89)) it would like to be:
#   moor  = anchored by a coast or an island      drift = parked out at sea
#   sail  = crosses the water from `a` to `b`     call  = sails in, drops anchor for a while, then sails on
# The script slides each one to the nearest spot that is really open water and clear of the others.
B = lambda province, kind, how, a, b=None: dict(province=province, kind=kind, how=how, a=a, b=b)
PLAN = [
    # Five boats only, around Panama, where the first lesson is: what the camera sees from the first badge. One ship
    # sails in from the Caribbean queue for the Canal, waits its turn at anchor and moves on; a sailboat crosses the
    # Gulf; the rest are at anchor or drifting. (There were 35 across every province; the map felt crowded and heavy.)
    B("panama", "container-ship", "call", (630, 50), (480, 72)),
    B("panama", "sailboat", "sail", (690, 255), (610, 300)),
    B("panama", "sailboat", "moor", (760, 255)),
    B("panama", "fishing-boat", "moor", (690, 350)),
    B("panama", "cayuco", "drift", (800, 300)),
]
# A comarca's boats come out when the province next to it opens.
GATE = {"guna-yala": "colon"}

# ---- land and provinces ----
im = Image.open(os.path.join(ROOT, "app/public/journey/map-illustrated-clean.webp")).convert("RGB").resize((W, H), Image.LANCZOS)
hsv = np.asarray(im.convert("HSV")).astype(float)
h, s, v = hsv[..., 0] * 360 / 255, hsv[..., 1] / 255, hsv[..., 2] / 255
water = (h >= 175) & (h <= 235) & (s > 0.45) & (v > 0.35)
land = ndi.binary_opening(~water, iterations=1)
clear = ndi.distance_transform_edt(~land)  # distance to the nearest land pixel

regions = json.load(open(os.path.join(ROOT, "app/src/data/map-provinces.json")))["regions"]
ids = [r["id"] for r in regions]
lab = Image.new("L", (W, H), 0)
dr = ImageDraw.Draw(lab)
for i, r in enumerate(regions, 1):
    pts = [(float(a) - VBX, float(b) - VBY) for a, b in re.findall(r"([\d.]+) ([\d.]+)", r["d"])]
    dr.polygon(pts, fill=i)
lab = np.asarray(lab)
# the illustration's land that no province polygon covers (islands, the strip west of the Canal) goes to the nearest province
dist, (iy, ix) = ndi.distance_transform_edt(lab == 0, return_indices=True)
owner = lab[iy, ix]
coast = dist  # distance to the nearest province polygon, for "stay near the province"


def to_xy(px, py):
    return (px + VBX, py + VBY)


def to_px(x, y):
    return (x - VBX, y - VBY)


def land_clear(px, py):
    xi, yi = int(round(px)), int(round(py))
    if not (0 <= xi < W and 0 <= yi < H):
        return 0
    # the map's edge counts as land too, so nothing sits half out of the picture
    return min(clear[yi, xi], min(xi, yi, W - 1 - xi, H - 1 - yi) - 4)


def radius(kind):
    # the big ships are long and narrow, so a circle 0.42 of their width wide is enough
    return (0.44 if SIZE[kind] > 0.06 else 0.5) * SIZE[kind] * W + 2


def lane_ok(kind, a, b, others):
    """Whole segment a-b (px) stays clear of land and of the other boats' segments."""
    r = radius(kind)
    n = int(math.hypot(b[0] - a[0], b[1] - a[1]) / 3) + 2
    for i in range(n + 1):
        t = i / n
        if land_clear(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t) < r:
            return False
    for (oa, ob, orad) in others:
        if seg_dist(a, b, oa, ob) < r + orad + 10:
            return False
    return True


def seg_dist(a, b, c, d):
    """Smallest distance between segments ab and cd (sampled; they are short)."""
    na = int(math.hypot(b[0] - a[0], b[1] - a[1]) / 4) + 2
    nc = int(math.hypot(d[0] - c[0], d[1] - c[1]) / 4) + 2
    best = 1e9
    for i in range(na + 1):
        p = (a[0] + (b[0] - a[0]) * i / na, a[1] + (b[1] - a[1]) * i / na)
        for j in range(nc + 1):
            q = (c[0] + (d[0] - c[0]) * j / nc, c[1] + (d[1] - c[1]) * j / nc)
            best = min(best, math.hypot(p[0] - q[0], p[1] - q[1]))
    return best


rng = random.Random(7)
placed = []   # (a, b, radius) in px, b == a for a boat that stays put
out = []
fails = []
# nearest-first offsets to slide a boat that does not fit where we wanted it
OFFS = sorted(((dx, dy) for dx in range(-60, 61, 5) for dy in range(-60, 61, 5)), key=lambda o: o[0] ** 2 + o[1] ** 2)
for e in PLAN:
    kind, how = e["kind"], e["how"]
    r = radius(kind)
    found = None
    for dx, dy in OFFS:
        a = (e["a"][0] + dx, e["a"][1] + dy)
        if e["b"] is None:
            if lane_ok(kind, a, a, placed):
                found = (a, a)
                break
            continue
        b0 = (e["b"][0] + dx, e["b"][1] + dy)
        for k in (1.0, 0.85, 0.7, 0.55):
            b = (a[0] + (b0[0] - a[0]) * k, a[1] + (b0[1] - a[1]) * k)
            if lane_ok(kind, a, b, placed):
                found = (a, b)
                break
        if found:
            break
    if not found:
        fails.append((e["province"], kind, how))
        continue
    a, b = found
    placed.append((a, b, r))
    ua, ub = to_xy(*a), to_xy(*b)
    gate = GATE.get(e["province"], e["province"])
    if e["b"] is None:
        out.append(dict(kind=kind, province=gate, at=[round(ua[0], 1), round(ua[1], 1)], flip=rng.random() < 0.5, how=how))
        continue
    length = math.hypot(b[0] - a[0], b[1] - a[1])
    d = dict(kind=kind, province=gate, **{"from": [round(ua[0], 1), round(ua[1], 1)], "to": [round(ub[0], 1), round(ub[1], 1)]},
             secs=round(length / SPEED[kind]), how=how)
    if how == "call":
        d["stop"] = round(rng.uniform(0.4, 0.6), 2)
        d["rest"] = rng.choice([14, 18, 24, 30])
    out.append(d)

print(len(out), "boats placed; could not place:", fails)

# ---- write the TypeScript ----
def fmt(d):
    parts = [f"kind: '{d['kind']}'", f"province: '{d['province']}'"]
    if "from" in d:
        parts += [f"from: {d['from']}", f"to: {d['to']}", f"secs: {d['secs']}"]
        if "stop" in d:
            parts += [f"stop: {d['stop']}", f"rest: {d['rest']}"]
    else:
        parts += [f"at: {d['at']}"]
        if d["flip"]:
            parts += ["flip: true"]
    return "  { " + ", ".join(parts) + " },"

ts = """// Generated by tools/place_boats.py from the map's own land and the province shapes. Do not edit by hand:
// change the plan in the script and run it again, so every boat keeps clear of land and of the others.

export type BoatKind = %s
/** A boat's width as a share of the map's width. */
export const BOAT_SIZE: Record<BoatKind, number> = {\n%s\n}
/**
 * `province` is the province whose waters it sails; it shows up when that province's fog clears.
 * With `at` the boat stays at anchor there; with `from`/`to` it sails that line in `secs` seconds, and with `stop`
 * (share of the line) and `rest` (seconds) it drops anchor on the way, waits, then sails on.
 */
export type SeaBoat = {
  kind: BoatKind
  province: string
  at?: [number, number]
  flip?: boolean
  from?: [number, number]
  to?: [number, number]
  secs?: number
  stop?: number
  rest?: number
}
export const SEA_BOATS: SeaBoat[] = [
""" % (" | ".join("'%s'" % k for k in SIZE), "\n".join("  %s: %s," % (("'%s'" % k if "-" in k else k), v) for k, v in SIZE.items()))
ts += "\n".join(fmt(d) for d in out) + "\n]\n"
open(os.path.join(ROOT, "app/src/data/sea-boats.ts"), "w").write(ts)

# ---- a picture to check them by ----
if len(sys.argv) > 1:
    vis = im.copy()
    d = ImageDraw.Draw(vis)
    for a, b, r in placed:
        d.line([a, b], fill=(255, 255, 0), width=2)
        for p in (a, b):
            d.ellipse([p[0] - r, p[1] - r, p[0] + r, p[1] + r], outline=(255, 255, 255))
    vis.save(sys.argv[1])

if os.environ.get("OWNERS"):
    pal = np.random.RandomState(3).randint(40, 255, (len(ids) + 1, 3)).astype(np.uint8)
    vis = np.asarray(im).copy()
    m = (clear > 0)
    vis[m] = (0.5 * vis[m] + 0.5 * pal[owner][m]).astype(np.uint8)
    o = Image.fromarray(vis)
    d = ImageDraw.Draw(o)
    for i, r in enumerate(regions):
        x, y = to_px(*r["c"])
        d.text((x, y), r["id"], fill=(255, 255, 255))
    o.save(os.environ["OWNERS"])
