"""Cut the four flight sheets (design/assets/flight/sheets) into aligned sprites for the map.

Each sheet is a 3 x 2 grid: crouch, up, mid / down, bank, tuck. Every pose is cut out of its white
background, then all poses of one character are placed on the same square canvas with the backpack
at the centre and one shared scale, so swapping frames never makes the traveller jump or change size.
The standing `rest` sprite from the door page goes through the same steps (seven frames in all).

    python3 tools/cut_flight.py            # writes app/public/journey/flight/<friend>-<pose>.webp
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as nd

ROOT = Path(__file__).resolve().parent.parent
SHEETS = ROOT / 'design/assets/flight/sheets'
DOOR = ROOT / 'app/public/journey/door'
OUT = ROOT / 'app/public/journey/flight'
POSES = ['crouch', 'up', 'mid', 'down', 'bank', 'tuck']
FRIENDS = ['harpia', 'tucan', 'wawa', 'sloth']
# Size of the backpack in the output (square root of its area, in pixels), the same for every friend.
PACK_SIDE = 31
CANVAS = 480


def cutout(rgb: np.ndarray) -> np.ndarray:
    """RGBA from an image on flat white: the white connected to the border goes, edges are softened."""
    near = rgb.min(axis=2) > 236
    lab, n = nd.label(near)
    border = set(np.unique(np.r_[lab[0], lab[-1], lab[:, 0], lab[:, -1]])) - {0}
    bg = np.isin(lab, list(border))
    fg = ~bg
    fg = nd.binary_opening(fg, iterations=1)
    # Keep the pieces that matter (the character), drop specks.
    lab, n = nd.label(fg)
    sizes = nd.sum(fg, lab, range(1, n + 1))
    keep = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s > 400])
    fg = nd.binary_fill_holes(keep)
    # One pixel of fringe off, then a soft edge.
    core = nd.binary_erosion(fg, iterations=1)
    alpha = nd.gaussian_filter(core.astype(np.float32), 0.8)
    alpha = np.clip((alpha - 0.15) / 0.7, 0, 1)
    out = np.dstack([rgb, (alpha * 255).astype(np.uint8)])
    return out


def pack_mask(rgba: np.ndarray) -> np.ndarray:
    """The backpack: the biggest patch of dark reddish brown (feet, scarves and flowers are brighter)."""
    r, g, b, a = [rgba[..., i].astype(int) for i in range(4)]
    m = (a > 200) & (r > 90) & (r < 190) & (g < 70) & (b < 70) & (r - g > 60)
    m = nd.binary_opening(m, iterations=2)
    lab, n = nd.label(m)
    if not n:
        raise SystemExit('no backpack found')
    sizes = nd.sum(m, lab, range(1, n + 1))
    return lab == (int(np.argmax(sizes)) + 1)


def pack_stats(rgba: np.ndarray):
    m = pack_mask(rgba)
    ys, xs = np.where(m)
    return (xs.mean(), ys.mean()), np.sqrt(m.sum()), xs.max() - xs.min()


def split_poses(img: Image.Image) -> list[np.ndarray]:
    """The six poses of a sheet, each its own piece: wings reach past the grid cells, so cells are not cut by position."""
    rgba = cutout(np.array(img.convert('RGB')))
    lab, n = nd.label(rgba[..., 3] > 8)
    sizes = nd.sum(rgba[..., 3] > 8, lab, range(1, n + 1))
    ids = [i + 1 for i, a in enumerate(sizes) if a > 4000]
    if len(ids) != 6:
        raise SystemExit(f'expected 6 poses, found {len(ids)} (areas {sorted(sizes)[-8:]})')
    cy = {i: nd.center_of_mass(lab == i) for i in ids}
    h, w = lab.shape
    # Reading order: top row left to right, then bottom row.
    ids.sort(key=lambda i: (cy[i][0] > h / 2, cy[i][1]))
    out = []
    for i in ids:
        piece = rgba.copy()
        piece[..., 3] = np.where(lab == i, piece[..., 3], 0)
        ys, xs = np.where(lab == i)
        out.append(piece[ys.min() : ys.max() + 1, xs.min() : xs.max() + 1])
    return out


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for f in FRIENDS:
        sheet = Image.open(SHEETS / f'{f}-flight-sheet.webp').convert('RGB')
        frames = dict(zip(POSES, split_poses(sheet)))
        # The door page's standing pose joins the set: its alpha is already clean.
        frames['rest'] = np.array(Image.open(DOOR / f'{f}-rest.webp').convert('RGBA'))
        stats = {p: pack_stats(a) for p, a in frames.items()}
        # One scale per friend: the backpack of the four main poses ends up PACK_W wide on average.
        ref = np.median([stats[p][1] for p in ['crouch', 'up', 'mid', 'down']])
        # Square root of the area is the backpack's size independent of perspective.
        pack_side = ref
        scale = PACK_SIDE / pack_side
        # rest is a different view (straight back), match its backpack to the crouch one.
        rest_scale = scale * stats['crouch'][1] / stats['rest'][1]
        for p, a in frames.items():
            (cx, cy), _, _ = stats[p]
            s = rest_scale if p == 'rest' else scale
            im = Image.fromarray(a)
            im = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)
            canvas = Image.new('RGBA', (CANVAS, CANVAS), (0, 0, 0, 0))
            ox = round(CANVAS / 2 - cx * s)
            oy = round(CANVAS / 2 - cy * s)
            canvas.alpha_composite(im, (max(0, ox), max(0, oy))) if ox >= 0 and oy >= 0 else canvas.paste(im, (ox, oy), im)
            bbox = canvas.getbbox()
            if bbox[0] <= 0 or bbox[1] <= 0 or bbox[2] >= CANVAS or bbox[3] >= CANVAS:
                print(f'WARNING {f}-{p} touches the canvas edge {bbox}', file=sys.stderr)
            canvas.save(OUT / f'{f}-{p}.webp', quality=92, method=6)
        print(f, 'scale', round(scale, 3), 'rest scale', round(rest_scale, 3))


if __name__ == '__main__':
    main()
