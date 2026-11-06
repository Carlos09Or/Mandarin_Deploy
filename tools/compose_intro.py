"""Prepares the intro pictures: a painting of the friends around a phone, and the real screen that goes on that phone.

The paintings come from the image agent with the phone screen left as one flat chroma-key green rectangle
(design/intro-brief/originals-v2). Hands, wings and the stand that are in front of the phone cover part of that green. For
each slide this:

  1. works out how green every pixel around the screen is (a soft matte: 1 on the screen, 0 on the bezel and on anything in
     front of it, in between on the edges), and where the screen sits, as shares of the picture, in
     app/src/data/intro-screens.json, so components/Intro.tsx can lay the screen and the red marks over it exactly;
  2. keys the capture into the painting, like a green-screen shot: where the matte is 1 the screen shows, where a hand covers
     it the hand stays, and a hand's soft edge keeps its own blend. The result is saved at the painting's full size to
     app/public/journey/intro, and is what shows under the next layer;
  3. saves the capture at full resolution to app/public/journey/intro/screens as an image with an alpha channel, cut by that
     same matte (rounded corners of the real phone, and holes where a hand is in front). The app draws it over the
     painting, so the screen is sharp however much the painting is enlarged, and the hands stay on top of it.

A capture must have the shape of the screen it goes in, or its text would be stretched: the script prints the window to take
each one in (width 390, the height shown). Run it again whenever a painting or a capture changes:

    python3 tools/compose_intro.py
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
PAINTINGS = ROOT / 'design/intro-brief/originals-v2'
CAPTURES = ROOT / 'design/presentacion/fotos'
OUT = ROOT / 'app/public/journey/intro'
SHARES = ROOT / 'app/src/data/intro-screens.json'

# slide file -> (painting, capture of the screen that is on the phone)
SLIDES = {
    'intro-2-map': ('v2-map', 'intro-map'),
    'intro-3-doors': ('v2-doors', 'intro-doors'),
    'intro-4-write': ('v2-write', 'intro-write'),
    'intro-5-review': ('v2-review', 'intro-review'),
    'intro-6-profile': ('v2-profile-group', 'intro-profile'),
}


def screen_core(rgb: np.ndarray) -> np.ndarray:
    """The biggest patch of flat pure green: the sure part of the screen."""
    r, g, b = (rgb[..., i].astype(int) for i in range(3))
    flat = (g > 200) & (r < 100) & (b < 100) & (g - r > 130)
    labels, n = ndimage.label(flat)
    if n == 0:
        raise SystemExit('no green screen found')
    return labels == np.argmax(ndimage.sum(flat, labels, range(1, n + 1))) + 1


def matte(rgb: np.ndarray, core: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """How much of each pixel is the green screen (0 to 1), and the green itself.

    Green stands out from every other colour in the picture by how much its green is above its red and blue: the dark
    bezel and the yellow, brown or grey of the friends score zero or less, and a pixel half bezel and half green scores half.
    Only the screen and a band around it are looked at, so a leaf elsewhere is never taken for screen."""
    r, g, b = (rgb[..., i].astype(float) for i in range(3))
    greenness = g - np.maximum(r, b)
    sure = np.median(greenness[core])
    green = np.array([np.median(rgb[..., i][core]) for i in range(3)])
    near = ndimage.binary_dilation(ndimage.binary_fill_holes(core), iterations=4)
    alpha = np.clip((greenness / sure - 0.04) / 0.92, 0, 1)
    alpha[~near] = 0
    return alpha, green


def sharpen(alpha: np.ndarray, gain: float = 2.2) -> np.ndarray:
    """Steepens a soft edge around its middle, so a matte enlarged from the painting keeps a clean line."""
    return np.clip((alpha - 0.5) * gain + 0.5, 0, 1)


def main() -> None:
    (OUT / 'screens').mkdir(parents=True, exist_ok=True)
    shares = {}
    for slide, (painting, capture) in SLIDES.items():
        art = Image.open(PAINTINGS / f'{painting}.webp').convert('RGB')
        pic = np.asarray(art)
        core = screen_core(pic)
        ys, xs = np.where(core)
        x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
        w, h = x1 - x0, y1 - y0
        shot = Image.open(CAPTURES / f'{capture}.jpg').convert('RGB')
        alpha, green = matte(pic, core)

        # 2. The capture keyed into the painting: C + alpha * (capture - green). On the screen that is the capture; on a
        #    hand's soft edge the hand's own colour is kept; elsewhere nothing changes.
        pad = 3
        box = (x0 - pad, y0 - pad, x1 + pad, y1 + pad)
        under = np.asarray(shot.resize((w + 2 * pad, h + 2 * pad), Image.LANCZOS)).astype(float)
        a = alpha[box[1]:box[3], box[0]:box[2], None]
        region = pic[box[1]:box[3], box[0]:box[2]].astype(float)
        keyed = np.clip(region + a * (under - green), 0, 255).astype('uint8')
        out = pic.copy()
        out[box[1]:box[3], box[0]:box[2]] = keyed
        Image.fromarray(out).save(OUT / f'{slide}.webp', quality=88, method=6)

        # 3. The sharp layer: the capture at its own size, with the matte (only where it is surely screen, so the rim, where
        #    a hand's edge is blended with the green, shows the keyed painting under it) enlarged to that size and given a gentle shadow along the edge.
        inner = np.clip((alpha[y0:y1, x0:x1] - 0.85) / 0.14, 0, 1)
        cw, ch = shot.size
        big = np.asarray(Image.fromarray((inner * 255).astype('uint8')).resize((cw, ch), Image.LANCZOS)).astype(float) / 255
        big = sharpen(big)
        inside = ndimage.distance_transform_edt(big > 0.5)
        shade = 1 - 0.22 * np.clip(1 - inside / 5, 0, 1)
        rgba = np.dstack([np.asarray(shot).astype(float) * shade[..., None], big * 255]).clip(0, 255).astype('uint8')
        Image.fromarray(rgba, 'RGBA').save(OUT / 'screens' / f'{slide}.webp', quality=92, alpha_quality=100, method=6)

        W, H = art.size
        shares[slide] = {'x': round(x0 / W, 4), 'y': round(y0 / H, 4), 'w': round(w / W, 4), 'h': round(h / H, 4)}
        hidden = 1 - float(inner.mean())
        want = round(390 / (w / h))
        have = shot.size[0] / shot.size[1]
        flag = '' if abs(have - w / h) < 0.01 else f'   <- capture shape {have:.3f}: retake it at 390x{want}'
        print(f'{slide:16} screen {w}x{h} ({w / W:.0%} of the width), {hidden:.1%} of it covered; capture window 390x{want}{flag}')

    # The welcome picture has no phone: only copied at its full size.
    Image.open(ROOT / 'design/intro-brief/originals/intro-1-welcome.webp').convert('RGB').save(
        OUT / 'intro-1-welcome.webp', quality=88, method=6
    )
    SHARES.write_text(json.dumps(shares, indent=1) + '\n')


if __name__ == '__main__':
    main()
