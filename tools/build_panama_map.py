"""Turn Panama's ADM1 boundaries (geoBoundaries, from OpenStreetMap, ODbL 1.0) into a light SVG map.

Usage: python3 tools/build_panama_map.py <geoBoundaries-PAN-ADM1_simplified.geojson>
Source: https://www.geoboundaries.org/api/current/gbOpen/PAN/ADM1/  (© OpenStreetMap contributors)

Writes design/assets/panama/map-provinces.json (one simplified path per region, with its centroid)
and design/assets/panama/map-provinces.svg (a plain preview of the shapes).
"""
import json
import math
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "design", "assets", "panama")

IDS = {
    "Provincia de Panamá": ("panama", "province", 1),
    "Provincia de Panamá Oeste": ("panama-oeste", "province", 2),
    "Provincia de Coclé": ("cocle", "province", 3),
    "Provincia de Herrera": ("herrera", "province", 4),
    "Provincia de Los Santos": ("los-santos", "province", 5),
    "Provincia de Veraguas": ("veraguas", "province", 6),
    "Provincia de Chiriquí": ("chiriqui", "province", 7),
    "Provincia de Bocas del Toro": ("bocas-del-toro", "province", 8),
    "Colón Province": ("colon", "province", 9),
    "Provincia de Darién": ("darien", "province", 10),
    "Comarca Guna Yala": ("guna-yala", "comarca", None),
    "Comarca Emberá-Wounaan": ("embera-wounaan", "comarca", None),
    "Comarca Ngäbe-Buglé": ("ngabe-bugle", "comarca", None),
}
NAMES = {
    "panama": "Panama", "panama-oeste": "Panama Oeste", "cocle": "Cocle", "herrera": "Herrera",
    "los-santos": "Los Santos", "veraguas": "Veraguas", "chiriqui": "Chiriqui",
    "bocas-del-toro": "Bocas del Toro", "colon": "Colon", "darien": "Darien",
    "guna-yala": "Guna Yala", "embera-wounaan": "Embera-Wounaan", "ngabe-bugle": "Ngabe-Bugle",
}

WIDTH = 1000          # viewBox width; height follows the country's proportions
PAD = 12
TOLERANCE = 0.9       # Ramer–Douglas–Peucker tolerance in viewBox units
MIN_AREA = 12         # drop islets smaller than this (viewBox units²)


def rdp(pts, eps):
    if len(pts) < 3:
        return pts
    (x1, y1), (x2, y2) = pts[0], pts[-1]
    dx, dy = x2 - x1, y2 - y1
    norm = math.hypot(dx, dy) or 1e-9
    best, idx = 0.0, 0
    for i in range(1, len(pts) - 1):
        x0, y0 = pts[i]
        d = abs(dy * x0 - dx * y0 + x2 * y1 - y2 * x1) / norm
        if d > best:
            best, idx = d, i
    if best > eps:
        return rdp(pts[: idx + 1], eps)[:-1] + rdp(pts[idx:], eps)
    return [pts[0], pts[-1]]


def area_centroid(ring):
    a = cx = cy = 0.0
    for (x0, y0), (x1, y1) in zip(ring, ring[1:] + ring[:1]):
        c = x0 * y1 - x1 * y0
        a += c
        cx += (x0 + x1) * c
        cy += (y0 + y1) * c
    a /= 2
    if abs(a) < 1e-9:
        return 0.0, ring[0]
    return abs(a), (cx / (6 * a), cy / (6 * a))


def main(path):
    gj = json.load(open(path, encoding="utf-8"))
    feats = []
    lons, lats = [], []
    for f in gj["features"]:
        g = f["geometry"]
        polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
        feats.append((f["properties"]["shapeName"], polys))
        for poly in polys:
            for lon, lat in poly[0]:
                lons.append(lon)
                lats.append(lat)
    lon0, lon1, lat0, lat1 = min(lons), max(lons), min(lats), max(lats)
    k_lon = math.cos(math.radians((lat0 + lat1) / 2))  # equirectangular, corrected at mid-latitude
    scale = (WIDTH - 2 * PAD) / ((lon1 - lon0) * k_lon)
    height = round((lat1 - lat0) * scale + 2 * PAD)

    def proj(lon, lat):
        return ((lon - lon0) * k_lon * scale + PAD, (lat1 - lat) * scale + PAD)

    regions = []
    for name, polys in feats:
        rid, kind, unit = IDS[name]
        parts, best = [], (0.0, (0, 0))
        for poly in polys:
            ring = [proj(lon, lat) for lon, lat in poly[0]]
            if ring[0] == ring[-1]:
                ring = ring[:-1]
            area, cen = area_centroid(ring)
            if area < MIN_AREA:
                continue
            if area > best[0]:
                best = (area, cen)
            # Closed ring: split at the point farthest from the start so RDP has a real chord.
            far = max(range(len(ring)), key=lambda i: math.dist(ring[0], ring[i]))
            simple = rdp(ring[: far + 1], TOLERANCE)[:-1] + rdp(ring[far:] + [ring[0]], TOLERANCE)[:-1]
            if len(simple) >= 3:
                parts.append("M" + "L".join(f"{x:.1f} {y:.1f}" for x, y in simple) + "Z")
        regions.append({
            "id": rid, "name": NAMES[rid], "kind": kind, "unit": unit,
            "d": "".join(parts), "c": [round(best[1][0], 1), round(best[1][1], 1)],
        })
    regions.sort(key=lambda r: (r["kind"] != "province", r["unit"] or 99))
    meta = {
        "viewBox": f"0 0 {WIDTH} {height}",
        "source": "geoBoundaries gbOpen PAN ADM1 (2017), from OpenStreetMap — © OpenStreetMap contributors, ODbL 1.0",
        "note": "Naso Tjër Di (comarca created in 2020) is not in this dataset yet.",
        "regions": regions,
    }
    os.makedirs(OUT, exist_ok=True)
    json.dump(meta, open(os.path.join(OUT, "map-provinces.json"), "w", encoding="utf-8"), ensure_ascii=False)
    svg = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{meta["viewBox"]}">']
    for r in regions:
        fill = "#efe3cc" if r["kind"] == "comarca" else "#9fd27a"
        svg.append(f'<path id="{r["id"]}" d="{r["d"]}" fill="{fill}" stroke="#fff" stroke-width="2"/>')
    svg.append("</svg>")
    open(os.path.join(OUT, "map-provinces.svg"), "w", encoding="utf-8").write("\n".join(svg))
    size = os.path.getsize(os.path.join(OUT, "map-provinces.json"))
    print(f"{len(regions)} regions, viewBox {meta['viewBox']}, {size // 1024} KB")


if __name__ == "__main__":
    main(sys.argv[1])
