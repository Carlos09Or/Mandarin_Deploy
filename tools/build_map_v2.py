"""Turn the assembled hi-res map into what the app loads.

Usage: python3 tools/build_map_v2.py [assembled.png]

Reads design/map-quality-brief/hires-crops-640/_map-assembled.png (tools/assemble_map.py) and writes into app/public/journey:
  map/lo.webp            the whole map at 1672 px, shown at once
  map/t-<row>-<col>.webp the map at full size (6552 x 3688) cut into 6 x 4 tiles; the app only loads the ones in view
  map-fog-v2.webp        the fog layer (3344 px) and map-fog-v2-lo.webp (1672 px): the old cloud bank over the land (inside the
                         provinces), the new map everywhere else, so the sea, the islands and the coast match the new picture
"""
import json, os, re, sys
import cv2
import numpy as np
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
PUB = os.path.join(ROOT, 'app', 'public', 'journey')
SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'design', 'map-quality-brief', 'hires-crops-640', '_map-assembled.png')
VB = dict(x=-40, y=-89, w=1080, h=607.5)
ROWS, COLS = 4, 6
FOG_SHIFT_UNITS = 1.3  # the old fog was drawn 1.3 units left of the map (MapHome.tsx); the new one is built aligned


def save(img_bgr, path, q):
    Image.fromarray(cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)).save(path, 'WEBP', quality=q, method=5)
    print(f'{os.path.relpath(path, ROOT)}  {os.path.getsize(path) // 1024} KB')


def land_mask(w, h):
    """The provinces as the app's fog mask sees them: each region path, grown by half of its 7-unit stroke."""
    regions = json.load(open(os.path.join(ROOT, 'app', 'src', 'data', 'map-provinces.json')))['regions']
    m = np.zeros((h, w), np.uint8)
    for r in regions:
        for sub in re.split(r'(?=M)', r['d']):  # a region can be several islands: one polygon each
            nums = [float(n) for n in re.findall(r'-?\d+\.?\d*', sub)]
            if len(nums) < 6:
                continue
            pts = np.array([[(x - VB['x']) / VB['w'] * w, (y - VB['y']) / VB['h'] * h] for x, y in zip(nums[::2], nums[1::2])], np.int32)
            cv2.fillPoly(m, [pts], 255)
    return m


def grown(m, units):
    k = int(round(units / VB['w'] * m.shape[1]))
    return cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k * 2 + 1,) * 2))


def main():
    big = cv2.imread(SRC)
    H, W = big.shape[:2]
    assert (H % ROWS, W % COLS) == (0, 0), (W, H)
    os.makedirs(os.path.join(PUB, 'map'), exist_ok=True)
    save(cv2.resize(big, (1672, 941), interpolation=cv2.INTER_AREA), os.path.join(PUB, 'map', 'lo.webp'), 82)
    th, tw = H // ROWS, W // COLS
    total = 0
    for r in range(ROWS):
        for c in range(COLS):
            p = os.path.join(PUB, 'map', f't-{r}-{c}.webp')
            save(big[r * th:(r + 1) * th, c * tw:(c + 1) * tw], p, 80)
            total += os.path.getsize(p)
    print(f'tiles total {total // 1024 // 1024} MB')

    # fog: old cloud bank (shifted into the map's frame) over the land, new map elsewhere
    new = cv2.resize(big, (3344, 1882), interpolation=cv2.INTER_AREA).astype(np.float32)
    old = np.array(Image.open(os.path.join(PUB, 'map-fog-clean.webp')).convert('RGB'))[:, :, ::-1].astype(np.float32)
    dx = FOG_SHIFT_UNITS / VB['w'] * 3344
    old = cv2.warpAffine(old, np.float32([[1, 0, dx], [0, 1, 0]]), (3344, 1882), borderMode=cv2.BORDER_REPLICATE)
    # Where the old fog is cloud: it differs a lot from the old map there. Looked for only near the provinces, since the
    # simplified province outlines miss a thin strip of coast that the clouds cover.
    old_map = np.array(Image.open(os.path.join(PUB, 'map-illustrated-clean.webp')).convert('RGB'))[:, :, ::-1].astype(np.float32)
    diff = cv2.GaussianBlur(np.abs(old - old_map).mean(2), (0, 0), 4)
    cloud = np.clip((diff - 22) / 22, 0, 1) * (cv2.GaussianBlur(grown(land_mask(3344, 1882), 9), (0, 0), 5) / 255)
    strict = cv2.GaussianBlur(grown(land_mask(3344, 1882), 3.5), (0, 0), 3) / 255
    a = np.maximum(strict, cv2.GaussianBlur(cloud, (0, 0), 3))[:, :, None]
    fog = np.clip(old * a + new * (1 - a), 0, 255).astype(np.uint8)
    save(fog, os.path.join(PUB, 'map-fog-v2.webp'), 80)
    save(cv2.resize(fog, (1672, 941), interpolation=cv2.INTER_AREA), os.path.join(PUB, 'map-fog-v2-lo.webp'), 80)


if __name__ == '__main__':
    main()
