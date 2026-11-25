"""Tahap finishing dengan HyperFrames (HTML + GSAP → MP4).

Engine 3D merender adegan TANPA caption & rumus (story["finish"] = "hyperframes"); skrip ini menyusun
proyek HyperFrames dengan struktur resmi (root + sub-komposisi <template>):

  hf/index.html                 root 1080×1920: video adegan 3D + audio mix + 3 layer
  hf/compositions/captions.html caption 1–2 kata gaya referensi (Poppins 700, putih/kuning, fade)
  hf/compositions/graphics.html rumus hitungan pojok kanan atas (baris bertahap, hasil hijau)
  hf/compositions/endcard.html  end card opsional (foto produk + judul + ajakan) setelah adegan selesai

python3 hf_compose.py story.json video_silent.mp4 mix.wav hf/
npx hyperframes lint hf          # validasi
npx hyperframes render hf -o FINAL.mp4 --quality delivery --workers 2 --no-browser-gpu
npx hyperframes preview hf       # Studio: edit caption/rumus/end card secara visual

Opsional di story.json (lewat S.opts di build.py):
  "endcard": {"img": "foto.jpg", "title": "NAMA PRODUK", "sub": "Ajakan singkat", "dur": 2.5}
"""
import json, os, sys, shutil, html

story_p, video_p, audio_p, out = sys.argv[1:5]
ENGINE = os.path.dirname(os.path.abspath(__file__))
NM = os.path.join(ENGINE, "node_modules")
story = json.load(open(story_p))
work = os.path.dirname(os.path.abspath(story_p))
for d in ("assets", "compositions"):
    os.makedirs(os.path.join(out, d), exist_ok=True)
shutil.copy(video_p, os.path.join(out, "assets", "scene.mp4"))
shutil.copy(audio_p, os.path.join(out, "assets", "mix.wav"))
for w in ("700", "800"):
    shutil.copy(os.path.join(NM, f"@fontsource/poppins/files/poppins-latin-{w}-normal.woff2"), os.path.join(out, "assets", f"poppins-{w}.woff2"))
shutil.copy(os.path.join(NM, "gsap/dist/gsap.min.js"), os.path.join(out, "assets", "gsap.min.js"))

T = round(sum(s["dur"] for s in story["shots"]), 3)
end = story.get("endcard")
ED = round(end.get("dur", 2.5), 3) if end else 0
TOTAL = round(T + ED, 3)
esc = lambda t: html.escape(str(t))
r3 = lambda v: round(v, 3)


def template(cid, dur, body, css, anim):
    sel = f'[data-composition-id="{cid}"]'
    return f'''<template id="{cid}-template">
  <div data-composition-id="{cid}" data-width="1080" data-height="1920" data-duration="{dur}">
    {body}
    <style>{css.replace("SEL", sel)}</style>
    <script>
      (function () {{
        const S = (q) => '{sel} ' + q;
        const tl = gsap.timeline({{ paused: true }});
        {anim}
        tl.set({{}}, {{}}, {dur});
        window.__timelines = window.__timelines || {{}};
        window.__timelines["{cid}"] = tl;
      }})();
    </script>
  </div>
</template>
'''


# ---------- captions
body, anim = [], []
for i, c in enumerate(story["captions"]):
    s, e = r3(c["s"]), r3(min(c["e"], T))
    body.append(f'<div class="cap{" y" if c.get("c") == "y" else ""}" id="c{i}">{esc(c["text"])}</div>')
    anim.append(f'tl.fromTo(S("#c{i}"),{{opacity:0}},{{opacity:1,duration:0.12,ease:"none"}},{s});')
    anim.append(f'tl.to(S("#c{i}"),{{opacity:0,duration:0.1,ease:"none"}},{r3(max(s + 0.12, e - 0.1))});')
cap_css = """SEL .cap{position:absolute;left:0;width:1080px;top:1305px;height:94px;line-height:94px;text-align:center;font-family:Poppins,sans-serif;
  font-weight:700;font-size:78px;color:#fff;opacity:0;white-space:nowrap;text-shadow:0 4px 18px rgba(10,4,2,.85),0 0 6px rgba(10,4,2,.85)}
SEL .cap.y{color:#f4c430}"""
open(os.path.join(out, "compositions", "captions.html"), "w").write(template("captions", T, "\n    ".join(body), cap_css, "\n        ".join(anim)))

# ---------- graphics (rumus pojok kanan atas)
body, anim, acc = [], [], 0.0
for k, sh in enumerate(story["shots"]):
    m = sh.get("math")
    if m:
        rows = []
        for j, line in enumerate(m["lines"]):
            at = acc + (m.get("at", [])[j] if j < len(m.get("at", [])) else j * 0.35)
            rows.append(f'<div class="ml" id="m{k}_{j}">{esc(line)}</div>')
            anim.append(f'tl.fromTo(S("#m{k}_{j}"),{{opacity:0,x:30}},{{opacity:1,x:0,duration:0.18,ease:"power2.out"}},{r3(at)});')
        if m.get("result"):
            ra = acc + m.get("resultAt", len(m["lines"]) * 0.35)
            rows.append(f'<div class="mr" id="m{k}_r" style="color:{m.get("resultColor", "#5fd35a")}">{esc(m["result"])}</div>')
            anim.append(f'tl.fromTo(S("#m{k}_r"),{{opacity:0,scale:0.6}},{{opacity:1,scale:1,duration:0.25,ease:"back.out(2)"}},{r3(ra)});')
        body.append(f'<div class="math" id="m{k}">{"".join(rows)}</div>')
        anim.append(f'tl.set(S("#m{k}"),{{opacity:1}},{r3(acc)}); tl.set(S("#m{k}"),{{opacity:0}},{r3(acc + sh["dur"])});')
    acc += sh["dur"]
gfx_css = """SEL .math{position:absolute;right:60px;top:122px;text-align:right;opacity:0;font-family:Poppins,sans-serif;text-shadow:0 0 8px rgba(0,0,0,.8)}
SEL .ml{font-weight:800;font-size:34px;line-height:48px;color:#fff;opacity:0}
SEL .mr{font-weight:800;font-size:52px;line-height:70px;border-top:3px solid rgba(255,255,255,.8);margin-top:6px;opacity:0;transform-origin:right center}"""
open(os.path.join(out, "compositions", "graphics.html"), "w").write(template("graphics", T, "\n    ".join(body) or "<div></div>", gfx_css, "\n        ".join(anim)))

# ---------- end card
end_layer = ""
if end:
    img = ""
    if end.get("img"):
        shutil.copy(os.path.join(work, end["img"]), os.path.join(out, "assets", os.path.basename(end["img"])))
        img = f'<img class="eimg" src="assets/{esc(os.path.basename(end["img"]))}">'
    body = f'<div class="ecard">{img}<div class="etitle">{esc(end.get("title", ""))}</div><div class="esub">{esc(end.get("sub", ""))}</div></div>'
    css = """SEL .ecard{position:absolute;inset:0;width:1080px;height:1920px;background:radial-gradient(circle at 50% 40%,#3a2210 0%,#120804 75%);display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Poppins,sans-serif}
SEL .eimg{width:820px;border-radius:24px;border:10px solid #fff;box-shadow:0 30px 80px rgba(0,0,0,.6)}
SEL .etitle{margin-top:60px;font-weight:800;font-size:76px;color:#f4c430;text-shadow:0 6px 0 #2a1404}
SEL .esub{margin-top:22px;font-weight:700;font-size:54px;color:#fff;background:#d0402f;padding:14px 40px;border-radius:60px}"""
    reps = max(1, int((ED - 1.0) / 0.4))
    anim = "\n        ".join([
        'tl.fromTo(S(".ecard"),{opacity:0},{opacity:1,duration:0.3},0);',
        'tl.fromTo(S(".eimg"),{scale:0.7,rotation:-6,opacity:0},{scale:1,rotation:0,opacity:1,duration:0.5,ease:"back.out(1.6)"},0.1);',
        'tl.fromTo(S(".etitle"),{y:40,opacity:0},{y:0,opacity:1,duration:0.35,ease:"power3.out"},0.35);',
        'tl.fromTo(S(".esub"),{y:40,opacity:0},{y:0,opacity:1,duration:0.35,ease:"power3.out"},0.55);',
        f'tl.to(S(".esub"),{{scale:1.06,duration:0.4,yoyo:true,repeat:{reps},ease:"sine.inOut"}},1.0);'])
    open(os.path.join(out, "compositions", "endcard.html"), "w").write(template("endcard", ED, body, css, anim))
    end_layer = f'<div id="endcard-layer" class="comp-layer" data-composition-id="endcard" data-composition-src="compositions/endcard.html" data-start="{T}" data-duration="{ED}" data-track-index="3"></div>'

doc = f'''<!doctype html>
<html><head><meta charset="utf-8">
<script src="assets/gsap.min.js"></script>
<style>
@font-face{{font-family:Poppins;font-weight:700;src:url(assets/poppins-700.woff2) format("woff2")}}
@font-face{{font-family:Poppins;font-weight:800;src:url(assets/poppins-800.woff2) format("woff2")}}
html,body{{margin:0;background:#000}}
#root{{position:relative;width:1080px;height:1920px;overflow:hidden;background:#000}}
#scene{{position:absolute;left:0;top:0;width:1080px;height:1920px;object-fit:cover}}
.comp-layer{{position:absolute;inset:0;width:1080px;height:1920px}}
</style></head>
<body>
<div id="root" data-composition-id="root" data-width="1080" data-height="1920" data-fps="30" data-duration="{TOTAL}">
  <video id="scene" class="clip" src="assets/scene.mp4" data-start="0" data-duration="{T}" data-track-index="0" muted playsinline></video>
  <audio id="mix" src="assets/mix.wav" data-start="0" data-duration="{T}" data-volume="1"></audio>
  <div id="graphics-layer" class="comp-layer" data-composition-id="graphics" data-composition-src="compositions/graphics.html" data-start="0" data-duration="{T}" data-track-index="1"></div>
  <div id="captions-layer" class="comp-layer" data-track-kind="captions" data-composition-id="captions" data-composition-src="compositions/captions.html" data-start="0" data-duration="{T}" data-track-index="2"></div>
  {end_layer}
  <script>
    const tl = gsap.timeline({{ paused: true }});
    tl.set({{}}, {{}}, {TOTAL});
    window.__timelines = window.__timelines || {{}};
    window.__timelines["root"] = tl;
  </script>
</div>
</body></html>
'''
open(os.path.join(out, "index.html"), "w").write(doc)
print("hyperframes project:", out, "| durasi", TOTAL, "s |", len(story["captions"]), "caption |", "end card" if end else "tanpa end card")
