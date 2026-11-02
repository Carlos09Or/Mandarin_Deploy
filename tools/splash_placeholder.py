"""Inline a tiny blurred copy of each splash painting into app/index.html, so the loading screen shows the painting's
colours the moment the page arrives, before the painting itself (about 200 KB) has come in.

Usage: python3 tools/splash_placeholder.py     (run again whenever splash-day.webp or splash-night.webp changes)

Each copy is 32 px wide (about 0.5 KB as base64). index.html keeps them on the line that starts with `var BLUR =`,
which this script rewrites.
"""
import base64, io, os, re
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
APP = os.path.join(HERE, '..', 'app')
INDEX = os.path.join(APP, 'index.html')
W = 32


def tiny(name):
    im = Image.open(os.path.join(APP, 'public', 'journey', f'splash-{name}.webp')).convert('RGB')
    small = im.resize((W, round(W * im.height / im.width)), Image.LANCZOS).filter(ImageFilter.GaussianBlur(0.6))
    out = io.BytesIO()
    small.save(out, 'WEBP', quality=45, method=6)
    return 'data:image/webp;base64,' + base64.b64encode(out.getvalue()).decode()


html = open(INDEX).read()
line = f"var BLUR = {{ day: '{tiny('day')}', night: '{tiny('night')}' }}"
html, n = re.subn(r"var BLUR = \{[^\n]*\}", line, html)
assert n == 1, 'index.html needs exactly one line starting with `var BLUR = {`'
open(INDEX, 'w').write(html)
print(f'index.html: placeholders updated ({len(line)} characters)')
