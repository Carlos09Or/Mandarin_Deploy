"""Cut the high-detail close-ups (patches/*-detail-*-hd.png) into overlay pictures for the map.

Usage: python3 tools/build_map_details.py

The whole map is 6552 px wide and the image agent gives at most 1254 px per picture, so a close-up repainted at 1254 px has about 2x the
pixels of the map under it. Pasted into the map it would be shrunk back; instead each close-up becomes a small picture with a soft edge
that the app lays over the map where it belongs (and loads only when that part of the map is near the screen).
Each close-up is first lined up with the crop it was made from (the agent drifts a little), then limited to a hand-drawn area around
the buildings (minus the sea, whose waves are painted differently), so the hills and water around it stay those of the map.
Writes app/public/journey/map/d-<id>.webp and app/src/data/map-details.json (placement in map pixels, map = 6552 x 3688).
"""
import json, os
import cv2
import numpy as np
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
P = os.path.join(ROOT, 'design', 'map-quality-brief', 'patches') + '/'
OUT = os.path.join(ROOT, 'app', 'public', 'journey', 'map') + '/'
# id: (window x, y, size in map px, area around the buildings in window px)
DETAILS = {
    # the hill above the skyline (first, so the skyline close-ups lie over it)
    'C': (3560, 640, 900, [(0, 115), (655, 115), (760, 130), (800, 215), (745, 285), (690, 325), (560, 345), (430, 392), (300, 396), (212, 390), (200, 305), (110, 300), (0, 300)]),
    'A': (3790, 770, 640, [(45, 310), (55, 240), (120, 225), (190, 160), (300, 150), (335, 215), (360, 260), (450, 285), (500, 300),
                           (530, 330), (540, 400), (640, 390), (640, 500), (540, 500), (45, 500)]),
    'B': (4290, 1010, 480, [(70, 200), (130, 115), (240, 100), (330, 130), (375, 190), (400, 250), (420, 320), (300, 340), (150, 320), (70, 260)]),
}
# the hills are teal-green: for the hill the sea is only the clearly blue (the others also count cyan shallows)
SEA_HUE = {'C': 100}


def gray(img):
    return cv2.GaussianBlur(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY), (0, 0), 2).astype(np.float32) / 255


def main():
    meta = []
    for k, (x0, y0, s, poly) in DETAILS.items():
        orig = cv2.imread(f'{P}skyline-detail-{k}.png')
        hd = cv2.imread(f'{P}skyline-detail-{k}-hd.png')
        n = hd.shape[0]
        k_up = n / s
        small = cv2.resize(hd, (s, s), interpolation=cv2.INTER_AREA)
        w = np.eye(2, 3, dtype=np.float32)
        cc, w = cv2.findTransformECC(gray(orig), gray(small), w, cv2.MOTION_AFFINE, (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 200, 1e-6), None, 5)
        print(k, 'aligned, correlation %.3f' % cc)
        w_hd = w.copy()
        w_hd[:, 2] *= k_up  # the translation is measured at the crop's scale
        hd = cv2.warpAffine(hd, w_hd, (n, n), flags=cv2.INTER_CUBIC | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REFLECT)

        mask = np.zeros((s, s), np.uint8)
        cv2.fillPoly(mask, [np.array(poly, np.int32)], 255)
        hsv = cv2.cvtColor(orig, cv2.COLOR_BGR2HSV)
        sea = ((hsv[:, :, 0] > SEA_HUE.get(k, 85)) & (hsv[:, :, 0] < 130) & (hsv[:, :, 1] > 90)).astype(np.uint8) * 255
        sea = cv2.dilate(sea, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (13, 13)))
        mask = cv2.subtract(mask, sea)
        mask = cv2.GaussianBlur(mask, (0, 0), 9).astype(np.float32) / 255
        mask = np.clip((mask - 0.15) / 0.7, 0, 1)
        ys, xs = np.where(mask > 0.02)
        bx0, bx1, by0, by1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
        a = cv2.resize(mask, (n, n), interpolation=cv2.INTER_CUBIC)
        sx0, sx1, sy0, sy1 = (int(round(v * k_up)) for v in (bx0, bx1, by0, by1))
        rgba = np.dstack([cv2.cvtColor(hd, cv2.COLOR_BGR2RGB)[sy0:sy1, sx0:sx1], (np.clip(a, 0, 1) * 255).astype(np.uint8)[sy0:sy1, sx0:sx1]])
        path = f'{OUT}d-{k}.webp'
        Image.fromarray(rgba).save(path, 'WEBP', quality=88, method=5)
        print(k, rgba.shape[1], 'x', rgba.shape[0], 'px,', os.path.getsize(path) // 1024, 'KB')
        meta.append({'id': k, 'x': x0 + int(bx0), 'y': y0 + int(by0), 'w': int(bx1 - bx0), 'h': int(by1 - by0)})
    json.dump({'mapW': 6552, 'mapH': 3688, 'details': meta}, open(os.path.join(ROOT, 'app', 'src', 'data', 'map-details.json'), 'w'), indent=1)
    print(meta)


if __name__ == '__main__':
    main()
