"""Cuts the pictures of the language screen out of what the image agent sent (design/language-brief/originals).

  lang-bg      the painted bay at sunrise (kept whole)
  lang-wawa    Wāwa waving, cut from his white background
  lang-flags   two round felt medallions side by side, cut into lang-es and lang-en

White and the soft grey of a shadow count as background when they touch the edge of the picture, so the white of Wāwa's eyes,
which is enclosed, is kept. Shadows are not kept: the app draws its own under each picture.

    python3 tools/cut_language_art.py
"""
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'design/language-brief/originals'
OUT = ROOT / 'app/public/journey/language'


def foreground(rgb: np.ndarray) -> np.ndarray:
    """True for everything that is not the white or light grey background reaching the edge of the picture."""
    a = rgb.astype(int)
    mx, mn = a.max(axis=2), a.min(axis=2)
    sat = (mx - mn) / np.maximum(mx, 1)
    light = (sat < 0.14) & (a.mean(axis=2) > 130)
    labels, _ = ndimage.label(light)
    edge = set(labels[0]) | set(labels[-1]) | set(labels[:, 0]) | set(labels[:, -1])
    edge.discard(0)
    return ~np.isin(labels, list(edge))


def soft_alpha(fg: np.ndarray) -> np.ndarray:
    """One pixel is shaved off the edge (it is blended with the white) and the edge is softened a little."""
    return np.clip(ndimage.gaussian_filter(ndimage.binary_erosion(fg, iterations=1).astype(float), 0.8), 0, 1)


def cut(img: Image.Image, fg: np.ndarray, margin: int = 6) -> Image.Image:
    ys, xs = np.where(fg)
    x0, x1, y0, y1 = max(xs.min() - margin, 0), xs.max() + margin, max(ys.min() - margin, 0), ys.max() + margin
    rgba = np.dstack([np.asarray(img.convert('RGB')), (soft_alpha(fg) * 255).astype('uint8')])
    return Image.fromarray(rgba).crop((x0, y0, x1, y1))


def square(img: Image.Image, size: int) -> Image.Image:
    side = max(img.size)
    canvas = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    canvas.paste(img, ((side - img.width) // 2, (side - img.height) // 2))
    return canvas.resize((size, size), Image.LANCZOS)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    Image.open(SRC / 'lang-bg.webp').convert('RGB').save(OUT / 'lang-bg.webp', quality=86, method=6)

    wawa = Image.open(SRC / 'lang-wawa.webp').convert('RGB')
    cut(wawa, foreground(np.asarray(wawa))).save(OUT / 'lang-wawa.webp', quality=92, alpha_quality=100, method=6)

    flags = Image.open(SRC / 'lang-flags.webp').convert('RGB')
    fg = foreground(np.asarray(flags))
    labels, n = ndimage.label(fg)
    sizes = ndimage.sum(fg, labels, range(1, n + 1))
    two = sorted(np.argsort(sizes)[-2:] + 1, key=lambda i: np.where(labels == i)[1].min())  # left one first
    for name, i in zip(('lang-es', 'lang-en'), two):
        medal = ndimage.binary_fill_holes(labels == i)
        square(cut(flags, medal), 640).save(OUT / f'{name}.webp', quality=92, alpha_quality=100, method=6)
    print('wrote', ', '.join(sorted(p.name for p in OUT.iterdir())))


if __name__ == '__main__':
    main()
