"""Cut the night door sheets (design/assets/doors-night) into the pictures the door page swaps in after dark.

Each door sheet holds the closed, half open and wide open door side by side, the paths sheet the four paths in a
2 x 2 grid, all on flat white. Every picture is cut out of the white, then placed on the canvas of its day twin
(app/public/journey/door) so that the silhouettes sit on top of each other: the plaque, the doorstep and the path
land in the same place, and the page can swap day for night without moving anything.

    python3 tools/cut_doors_night.py       # writes app/public/journey/door/<name>-night.webp
"""
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as nd

ROOT = Path(__file__).resolve().parent.parent
SHEETS = ROOT / 'design/assets/doors-night'
DOOR = ROOT / 'app/public/journey/door'
STATES = ['closed', 'half', 'open']
DOORS = {
    '01-airport': 'door-1-airport', '02-seaside': 'door-2-seaside', '03-oldtown': 'door-3-oldtown',
    '04-chinatown': 'door-4-chinatown', '05-causeway': 'door-5-causeway', '06-ruins': 'door-6-ruins',
    '07-canal': 'door-7-canal', '08-generic': 'door-8-generic',
}
PATHS = ['cobble', 'sand', 'stones', 'boardwalk']  # top left, top right, bottom left, bottom right


def cutout(rgb: np.ndarray) -> np.ndarray:
    """RGBA from a picture on flat white: the white connected to the border goes, the edge is softened and the
    faint ground shadow around the picture stays as a see-through halo."""
    dist = 255 - rgb.min(axis=2).astype(np.float32)  # how far a pixel is from white
    near = dist < 19
    lab, _ = nd.label(near)
    border = set(np.unique(np.r_[lab[0], lab[-1], lab[:, 0], lab[:, -1]])) - {0}
    fg = ~np.isin(lab, list(border))
    fg = nd.binary_opening(fg, iterations=1)
    lab, n = nd.label(fg)
    sizes = nd.sum(fg, lab, range(1, n + 1))
    fg = nd.binary_fill_holes(np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s > 400]))
    core = nd.binary_erosion(fg, iterations=1)
    alpha = np.clip((nd.gaussian_filter(core.astype(np.float32), 0.8) - 0.15) / 0.7, 0, 1)
    # Past the edge, whatever is not white fades out as a halo: colour over white, un-mixed.
    ring = nd.binary_dilation(fg, iterations=14) & ~core
    halo = np.clip((dist - 10) / 120, 0, 0.14) * ring
    halo = nd.gaussian_filter(halo, 2.0) * ring
    a = np.maximum(alpha, halo)
    safe = np.maximum(a, 1e-3)[..., None]
    col = np.where(a[..., None] > 0.99, rgb, (rgb - 255 * (1 - safe)) / safe)
    out = np.dstack([np.clip(col, 0, 255), a * 255]).astype(np.uint8)
    out[a < 0.01] = 0
    return out


def box(rgba: np.ndarray, cut: float = 0.5) -> tuple[int, int, int, int]:
    ys, xs = np.nonzero(rgba[..., 3] > 255 * cut)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def fit(night: np.ndarray, day: Image.Image) -> Image.Image:
    """The night picture on the day picture's canvas, its silhouette box laid over the day one's."""
    nx0, ny0, nx1, ny1 = box(night)
    dx0, dy0, dx1, dy1 = box(np.array(day))
    s = ((dx1 - dx0) / (nx1 - nx0) + (dy1 - dy0) / (ny1 - ny0)) / 2
    pic = Image.fromarray(night).crop((nx0, ny0, nx1, ny1))
    pic = pic.resize((round(pic.width * s), round(pic.height * s)), Image.LANCZOS)
    canvas = Image.new('RGBA', day.size, (0, 0, 0, 0))
    canvas.alpha_composite(pic, (round((dx0 + dx1 - pic.width) / 2), round((dy0 + dy1 - pic.height) / 2)))
    return canvas


def runs(mask: np.ndarray, count: int) -> list[tuple[int, int]]:
    """The `count` widest stretches of columns that hold anything, as (start, end)."""
    cols = np.nonzero(mask.any(axis=0))[0]
    cuts = np.nonzero(np.diff(cols) > 12)[0]
    spans = [(cols[a], cols[b] + 1) for a, b in zip(np.r_[0, cuts + 1], np.r_[cuts, len(cols) - 1])]
    spans = sorted(sorted(spans, key=lambda s: s[0] - s[1])[:count])
    if len(spans) != count:
        raise SystemExit(f'found {len(spans)} pictures, wanted {count}')
    return spans


def solid(rgb: np.ndarray) -> np.ndarray:
    dist = 255 - rgb.min(axis=2)
    lab, _ = nd.label(dist < 19)
    border = set(np.unique(np.r_[lab[0], lab[-1], lab[:, 0], lab[:, -1]])) - {0}
    return nd.binary_opening(~np.isin(lab, list(border)), iterations=3)


def split_doors(sheet: Path) -> list[np.ndarray]:
    rgb = np.array(Image.open(sheet).convert('RGB'))
    spans = runs(solid(rgb), 3)
    # Cut halfway through the gaps, so one door's halo never lands on its neighbour.
    edges = [0, *[(a[1] + b[0]) // 2 for a, b in zip(spans, spans[1:])], rgb.shape[1]]
    return [cutout(rgb[:, edges[i]:edges[i + 1]]) for i in range(3)]


def main() -> None:
    for key, name in DOORS.items():
        for st, pic in zip(STATES, split_doors(next(SHEETS.glob(f'{key}-NIGHT.*')))):
            day = Image.open(DOOR / f'{name}-{st}.webp').convert('RGBA')
            fit(pic, day).save(DOOR / f'{name}-{st}-night.webp', quality=88, method=6)
            print(f'{name}-{st}-night')

    rgb = np.array(Image.open(next(SHEETS.glob('09-paths-NIGHT.*'))).convert('RGB'))
    h, w = rgb.shape[:2]
    for i, name in enumerate(PATHS):
        y, x = (i // 2) * h // 2, (i % 2) * w // 2
        quad = rgb[y:y + h // 2, x:x + w // 2]
        day = Image.open(DOOR / f'path-{name}.webp').convert('RGBA')
        fit(cutout(quad), day).save(DOOR / f'path-{name}-night.webp', quality=88, method=6)
        print(f'path-{name}-night')


if __name__ == '__main__':
    main()
