"""Cut the harpy eagle's walking sheet (3 x 2 poses on white) into the door-page sprites.

Order on the sheet: rest, step-l, step-r / look, jump, search. The eagle's body is pale grey, close to
the white page and to its own ground shadow, so the character is everything not connected to the border
of its cell, and the shadow is the grey below the talons, turned into soft translucent black. Each pose is
then scaled and placed like the sprite it replaces (see cut_door_friend.py).

    OLD_DOOR=<folder with the previous sprites> python3 tools/cut_eagle_walk.py design/assets/loading/aguila-caminata-hoja.webp
"""
import os
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as nd

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
from cut_door_friend import DOOR, SIZE, bbox  # noqa: E402

POSES = ['rest', 'step-l', 'step-r', 'look', 'jump', 'search']
CLOSE = {'look': 26}  # the face in this pose touches the page white along a longer edge


def disk(r):
    y, x = np.ogrid[-r : r + 1, -r : r + 1]
    return x * x + y * y <= r * r


def cut_cell(rgb: np.ndarray, close_r: int = 7) -> np.ndarray:
    """close_r seals the white of the face, which has no outline and can leak into the page white, inside a window around the cap's lower corner."""
    rgb = rgb.astype(np.float32)
    mx, mn = rgb.max(axis=2), rgb.min(axis=2)
    lum = rgb.mean(axis=2)
    sat = (mx - mn) / np.maximum(mx, 1)
    near = mn > 236
    lab, _ = nd.label(near)
    border = set(np.unique(np.r_[lab[0], lab[-1], lab[:, 0], lab[:, -1]])) - {0}
    fg = ~np.isin(lab, list(border))
    fg = nd.binary_opening(fg, iterations=1)
    lab, n = nd.label(fg)
    sizes = nd.sum(fg, lab, range(1, n + 1))
    fg = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s > 2000])
    fg = nd.binary_fill_holes(fg)
    navy = fg & (rgb[..., 2] > 70) & (rgb[..., 2] - rgb[..., 0] > 30) & (rgb[..., 0] < 80)
    ys, xs = np.where(navy)
    window = np.zeros(fg.shape, bool)
    window[max(0, ys.max() - 30) : ys.max() + 170, xs.min() : xs.max() + 120] = True
    pad = close_r + 2
    padded = np.pad(fg, pad, constant_values=False)
    closed = nd.binary_closing(padded, structure=disk(close_r))[pad:-pad, pad:-pad]
    fg = nd.binary_fill_holes(fg | (closed & window))
    yellow = (rgb[..., 0] > 200) & (rgb[..., 1] > 150) & (rgb[..., 2] < 90) & fg
    ybot = np.where(yellow.any(axis=1))[0].max()
    rows = np.arange(rgb.shape[0])[:, None]
    shadow = fg & (rows > ybot - 22) & (sat < 0.10) & (lum > 150)
    # the feet's own pale pixels are not shadow: only what is not enclosed by the character higher up
    char = fg & ~shadow
    char = nd.binary_closing(char, iterations=2) | (fg & ~shadow)
    core = nd.binary_erosion(char, iterations=1)
    calpha = np.clip((nd.gaussian_filter(core.astype(np.float32), 0.8) - 0.15) / 0.7, 0, 1)
    salpha = np.clip((247 - lum) / 120, 0, 1) * 0.55
    salpha = np.where(shadow, salpha, 0)
    alpha = np.maximum(calpha, salpha)
    colour = np.where(calpha[..., None] > 0.02, rgb, 60.0)
    return np.dstack([colour, alpha * 255]).clip(0, 255).astype(np.uint8)


def main():
    sheet = np.array(Image.open(sys.argv[1]).convert('RGB'))
    h, w = sheet.shape[:2]
    old_dir = Path(os.environ.get('OLD_DOOR', DOOR))
    for i, pose in enumerate(POSES):
        r, c = divmod(i, 3)
        cell = sheet[r * h // 2 : (r + 1) * h // 2, c * w // 3 : (c + 1) * w // 3]
        new = cut_cell(cell, CLOSE.get(pose, 7))
        old = np.array(Image.open(old_dir / f'harpia-{pose}.webp').convert('RGBA'))
        ox0, oy0, ox1, oy1 = bbox(old)
        nx0, ny0, nx1, ny1 = bbox(new)
        s = (oy1 - oy0) / (ny1 - ny0)
        crop = Image.fromarray(new[ny0:ny1, nx0:nx1])
        crop = crop.resize((max(1, round(crop.width * s)), max(1, round(crop.height * s))), Image.LANCZOS)
        canvas = Image.new('RGBA', SIZE, (0, 0, 0, 0))
        canvas.alpha_composite(crop, (round((ox0 + ox1) / 2 - crop.width / 2), oy1 - crop.height))
        canvas.save(DOOR / f'harpia-{pose}.webp', quality=92, method=6)
        b = canvas.split()[3].point(lambda v: 255 if v > 128 else 0).getbbox()
        print(f'harpia-{pose}: scale {s:.3f}, was {(ox0, oy0, ox1, oy1)}, now {b}')


if __name__ == '__main__':
    main()
