"""Replace a friend's door-page sprites (app/public/journey/door/<friend>-<pose>.webp) with new artwork.

Each new picture may be transparent already, or sit on flat white with a soft grey ground shadow.
It is cut out, scaled so the character is as tall as the sprite it replaces and placed on the same
482 x 508 canvas, feet and centre where the old one had them, so nothing moves in the app.
Old sprites are read before they are overwritten (set OLD_DOOR to a folder holding the previous ones to
run it again after the files were replaced).

    python3 tools/cut_door_friend.py wawa rest=a.webp step-l=b.webp jump=c.webp
"""
import os
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as nd

ROOT = Path(__file__).resolve().parent.parent
DOOR = ROOT / 'app/public/journey/door'
SIZE = (482, 508)


def cut_white(rgb: np.ndarray) -> np.ndarray:
    """RGBA from a picture on flat white: the character is the saturated or dark part, the grey ground shadow becomes soft translucent black."""
    rgb = rgb.astype(np.float32)
    mx, mn = rgb.max(axis=2), rgb.min(axis=2)
    lum = rgb.mean(axis=2)
    sat = (mx - mn) / np.maximum(mx, 1)
    core = (sat > 0.12) | (lum < 130)
    core = nd.binary_closing(core, iterations=2)
    core = nd.binary_fill_holes(core)
    lab, n = nd.label(core)
    sizes = nd.sum(core, lab, range(1, n + 1))
    core = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s > 2000])
    core = nd.binary_opening(core, iterations=1)
    solid = nd.binary_erosion(core, iterations=1)
    char = np.clip((nd.gaussian_filter(solid.astype(np.float32), 0.8) - 0.15) / 0.7, 0, 1)
    shadow = np.clip((247 - lum) / 120, 0, 1) * 0.55
    shadow = np.where(nd.binary_dilation(core, iterations=2), 0, shadow)
    alpha = np.maximum(char, shadow)
    colour = np.where(char[..., None] > 0.02, rgb, 60.0)
    return np.dstack([colour, alpha * 255]).clip(0, 255).astype(np.uint8)


def cut_black(rgb: np.ndarray) -> np.ndarray:
    """RGBA from a picture flattened onto solid black: the character is the saturated part (closed up, so the dark eyes and hat stitches stay), the light grey ground shadow becomes soft translucent grey."""
    rgb = rgb.astype(np.float32)
    mx, mn = rgb.max(axis=2), rgb.min(axis=2)
    lum = rgb.mean(axis=2)
    sat = (mx - mn) / np.maximum(mx, 1)
    core = (sat > 0.12) & (lum > 20)
    core = nd.binary_closing(core, iterations=3)
    core = nd.binary_fill_holes(core)
    lab, n = nd.label(core)
    sizes = nd.sum(core, lab, range(1, n + 1))
    core = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s > 2000])
    solid = nd.binary_erosion(core, iterations=1)
    char = np.clip((nd.gaussian_filter(solid.astype(np.float32), 0.8) - 0.15) / 0.7, 0, 1)
    shadow = np.clip(lum / 255, 0, 1) * 0.30
    shadow = np.where(nd.binary_dilation(core, iterations=2) | (mx < 14), 0, shadow)
    alpha = np.maximum(char, shadow)
    colour = np.where(char[..., None] > 0.02, rgb, 60.0)
    return np.dstack([colour, alpha * 255]).clip(0, 255).astype(np.uint8)


def load(path: Path) -> np.ndarray:
    a = np.array(Image.open(path).convert('RGBA'))
    if a[..., 3].min() < 250:  # already transparent: only soften a grey ground shadow that came opaque
        rgb = a[..., :3].astype(np.float32)
        lum = rgb.mean(axis=2)
        sat = (rgb.max(axis=2) - rgb.min(axis=2)) / np.maximum(rgb.max(axis=2), 1)
        grey = (sat < 0.08) & (lum > 90) & (lum < 240) & (a[..., 3] > 0)
        lab, n = nd.label(grey)
        sizes = nd.sum(grey, lab, range(1, n + 1))
        shadow = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s > 3000])
        a = a.copy()
        a[..., 3] = np.where(shadow, a[..., 3] * 0.3, a[..., 3]).astype(np.uint8)
        a[..., :3] = np.where(shadow[..., None], 60, a[..., :3])
        return a
    corner = a[:8, :8, :3].mean()
    return cut_black(a[..., :3]) if corner < 40 else cut_white(a[..., :3])


def bbox(a: np.ndarray):
    ys, xs = np.where(a[..., 3] > 128)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def main():
    friend, pairs = sys.argv[1], sys.argv[2:]
    for pair in pairs:
        pose, src = pair.split('=', 1)
        out = DOOR / f'{friend}-{pose}.webp'
        old = np.array(Image.open(Path(os.environ.get('OLD_DOOR', DOOR)) / out.name).convert('RGBA'))
        ox0, oy0, ox1, oy1 = bbox(old)
        new = load(Path(src))
        nx0, ny0, nx1, ny1 = bbox(new)
        s = (oy1 - oy0) / (ny1 - ny0)
        crop = Image.fromarray(new[ny0:ny1, nx0:nx1])
        crop = crop.resize((max(1, round(crop.width * s)), max(1, round(crop.height * s))), Image.LANCZOS)
        canvas = Image.new('RGBA', SIZE, (0, 0, 0, 0))
        x = round((ox0 + ox1) / 2 - crop.width / 2)
        y = oy1 - crop.height
        canvas.alpha_composite(crop, (x, y))
        canvas.save(out, quality=92, method=6)
        b = canvas.split()[3].point(lambda v: 255 if v > 128 else 0).getbbox()
        print(f'{friend}-{pose}: scale {s:.3f}, was {(ox0, oy0, ox1, oy1)}, now {b}')


if __name__ == '__main__':
    main()
