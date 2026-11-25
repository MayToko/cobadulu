"""Mix audio gaya referensi: narasi padat di depan, musik latar ringan (pluck santai)
terus-menerus di belakang (-20 dB, ducking), SFX kecil (pop callout, ding hasil hitungan,
hujan untuk shot "rain", fwump saat prop "grow"). Output dinormalisasi ke -14.5 LUFS
(referensi terukur: -14.5 ~ -14.7 LUFS, LRA ~2 LU = sangat rata).

python3 audio.py vo_raw.mp3 story.json out.wav --tempo 1.25
"""
import sys, json, subprocess, argparse, numpy as np

SR = 44100
ap = argparse.ArgumentParser()
ap.add_argument("vo"); ap.add_argument("story"); ap.add_argument("out")
ap.add_argument("--tempo", type=float, default=1.0)
ap.add_argument("--music_db", type=float, default=-11.0)
ap.add_argument("--bpm", type=float, default=96)
a = ap.parse_args()

def load(path, filt=""):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-af", (filt + "," if filt else "") + f"aresample={SR}", "-ac", "1", "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).copy()

# ---------------- narasi (dipercepat tanpa ubah pitch, sedikit kompresi & EQ radio-jernih)
vo = load(a.vo, f"atempo={a.tempo},highpass=f=80,acompressor=threshold=-20dB:ratio=3:attack=5:release=80,equalizer=f=3500:t=q:w=1:g=2")
story = json.load(open(a.story))
total = sum(s["dur"] for s in story["shots"])
N = int((total + 0.2) * SR)
vo = np.pad(vo, (0, max(0, N - len(vo))))[:N]
t = np.arange(N) / SR

# ---------------- musik latar: progresi santai Cmaj7-Am7-Fmaj7-G7, pluck Karplus-Strong
rng = np.random.default_rng(3)
def pluck(freq, dur, amp=0.3):
    n = int(dur * SR); p = max(2, int(SR / freq)); buf = rng.uniform(-1, 1, p); out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % p]; buf[i % p] = 0.5 * (buf[i % p] + buf[(i + 1) % p]) * 0.996
    return out * amp
def note(m): return 440 * 2 ** ((m - 69) / 12)
beat = 60 / a.bpm
chords = [[48, 60, 64, 67, 71], [45, 57, 60, 64, 67], [41, 57, 60, 65, 69], [43, 55, 59, 62, 65]]
bar = 4 * beat; loopN = int(len(chords) * bar * SR)
loop = np.zeros(loopN + SR * 2)
cache = {}
def P(m, d, amp):
    k = (m, round(d, 3), amp)
    if k not in cache: cache[k] = pluck(note(m), d, amp)
    return cache[k]
for ci, ch in enumerate(chords):
    t0 = ci * bar
    b = P(ch[0], bar, 0.5); i0 = int(t0 * SR); loop[i0:i0 + len(b)] += b          # bass
    b = P(ch[0], bar - 2 * beat, 0.35); i0 = int((t0 + 2.5 * beat) * SR); loop[i0:i0 + len(b)] += b
    pattern = [(0, 1), (0.5, 2), (1, 3), (1.5, 4), (2, 2), (2.5, 3), (3, 4), (3.5, 3)]   # arpeggio
    for (bt, idx) in pattern:
        s = P(ch[idx], 1.2, 0.22); i0 = int((t0 + bt * beat) * SR); loop[i0:i0 + len(s)] += s
    for k in range(8):                                                                  # shaker
        n = int(0.05 * SR); env = np.exp(-np.linspace(0, 8, n)); hs = rng.normal(0, 1, n) * env * (0.05 if k % 2 else 0.03)
        hs = np.diff(hs, prepend=0); i0 = int((t0 + k * 0.5 * beat) * SR); loop[i0:i0 + n] += hs
    for k in (0, 2):                                                                    # kick lembut
        n = int(0.18 * SR); tt = np.arange(n) / SR; kk = np.sin(2 * np.pi * (55 + 60 * np.exp(-tt * 30)) * tt) * np.exp(-tt * 18) * 0.5
        i0 = int((t0 + k * beat) * SR); loop[i0:i0 + n] += kk
loop = loop[:loopN] + np.pad(loop[loopN:], (0, loopN))[:loopN]   # wrap ekor
music = np.tile(loop, N // loopN + 1)[:N]
music /= np.max(np.abs(music)) + 1e-9
# ducking: musik turun saat narasi bicara
env = np.convolve(np.abs(vo), np.ones(int(0.05 * SR)) / int(0.05 * SR), mode="same")
duck = 1 - 0.45 * np.clip(env / (np.percentile(env, 90) + 1e-9), 0, 1)
duck = np.convolve(duck, np.ones(int(0.2 * SR)) / int(0.2 * SR), mode="same")
music *= 10 ** (a.music_db / 20) * duck
fade = np.clip(t / 0.4, 0, 1) * np.clip((total - t) / 1.2, 0, 1)
music *= fade

# ---------------- SFX
sfx = np.zeros(N)
def put(sig, at, gain=1.0):
    i0 = int(at * SR); n = min(len(sig), N - i0)
    if n > 0: sfx[i0:i0 + n] += sig[:n] * gain
def pop():
    n = int(0.09 * SR); tt = np.arange(n) / SR; f = 900 * np.exp(-tt * 25) + 250
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 35) * 0.5
def ding():
    n = int(1.2 * SR); tt = np.arange(n) / SR
    return sum(np.sin(2 * np.pi * f * tt) * g for f, g in [(1318, 0.5), (2637, 0.2), (3951, 0.08)]) * np.exp(-tt * 4) * 0.5
def fwump():
    n = int(0.25 * SR); tt = np.arange(n) / SR; x = rng.normal(0, 1, n)
    x = np.convolve(x, np.ones(40) / 40, mode="same"); return x * np.exp(-tt * 18) * np.minimum(1, tt * 80) * 1.2
rain_n = rng.normal(0, 1, N)
rain_n = rain_n - np.convolve(rain_n, np.ones(6) / 6, mode="same")          # high-pass kasar
rain_n = np.convolve(rain_n, np.ones(3) / 3, mode="same") * 0.05
rain_gain = np.zeros(N)
acc = 0.0
for s in story["shots"]:
    i0, i1 = int(acc * SR), int((acc + s["dur"]) * SR)
    rain_gain[i0:i1] = s.get("rain", 0)
    for c in s.get("callouts", []): put(pop(), acc + c.get("t", 0), 0.7)
    m = s.get("math")
    if m:
        for k, at in enumerate(m.get("at", [])): put(pop(), acc + at, 0.4)
        if m.get("result"): put(ding(), acc + m.get("resultAt", 0), 0.5)
    for p in (s.get("props") or {}).values():
        if p.get("grow"): put(fwump(), acc, 0.8)
    for ic in s.get("icons", []): put(pop(), acc + ic.get("t", 0), 0.35)
    acc += s["dur"]
rain_gain = np.convolve(rain_gain, np.ones(int(0.15 * SR)) / int(0.15 * SR), mode="same")
sfx += rain_n * rain_gain

mix = vo + music + sfx * 0.6
mix = np.tanh(mix * 1.1) / 1.1
st = np.stack([mix, mix], 1).astype(np.float32)
tmp = a.out + ".tmp.f32"
st.tofile(tmp)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", tmp,
                "-af", "loudnorm=I=-14.5:TP=-1.0:LRA=4", "-ar", str(SR), a.out], check=True)
import os; os.remove(tmp)
print("audio ok", round(total, 2), "s")
