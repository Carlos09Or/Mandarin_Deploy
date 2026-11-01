"""Join the 24 repainted crops (hires-crops-640/hd-*.png) into one hi-res map.

Usage: python3 tools/assemble_map.py [output.png]

Each repainted crop is first warped back onto the geometry of its original crop (the agent drifts a little), so the
coastline stays where the code masks expect it. Crops overlap, so each one is then evened out in colour against its
neighbours and blended with a narrow transition along the line where two crops are equally far from their edges.
The map is written at 1254/640 times the original 3344 x 1882 (6552 x 3688).
"""
import os, sys
import cv2
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
D = os.path.join(HERE, '..', 'design', 'map-quality-brief', 'hires-crops-640') + '/'
N, SIDE = 1254, 640
S = N / SIDE
X = [0, 541, 1082, 1622, 2163, 2704]
Y = [0, 414, 828, 1242]
W, H = round(3344 * S), round(1882 * S)
TAU = 7.0  # px: how sharply the blend flips between two crops


def water(img):
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    h = hsv[:, :, 0]
    return cv2.GaussianBlur(((h > 85) & (h < 130) & (hsv[:, :, 1] > 90)).astype(np.float32), (0, 0), 4)


def aligned(i):
    hd = cv2.imread(f'{D}hd-{i}.png')
    if hd.shape[0] != N:
        hd = cv2.resize(hd, (N, N), interpolation=cv2.INTER_AREA)
    o = cv2.resize(cv2.imread(f'{D}crop-{i}.png'), (N, N), interpolation=cv2.INTER_LANCZOS4)
    flow = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM).calc(
        (water(o) * 255).astype(np.uint8), (water(hd) * 255).astype(np.uint8), None)
    flow = cv2.GaussianBlur(flow, (0, 0), 40)
    gx, gy = np.meshgrid(np.arange(N), np.arange(N))
    return cv2.remap(hd, (gx + flow[:, :, 0]).astype(np.float32), (gy + flow[:, :, 1]).astype(np.float32),
                     cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)


def main(out):
    ids = [f'r{r}c{c}' for r in range(1, 5) for c in range(1, 7)]
    pos = {i: (round(Y[int(i[1]) - 1] * S), round(X[int(i[3]) - 1] * S)) for i in ids}
    crops = {}
    for i in ids:
        crops[i] = aligned(i).astype(np.float32)
        print('aligned', i, flush=True)

    # Colour: one RGB offset per crop, solved so overlapping crops agree (least squares, mean offset zero).
    pairs = []
    for a in ids:
        for b in ids:
            if a >= b:
                continue
            (ya, xa), (yb, xb) = pos[a], pos[b]
            y0, y1 = max(ya, yb), min(ya + N, yb + N)
            x0, x1 = max(xa, xb), min(xa + N, xb + N)
            if y1 - y0 < 40 or x1 - x0 < 40:
                continue
            A = crops[a][y0 - ya:y1 - ya, x0 - xa:x1 - xa]
            B = crops[b][y0 - yb:y1 - yb, x0 - xb:x1 - xb]
            pairs.append((a, b, (A - B).reshape(-1, 3).mean(0), (y1 - y0) * (x1 - x0)))
    idx = {i: k for k, i in enumerate(ids)}
    M = np.zeros((len(pairs) + 1, len(ids)))
    T = np.zeros((len(pairs) + 1, 3))
    for r, (a, b, m, area) in enumerate(pairs):
        w = np.sqrt(area / 1e5)
        M[r, idx[a]], M[r, idx[b]], T[r] = w, -w, m * w
    M[-1, :] = 1.0  # offsets sum to zero: the whole map keeps its overall colour
    off = np.linalg.lstsq(M, T, rcond=None)[0]
    for i in ids:
        crops[i] -= off[idx[i]]
        print('colour offset', i, off[idx[i]].round(1))

    # Blend: weight = exp(distance to own edge / TAU), relative to the best crop at that pixel.
    yy, xx = np.mgrid[0:N, 0:N]
    dist = np.minimum(np.minimum(xx, N - 1 - xx), np.minimum(yy, N - 1 - yy)).astype(np.float32)
    best = np.full((H, W), -1.0, np.float32)
    for i in ids:
        y, x = pos[i]
        hh, ww = min(N, H - y), min(N, W - x)
        best[y:y + hh, x:x + ww] = np.maximum(best[y:y + hh, x:x + ww], dist[:hh, :ww])
    # crops on the map border have no neighbour beyond it: treat that border as far away
    num = np.zeros((H, W, 3), np.float32)
    den = np.zeros((H, W), np.float32)
    for i in ids:
        y, x = pos[i]
        hh, ww = min(N, H - y), min(N, W - x)
        d = dist.copy()
        r, c = int(i[1]), int(i[3])
        if c == 1: d[:, :N // 2] = np.maximum(d[:, :N // 2], N)
        if c == 6: d[:, N // 2:] = np.maximum(d[:, N // 2:], N)
        if r == 1: d[:N // 2] = np.maximum(d[:N // 2], N)
        if r == 4: d[N // 2:] = np.maximum(d[N // 2:], N)
        w = np.exp(np.minimum(d[:hh, :ww] - np.maximum(best[y:y + hh, x:x + ww], d[:hh, :ww]), 0) / TAU)
        num[y:y + hh, x:x + ww] += crops[i][:hh, :ww] * w[:, :, None]
        den[y:y + hh, x:x + ww] += w
    out_img = np.clip(num / np.maximum(den, 1e-6)[:, :, None], 0, 255).astype(np.uint8)
    cv2.imwrite(out, out_img)
    print('wrote', out, out_img.shape)


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else os.path.join(D, '_map-assembled.png'))
