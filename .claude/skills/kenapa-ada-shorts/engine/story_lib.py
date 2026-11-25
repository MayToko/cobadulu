"""Helper untuk menyusun story.json dari timestamp kata (words.json) + daftar shot.

Konsep:
  - words.json  : [{"text","start","end"}...] dari transkripsi narasi (ElevenLabs Scribe).
  - TEMPO       : faktor percepatan narasi (refs ~2.2 kata/detik). Waktu dibagi TEMPO.
  - shot(anchor, ...) : shot dimulai tepat saat frasa `anchor` diucapkan (dicari berurutan).
  - captions    : otomatis 1-3 kata per potongan, pecah di tanda baca, kata kunci kuning.
"""
import json, math, re

class Story:
    def __init__(self, words_path, tempo=1.0, lead=0.0):
        d = json.load(open(words_path))
        ws = d["words"] if isinstance(d, dict) else d
        self.words = [w for w in ws if w.get("type", "word") == "word"]
        self.tempo = tempo
        self.lead = lead                      # detik hening sebelum narasi
        self.cursor = 0
        self.shots = []                       # (t_start, spec)
        self.cast, self.props = {}, {}

    # ---------- waktu
    def T(self, sec):
        return self.lead + sec / self.tempo

    @staticmethod
    def norm(s):
        return re.sub(r"[^a-z0-9\-]", "", s.lower())

    def find(self, phrase):
        toks = [self.norm(t) for t in phrase.split()]
        for i in range(self.cursor, len(self.words)):
            if all(i + k < len(self.words) and self.norm(self.words[i + k]["text"]) == toks[k] for k in range(len(toks))):
                self.cursor = i + 1
                return i
        raise ValueError(f"anchor tidak ketemu: {phrase!r} (setelah kata #{self.cursor})")

    def shot(self, anchor, spec, offset=0.0):
        """anchor = frasa narasi (string) atau waktu absolut (float, detik output)."""
        if isinstance(anchor, (int, float)):
            t = float(anchor)
        else:
            i = self.find(anchor)
            t = self.T(self.words[i]["start"]) - 0.05 + offset
        self.shots.append((max(0.0, t), spec))
        return spec

    # ---------- caption
    def captions(self, yellow=(), max_words=2, max_chars=16):
        yl = {self.norm(w) for w in yellow}
        caps, cur = [], []
        def flush():
            if not cur: return
            text = " ".join(w["text"] for w in cur).strip('"“”')
            text = text.rstrip(".,!")
            c = "y" if any(self.norm(w["text"]) in yl for w in cur) else "w"
            caps.append({"s": self.T(cur[0]["start"]), "e": self.T(cur[-1]["end"]), "text": text.replace('"', ''), "c": c})
            cur.clear()
        for w in self.words:
            cur.append(w)
            txt = " ".join(x["text"] for x in cur)
            if re.search(r"[.,?!]\"?$", w["text"]) or len(cur) >= max_words or len(txt) >= max_chars:
                flush()
        flush()
        # rapatkan: caption bertahan sampai caption berikut (maks +0.5 dtk)
        for a, b in zip(caps, caps[1:]):
            a["e"] = min(b["s"], a["e"] + 0.5) if b["s"] - a["e"] < 0.9 else a["e"] + 0.3
        caps[-1]["e"] += 0.6
        return caps

    def build(self, out_path, yellow=(), tail=1.2):
        shots = sorted(self.shots, key=lambda x: x[0])
        end = self.T(self.words[-1]["end"]) + tail
        res = []
        for k, (t, spec) in enumerate(shots):
            t2 = shots[k + 1][0] if k + 1 < len(shots) else end
            if t2 - t < 0.25: continue
            s = dict(spec); s["dur"] = round(t2 - t, 4); res.append(s)
        story = {"cast": self.cast, "props": self.props, "shots": res, "captions": self.captions(yellow)}
        json.dump(story, open(out_path, "w"), indent=1)
        return story

# ---------- geometri bantu
def rotY(v, deg):
    a = math.radians(deg); x, y, z = v
    return [x * math.cos(a) + z * math.sin(a), y, -x * math.sin(a) + z * math.cos(a)]

def add(a, b): return [a[i] + b[i] for i in range(3)]

def hand_up(pos, rot, scale=1.0):
    """posisi gagang payung terbuka yang dipegang tangan kanan terangkat (armR=[-2.4,0.2])."""
    return add(pos, rotY([0.27 * scale, 1.92 * scale, 0.34 * scale], rot))

def hand_side(pos, rot, scale=1.0):
    """posisi origin payung tertutup yang dijinjing di tangan kanan (lengan lurus)."""
    return add(pos, rotY([0.33 * scale, -0.12 * scale, 0.02], rot))

def head_top(pos, scale=1.0):
    return add(pos, [0, 1.95 * scale, 0])

DIST = 1.0   # pengali jarak kamera->target (atur di build.py: story_lib.DIST = 1.7)

def _d(p, t):
    return [t[i] + (p[i] - t[i]) * DIST for i in range(3)]

def cam(p, t, p2=None, t2=None, fov=35, fov2=None, ease="l", shake=0, raw=False):
    """raw=True: posisi kamera dipakai apa adanya (untuk over-shoulder / di balik dinding)."""
    if not raw:
        p = _d(p, t)
        if p2: p2 = _d(p2, t2 or t)
    c = {"p": p, "t": t, "fov": fov, "ease": ease}
    if p2: c["p2"] = p2
    if t2: c["t2"] = t2
    if fov2: c["fov2"] = fov2
    if shake: c["shake"] = shake
    return c

def push(p, t, amount=0.12, fov=35, drift=(0, 0, 0)):
    """push-in lambat khas referensi: kamera maju `amount` dari jarak ke target."""
    p2 = [p[i] + (t[i] - p[i]) * amount + drift[i] for i in range(3)]
    return cam(p, t, p2=p2, fov=fov, ease="l")  # DIST diterapkan di cam()
