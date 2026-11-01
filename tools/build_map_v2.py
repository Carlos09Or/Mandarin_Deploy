"""Turn the assembled hi-res map into what the app loads.

Usage: python3 tools/build_map_v2.py [assembled.png]

Reads design/map-quality-brief/hires-crops-640/_map-assembled.png (tools/assemble_map.py) and writes into app/public/journey:
  map/lo.webp            the whole map at 1672 px, shown at once
  map/t-<row>-<col>.webp the map at full size (6552 x 3688) cut into 6 x 4 tiles; the app only loads the ones in view
  map-fog-v2.webp        the fog layer (3344 px) and map-fog-v2-lo.webp (1672 px): only the cloud bank over the land (the old fog picture),
                         transparent everywhere else, so the sea, the islands and the coast show the sharp tiles underneath
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
FOG_SHIFT_UNITS = 1.3  # the old fog picture was drawn 1.3 units left of the map (MapHome.tsx), so its content sits 1.3 units to the right of the map's


def save(img_bgr, path, q):
    Image.fromarray(cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)).save(path, 'WEBP', quality=q, method=5)
    print(f'{os.path.relpath(path, ROOT)}  {os.path.getsize(path) // 1024} KB')


def save_rgba(img_bgra, path, q):
    rgba = np.dstack([cv2.cvtColor(img_bgra[:, :, :3], cv2.COLOR_BGR2RGB), img_bgra[:, :, 3]])
    Image.fromarray(rgba).save(path, 'WEBP', quality=q, method=5, alpha_quality=90)
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
    old = cv2.warpAffine(old, np.float32([[1, 0, -dx], [0, 1, 0]]), (3344, 1882), borderMode=cv2.BORDER_REPLICATE)
    # The fog layer is only the cloud bank: cream-white, hardly coloured. The old fog picture also holds the old sea and coast
    # (strongly coloured), which must not be kept: the sharp tiles show through there. Looked for only near the provinces.
    hsv = cv2.cvtColor(np.clip(old, 0, 255).astype(np.uint8), cv2.COLOR_BGR2HSV).astype(np.float32)
    sat, val = hsv[:, :, 1] / 255, hsv[:, :, 2] / 255
    cloud = np.clip((0.50 - sat) / 0.22, 0, 1) * np.clip((val - 0.55) / 0.2, 0, 1)
    cloud = cv2.GaussianBlur(cloud, (0, 0), 2.5)
    near_land = cv2.GaussianBlur(grown(land_mask(3344, 1882), 4), (0, 0), 3) / 255
    # Inside the provinces the bank must have no holes (patches of terrain show through it, coloured): the land, shrunk a little from its coast
    # so islands and the coast stay free, is fully covered.
    core = cv2.erode(land_mask(3344, 1882), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15)))
    core = cv2.GaussianBlur(core, (0, 0), 5) / 255
    a = np.maximum(cloud * near_land, core)[:, :, None]
    alpha = (np.clip(a[:, :, 0], 0, 1) * 255).astype(np.uint8)
    fog = np.dstack([np.clip(old, 0, 255).astype(np.uint8), alpha])  # BGRA
    save_rgba(fog, os.path.join(PUB, 'map-fog-v2.webp'), 80)
    save_rgba(cv2.resize(fog, (1672, 941), interpolation=cv2.INTER_AREA), os.path.join(PUB, 'map-fog-v2-lo.webp'), 80)


if __name__ == '__main__':
    main()
