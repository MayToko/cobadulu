"""Konversi Poppins (woff2 dari @fontsource) → typeface JSON untuk THREE.TextGeometry.
python3 make_font3d.py node_modules/@fontsource/poppins/files/poppins-latin-800-normal.woff2 assets/poppins_800.typeface.json"""
import sys, json
from fontTools.ttLib import TTFont
from fontTools.pens.basePen import BasePen

class TypefacePen(BasePen):
    def __init__(self, gs, k):
        super().__init__(gs); self.cmd = []; self.k = k
    def f(self, v): return str(round(v * self.k, 1))
    def _moveTo(self, p): self.cmd += ["m", self.f(p[0]), self.f(p[1])]
    def _lineTo(self, p): self.cmd += ["l", self.f(p[0]), self.f(p[1])]
    def _qCurveToOne(self, c, p): self.cmd += ["q", self.f(p[0]), self.f(p[1]), self.f(c[0]), self.f(c[1])]
    def _curveToOne(self, c1, c2, p): self.cmd += ["b", self.f(p[0]), self.f(p[1]), self.f(c1[0]), self.f(c1[1]), self.f(c2[0]), self.f(c2[1])]
    def _closePath(self): pass

font = TTFont(sys.argv[1]); gs = font.getGlyphSet(); cmap = font.getBestCmap()
upm = font["head"].unitsPerEm; k = 1000 / upm
glyphs = {}
for code, name in cmap.items():
    ch = chr(code)
    if code < 32 or code > 0x24FF: continue
    pen = TypefacePen(gs, k); gs[name].draw(pen)
    xs = [float(v) for i, v in enumerate(pen.cmd) if False]
    glyphs[ch] = {"ha": round(gs[name].width * k), "x_min": 0, "x_max": round(gs[name].width * k), "o": " ".join(pen.cmd)}
hh = font["hhea"]
out = {"glyphs": glyphs, "familyName": "Poppins", "ascender": round(hh.ascent * k), "descender": round(hh.descent * k),
       "underlinePosition": -100, "underlineThickness": 50, "boundingBox": {"yMin": round(hh.descent * k), "xMin": 0, "yMax": round(hh.ascent * k), "xMax": 1000},
       "resolution": 1000, "original_font_information": {"format": 0, "fontFamily": "Poppins", "copyright": "SIL Open Font License"}}
json.dump(out, open(sys.argv[2], "w"), separators=(",", ":"))
print("glyphs", len(glyphs))
