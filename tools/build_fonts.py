"""Build the app's web fonts: only the glyphs the app can show, in the weights it uses, as woff2.

The fonts used to come from Google Fonts at run time (four families, Noto Sans SC in dozens of slices); now they
ship with the app (app/src/fonts), so text looks right on the first paint, on a slow line and offline.

    python3 -m venv .venv && .venv/bin/pip install fonttools brotli
    .venv/bin/python tools/build_fonts.py        # downloads the source fonts once into tools/.font-cache

Run it again whenever new Chinese text or accented letters appear in the app (it scans app/src and app/index.html).
"""
import io
import re
import urllib.request
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / 'tools/.font-cache'
OUT = ROOT / 'app/src/fonts'
RAW = 'https://raw.githubusercontent.com/google/fonts/main/ofl'
SOURCES = {
    'Nunito': (f'{RAW}/nunito/Nunito%5Bwght%5D.ttf', {'wght': (500, 900)}),
    'NotoSansSC': (f'{RAW}/notosanssc/NotoSansSC%5Bwght%5D.ttf', {'wght': (400, 700)}),
    'Fredoka': (f'{RAW}/fredoka/Fredoka%5Bwdth%2Cwght%5D.ttf', {'wght': (600, 700), 'wdth': 100}),
    'ZCOOLKuaiLe': (f'{RAW}/zcoolkuaile/ZCOOLKuaiLe-Regular.ttf', {}),
}
LATIN = set(chr(c) for c in range(0x20, 0x250)) | set('–—‘’“”…•→←×−✓✔')


def app_text() -> str:
    """Every non-ASCII character the app's own code and data can put on screen."""
    chars = set()
    files = [*(ROOT / 'app/src').rglob('*'), ROOT / 'app/index.html']
    for f in files:
        if f.suffix in {'.ts', '.tsx', '.css', '.json', '.html'} and f.is_file():
            chars |= set(re.findall(r'[^\x00-\x7f]', f.read_text(encoding='utf-8', errors='ignore')))
    return ''.join(sorted(chars))


def main():
    CACHE.mkdir(parents=True, exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)
    text = app_text()
    han = ''.join(c for c in text if 0x3000 <= ord(c) <= 0x9FFF or 0xFF00 <= ord(c) <= 0xFFEF)
    print(f'{len(text)} non-ASCII characters in the app, {len(han)} of them Chinese or fullwidth')
    for name, (url, axes) in SOURCES.items():
        src = CACHE / f'{name}.ttf'
        if not src.exists():
            print('downloading', name)
            urllib.request.urlretrieve(url, src)
        font = TTFont(src)
        if axes and 'fvar' in font:
            font = instancer.instantiateVariableFont(font, axes)
            # Round-trip through bytes: the subsetter trips over the instancer's lazily loaded tables.
            buf = io.BytesIO()
            font.save(buf)
            font = TTFont(io.BytesIO(buf.getvalue()))
        keep = LATIN | set(text) if name in {'NotoSansSC', 'ZCOOLKuaiLe'} else LATIN | set(text) - set(han)
        opts = subset.Options()
        opts.flavor = 'woff2'
        opts.layout_features = ['kern', 'liga', 'ccmp', 'locl', 'mark', 'mkmk']
        opts.hinting = False
        opts.desubroutinize = True
        sub = subset.Subsetter(opts)
        sub.populate(text=''.join(keep))
        sub.subset(font)
        out = OUT / f'{name}.woff2'
        font.flavor = 'woff2'
        font.save(out)
        print(f'{name}: {out.stat().st_size / 1024:.0f} KB')


if __name__ == '__main__':
    main()
