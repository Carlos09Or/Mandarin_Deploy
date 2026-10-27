"""Lift the two painted boats off the Panama map so the app can sail them.

Usage: python3 tools/prep_map_boats.py   (needs Pillow)

Reads  design/assets/panama/map-illustrated.webp and map-fog.webp (any resolution, 16:9).
Writes map-illustrated-clean.webp and map-fog-clean.webp (boats and wakes painted over with sea),
boat-1.webp / boat-2.webp (each hull on a transparent background) and boats.json
(where each hull sat, as fractions of the map, so the page can place the sprites).
"""
import json
import os

from PIL import Image, ImageFilter, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = os.path.join(ROOT, "design", "assets", "panama")

# Measured on the 1672 × 941 map, kept as fractions so a larger copy works too.
# hull: the boat itself; clear: hull plus its painted wake.
BOATS = [
    {"hull": (672, 138, 752, 192), "clear": (660, 114, 838, 200)},
    {"hull": (952, 752, 1034, 812), "clear": (940, 696, 1140, 820)},
]
BASE = (1672, 941)


def scale(box, size):
    sx, sy = size[0] / BASE[0], size[1] / BASE[1]
    return tuple(round(v * (sx if i % 2 == 0 else sy)) for i, v in enumerate(box))


def border_pixels(img, box, pad):
    x0, y0, x1, y1 = box
    ring = []
    for x in range(x0 - pad, x1 + pad, 2):
        ring += [img.getpixel((x, y0 - pad)), img.getpixel((x, y1 + pad - 1))]
    for y in range(y0 - pad, y1 + pad, 2):
        ring += [img.getpixel((x0 - pad, y)), img.getpixel((x1 + pad - 1, y))]
    return ring


def patch_sea(img, box):
    """Paint over whatever is not open sea inside box (hull, shadow, wake) by
    diffusing the surrounding water inward, so no copied seam shows."""
    x0, y0, x1, y1 = box
    ring = border_pixels(img, box, 2)
    sea = tuple(sorted(c[i] for c in ring)[len(ring) // 2] for i in range(3))
    region = img.crop(box)
    hole = Image.new("L", region.size, 0)
    hp, rp = hole.load(), region.load()
    for y in range(region.height):
        for x in range(region.width):
            r, g, b = rp[x, y]
            if ((r - sea[0]) ** 2 + (g - sea[1]) ** 2 + (b - sea[2]) ** 2) ** 0.5 > 34:
                hp[x, y] = 255
    hole = hole.filter(ImageFilter.MaxFilter(7))
    # Normalized convolution at growing radii: average only the known water around each hole pixel.
    pad = max(region.size)
    big = img.crop((x0 - pad, y0 - pad, x1 + pad, y1 + pad))
    known = Image.new("L", big.size, 255)
    known.paste(ImageOps.invert(hole), (pad, pad))
    filled = big.copy()
    for radius in (3, 6, 12, 24, 48):
        weight = known.filter(ImageFilter.GaussianBlur(radius))
        masked = Image.composite(big, Image.new("RGB", big.size), known)
        blur = masked.filter(ImageFilter.GaussianBlur(radius))
        wp, bp, fp, kp = weight.load(), blur.load(), filled.load(), known.load()
        for y in range(big.height):
            for x in range(big.width):
                if kp[x, y] == 0 and wp[x, y] > 40:
                    w = wp[x, y] / 255
                    fp[x, y] = tuple(min(255, round(c / w)) for c in bp[x, y])
                    kp[x, y] = 255
        big = filled.copy()
    soft = hole.filter(ImageFilter.GaussianBlur(1.5))
    img.paste(filled.crop((pad, pad, pad + region.width, pad + region.height)), (x0, y0), soft)


def lift_hull(img, box):
    """Hull on transparency: alpha grows with the distance from the surrounding sea colour."""
    x0, y0, x1, y1 = box
    ring = border_pixels(img, box, 2)
    sea = tuple(sorted(c[i] for c in ring)[len(ring) // 2] for i in range(3))
    hull = img.crop(box).convert("RGBA")
    px = hull.load()
    for y in range(hull.height):
        for x in range(hull.width):
            r, g, b, _ = px[x, y]
            d = ((r - sea[0]) ** 2 + (g - sea[1]) ** 2 + (b - sea[2]) ** 2) ** 0.5
            a = max(0.0, min(1.0, (d - 22) / 50))
            px[x, y] = (r, g, b, round(a * 255))
    return hull


def main():
    out = {"boats": []}
    for name in ("map-illustrated", "map-fog"):
        img = Image.open(os.path.join(A, name + ".webp")).convert("RGB")
        if name == "map-illustrated":
            for i, b in enumerate(BOATS, start=1):
                hull = scale(b["hull"], img.size)
                lift_hull(img, hull).save(os.path.join(A, f"boat-{i}.webp"), quality=92)
                out["boats"].append({"id": i, "box": [round(v / s, 5) for v, s in zip(hull, img.size * 2)]})
        for b in BOATS:
            patch_sea(img, scale(b["clear"], img.size))
        img.save(os.path.join(A, name + "-clean.webp"), quality=90)
        print(name, img.size, "cleaned")
    json.dump(out, open(os.path.join(A, "boats.json"), "w"), indent=1)
    print(json.dumps(out))


if __name__ == "__main__":
    main()
