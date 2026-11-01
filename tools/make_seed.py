"""Prepare the input image for one map crop of the hi-res repaint.

Usage: python3 tools/make_seed.py r2c2

Takes design/map-quality-brief/hires-crops-640/crop-<id>.png (the original crop, enlarged to 1254 px) and, along every
edge it shares with a neighbour that is ALREADY repainted (hd-<id>.png), pastes that neighbour's finished strip, first
aligned to the original geometry. The image agent then continues the painting from those strips, so neighbouring crops
join without ghosting. Writes seed-<id>.png next to the crops.
"""
import os, sys
import cv2
import numpy as np

D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'design', 'map-quality-brief', 'hires-crops-640') + '/'
N, SIDE = 1254, 640
S = N / SIDE
X = [0, 541, 1082, 1622, 2163, 2704]  # crop origins in the 3344 x 1882 map
Y = [0, 414, 828, 1242]
FEATHER = 16


def origin(i):
    return Y[int(i[1]) - 1], X[int(i[3]) - 1]


def water(img):
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    h = hsv[:, :, 0]
    return cv2.GaussianBlur(((h > 85) & (h < 130) & (hsv[:, :, 1] > 90)).astype(np.float32), (0, 0), 4)


def aligned(i):
    """Repainted crop i, warped to the geometry of the original crop (the agent drifts a little)."""
    hd = cv2.imread(f'{D}hd-{i}.png')
    hd = cv2.resize(hd, (N, N), interpolation=cv2.INTER_AREA) if hd.shape[0] != N else hd
    o = cv2.resize(cv2.imread(f'{D}crop-{i}.png'), (N, N), interpolation=cv2.INTER_LANCZOS4)
    flow = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM).calc(
        (water(o) * 255).astype(np.uint8), (water(hd) * 255).astype(np.uint8), None)
    flow = cv2.GaussianBlur(flow, (0, 0), 40)
    gx, gy = np.meshgrid(np.arange(N), np.arange(N))
    return cv2.remap(hd, (gx + flow[:, :, 0]).astype(np.float32), (gy + flow[:, :, 1]).astype(np.float32),
                     cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)


def main(i):
    seed = cv2.resize(cv2.imread(f'{D}crop-{i}.png'), (N, N), interpolation=cv2.INTER_LANCZOS4).astype(np.float32)
    y0, x0 = origin(i)
    used = []
    for p in sorted(os.listdir(D)):
        if not (p.startswith('hd-r') and p.endswith('.png')):
            continue
        j = p[3:7]
        if j == i:
            continue
        y1, x1 = origin(j)
        dy, dx = y1 - y0, x1 - x0
        if (dx and dy) or abs(dx) >= SIDE or abs(dy) >= SIDE:
            continue
        nb = aligned(j).astype(np.float32)
        ov = round((SIDE - abs(dx or dy)) * S)
        mask = np.zeros((N, N), np.float32)
        if dx > 0:    # neighbour on the right: its left strip lands on our right edge
            seed[:, N - ov:] = nb[:, :ov]; mask[:, N - ov:] = 1
        elif dx < 0:  # on the left
            seed[:, :ov] = nb[:, N - ov:]; mask[:, :ov] = 1
        elif dy > 0:  # below
            seed[N - ov:] = nb[:ov]; mask[N - ov:] = 1
        else:         # above
            seed[:ov] = nb[N - ov:]; mask[:ov] = 1
        used.append(f'{j} ({"right" if dx > 0 else "left" if dx < 0 else "below" if dy > 0 else "above"})')
    if not used:
        sys.exit(f'No finished neighbour for {i}: attach crop-{i}.png and use a reference image instead.')
    cv2.imwrite(f'{D}seed-{i}.png', np.clip(seed, 0, 255).astype(np.uint8))
    print(f'seed-{i}.png written with strips from: {", ".join(used)}')


if __name__ == '__main__':
    main(sys.argv[1])
