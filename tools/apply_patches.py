"""Paste the repainted fixes (design/map-quality-brief/patches) into the assembled map, only where they changed something.

Usage: python3 tools/apply_patches.py     then     python3 tools/build_map_v2.py

Each patch is a 1254 px window cut from the assembled map (origin below) and repainted by the image agent. For each one only the pixels inside the listed edit areas that really
differ are copied over, with a soft edge, so the rest of the map (sea, coast, seams) is left exactly as it was.
The first run keeps the untouched map as _map-assembled-before-patches.png and every run starts from that copy.
"""
import os, shutil
import cv2
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
BRIEF = os.path.join(HERE, '..', 'design', 'map-quality-brief') + '/'
MAP = BRIEF + 'hires-crops-640/_map-assembled.png'
BASE = BRIEF + 'hires-crops-640/_map-assembled-before-patches.png'
N = 1254
# name: (x0, y0, [edit areas inside the window as (left, top, right, bottom)])
PATCHES = {
    'panama-oeste': (2700, 850, [(0, 120, 720, 600), (480, 470, 1050, 900)]),   # Colon port; Panama Oeste beach and kites
    'panama-city': (3800, 900, [(0, 40, 620, 360), (570, 260, 900, 540)]),       # the skyline on Panama's coast (A) and Costa del Este (B)
}


def main():
    if not os.path.exists(BASE):
        shutil.copy(MAP, BASE)
    big = cv2.imread(BASE).astype(np.float32)
    for name, (x0, y0, areas) in PATCHES.items():
        orig = big[y0:y0 + N, x0:x0 + N].copy().astype(np.uint8)
        new = cv2.imread(f'{BRIEF}patches/{name}-new.png')
        new = cv2.resize(new, (N, N), interpolation=cv2.INTER_AREA if new.shape[0] > N else cv2.INTER_CUBIC)
        # The agent kept these windows in place (sea masks agree, no shift), so they are pasted as they are: warping them bent the trees.
        gx, gy = np.meshgrid(np.arange(N), np.arange(N))
        diff = cv2.GaussianBlur(np.abs(new.astype(np.float32) - orig.astype(np.float32)).mean(2), (0, 0), 3)
        changed = cv2.dilate((diff > 28).astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (41, 41)))
        area = np.zeros((N, N), np.uint8)
        for l, t, r, b in areas:
            area[t:b, l:r] = 1
        mask = cv2.GaussianBlur((changed * area).astype(np.float32), (0, 0), 14)
        ramp = np.clip(np.minimum(np.minimum(gx, N - 1 - gx), np.minimum(gy, N - 1 - gy)) / 90.0, 0, 1)  # fade out toward the window border
        mask = (mask * ramp)[:, :, None]
        big[y0:y0 + N, x0:x0 + N] = new * mask + big[y0:y0 + N, x0:x0 + N] * (1 - mask)
        print(f'{name}: {int((mask > 0.5).sum() / 3 // 1000)}k px pasted')
        cv2.imwrite(f'{BRIEF}patches/{name}-mask.png', (mask[:, :, 0] * 255).astype(np.uint8))
    cv2.imwrite(MAP, np.clip(big, 0, 255).astype(np.uint8))
    print('wrote', os.path.relpath(MAP, os.getcwd()))


if __name__ == '__main__':
    main()
