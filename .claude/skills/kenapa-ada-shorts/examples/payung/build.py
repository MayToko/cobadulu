"""Contoh episode: "Kenapa Ada Pelanggan yang Cuma Minjem Payung Tiap Sore?"
python3 build.py words.json story.json
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "engine"))
import story_lib
story_lib.DIST = 1.7
from story_lib import Story, cam, push, hand_up, hand_side, head_top, add

S = Story(sys.argv[1], tempo=1.25, lead=0.0)
S.cast = {
    "pria":    {"body": "#7a4a24", "hair": "cover", "bag": True, "limb": "#1f2550", "expr": "mouthOnly"},
    "bu":      {"body": "#3b3f9a", "hair": "hijab", "collar2": "#3b4fb0"},
    "ojek":    {"body": "#2f5fb0", "hair": "bowl", "limb": "#1f2550"},
    "pembeli": {"body": "#3f8f3a", "hair": "peci", "limb": "#1f2550"},
    "mbak":    {"body": "#6a3a8c", "hair": "bob", "collar": "#d0402f", "limb": "#2a1a30"},
}
S.props = {
    "rack":   {"type": "umbrellaRack", "args": [5]},
    "rack0":  {"type": "umbrellaRack", "args": [0]},
    "sign":   {"type": "sign", "args": [["PAYUNG", "PINJAM"], {"bg": "#f1e4c6", "fg": "#b3261e", "w": 512, "h": 256, "font": "800 74px Poppins"}]},
    "jar":    {"type": "coinJar"},
    "cjar":   {"type": "candyJar"},
    "candy":  {"type": "candy"},
    "uo":     {"type": "umbrellaOpen", "args": ["#2f6fc0"]},
    "uo2":    {"type": "umbrellaOpen", "args": ["#d0402f"]},
    "uc":     {"type": "umbrellaClosed", "args": ["#2f6fc0"]},
    "uc2":    {"type": "umbrellaClosed", "args": ["#d0402f"]},
    "uc3":    {"type": "umbrellaClosed", "args": ["#3f9a4a"]},
    "kresek": {"type": "kresek"},
    "helm":   {"type": "helmet", "args": ["#3f8a4a"]},
    "lbag":   {"type": "longBag"},
    "dus":    {"type": "dusPayung"},
    "dus2":   {"type": "cardbox", "args": ["#e8a540", 0.8, 0.45, 0.5]},
}

# ---------------- posisi baku
TOP = 1.11                       # tinggi permukaan etalase warung
BU = [0.35, 0, -0.95]            # Bu Ratna di balik etalase
CUST = [-0.45, 0, 1.05]          # pembeli di depan etalase
RACK = [2.25, 0, 0.55]           # gantungan payung pinjaman
SIGN = [2.25, 1.62, 0.5]
SW = 0.15                        # tinggi trotoar halte
P_ = lambda **k: k

def warung_props(full=True, extra=None):
    d = {"jar": P_(pos=[0.85, TOP, 0.15]), "cjar": P_(pos=[-0.75, TOP, 0.05]), "sign": P_(pos=SIGN, scale=0.55),
         ("rack" if full else "rack0"): P_(pos=RACK)}
    if extra: d.update(extra)
    return d

bu = lambda expr="neutral", **k: {"pos": BU, "rot": 0, "expr": expr, **k}

# ================= HOOK =================
S.shot("Dia datang", {"set": "street", "cam": cam([0.4, 0.9, 3.2], [0, 1.4, -6], p2=[0.3, 0.95, 2.4], fov=40),
    "actors": {"pria": {"pos": [0, 0, -5], "to": [0, 0, -2.2], "rot": 0, "anim": "walk"}}})
S.shot("tiap sore", {"set": "warung", "cam": push([2.6, 1.5, 4.0], [0.0, 1.2, 0.0], 0.1, fov=38),
    "actors": {"bu": bu("smile"), "pria": {"pos": [-2.2, 0, 1.4], "to": CUST, "rot": 120, "anim": "walk"}}, "props": warung_props()})
S.shot("Nggak beli", {"set": "warung", "cam": push([-0.2, 1.7, 2.6], [-0.45, 1.55, 1.0], 0.15, fov=36),
    "actors": {"pria": {"pos": CUST, "rot": 20}, "bu": bu()}, "props": warung_props()})
S.shot("Cuma minjem", {"set": "warung", "cam": push([2.0, 1.25, 2.1], [2.2, 0.9, 0.5], 0.15, fov=36),
    "actors": {"pria": {"pos": [1.6, 0, 1.35], "rot": 140, "armR": [-0.9, 0.2]}}, "props": {"rack": P_(pos=RACK),
    "sign": P_(pos=SIGN, scale=0.55)}})
S.shot("terus dibalikin", {"set": "warung", "cam": push([2.6, 1.0, 1.9], [2.25, 0.75, 0.55], 0.12, fov=34), "sunI": 2.2,
    "actors": {}, "props": {"rack": P_(pos=RACK), "sign": P_(pos=SIGN, scale=0.55)}})
# ================= CONTEXT =================
S.shot("Jadi gini", {"set": "warung", "cam": push([1.2, 1.6, 5.2], [0.4, 1.3, -0.5], 0.12, fov=40),
    "actors": {"bu": bu("smile")}, "props": warung_props()})
S.shot("nyediain payung", {"set": "warung", "cam": push([2.0, 1.55, 2.0], [2.25, 1.45, 0.5], 0.15, fov=34),
    "actors": {}, "props": warung_props()})
S.shot("buat pembeli", {"set": "street", "rain": 1, "exposure": 0.85, "sunI": 1.2, "cam": push([0.8, 1.3, 1.5], [0, 1.6, -3], 0.1, fov=40),
    "actors": {"pembeli": {"pos": [0, 0, -3.5], "to": [0, 0, -1.2], "rot": 0, "anim": "walk", "expr": "worried"}}})
S.shot("Gratis", {"set": "warung", "cam": push([2.1, 1.1, 1.8], [2.25, 0.9, 0.5], 0.15, fov=36),
    "actors": {}, "props": {"rack": P_(pos=RACK)}, "callouts": [{"text": "Rp0", "at": [2.25, 1.45, 0.55], "size": 96}]})
# ================= HARI PERTAMA =================
S.shot("Hari pertama", {"set": "warung", "cam": push([0.35, 1.8, 0.4], [0.35, 1.72, -0.95], 0.2, fov=34),
    "actors": {"bu": bu("neutral", exprAt=[[0.7, "worried"]])}, "props": warung_props()})
S.shot("Langitnya cerah", {"set": "warung", "cam": push([2.4, 1.45, 2.9], [0.0, 1.45, 0.0], 0.1, fov=38),
    "actors": {"bu": bu("talk"), "pria": {"pos": CUST, "rot": 160}}, "props": warung_props()})
S.shot("Payung buat", {"set": "warung", "cam": push([0.0, 1.8, 0.6], [0.35, 1.72, -0.95], 0.18, fov=34),
    "actors": {"bu": bu("worried", headTilt=0.12)}, "props": warung_props(), "icons": [{"type": "q", "at": [0.8, 2.35, -0.9], "t": 0.2}]})
# ================= SEMINGGU =================
S.shot("Seminggu kemudian", {"set": "warung", "sunI": 2.6, "cam": cam([3.6, 1.7, 3.6], [0.5, 1.2, -0.5], p2=[3.2, 1.7, 3.1], fov=40),
    "actors": {"bu": bu()}, "props": warung_props(full=False)})
S.shot("gantungan payungnya", {"set": "warung", "cam": push([2.25, 1.3, 2.0], [2.25, 1.05, 0.55], 0.15, fov=36),
    "actors": {}, "props": {"rack0": P_(pos=RACK), "sign": P_(pos=SIGN, scale=0.55)}})
S.shot("Hujan turun,", {"set": "street", "rain": 1, "exposure": 0.8, "sunI": 1.0, "cam": push([0, 1.2, 3], [0, 2.0, -10], 0.08, fov=45), "actors": {}})
S.shot("pembeli kejebak", {"set": "warung", "rain": 0.6, "sunI": 1.2, "exposure": 0.85, "cam": push([1.3, 1.6, 3.6], [-0.6, 1.6, 1.4], 0.15, fov=36),
    "actors": {"pembeli": {"pos": [-0.6, 0, 1.6], "rot": 30, "expr": "nervous", "anim": "tremble"}, "bu": bu()}, "props": warung_props(full=False)})
S.shot("Pulangnya", {"set": "street", "rain": 1, "exposure": 0.85, "sunI": 1.2, "cam": cam([1.4, 1.3, 1.5], [0, 1.4, -1.5], p2=[1.2, 1.3, -0.5], t2=[0, 1.4, -3.5], fov=40),
    "actors": {"pembeli": {"pos": [0, 0, -0.5], "to": [0, 0, -2.5], "rot": 180, "anim": "walk", "expr": "flat"}},
    "props": {"kresek": P_(pos=[0, 1.95, -0.5], to=[0, 1.95, -2.5], toEase="l")}})
S.shot("di kepala", {"set": "street", "rain": 1, "exposure": 0.85, "sunI": 1.2, "cam": push([0.2, 1.85, 0.9], [0, 1.85, -0.6], 0.15, fov=34),
    "actors": {"pembeli": {"pos": [0, 0, -0.6], "rot": 0, "expr": "flat"}}, "props": {"kresek": P_(pos=[0, 1.97, -0.6])}})
# ================= MAU DILARANG =================
S.shot("Mau dilarang", {"set": "warung", "cam": push([0.5, 1.8, 0.5], [0.35, 1.75, -0.95], 0.2, fov=34),
    "actors": {"bu": bu("annoyed")}, "props": warung_props(full=False)})
S.shot("Salahnya apa", {"set": "warung", "cam": push([-0.2, 1.72, 2.3], [-0.45, 1.58, 1.05], 0.15, fov=36),
    "actors": {"pria": {"pos": CUST, "rot": 15}}, "props": warung_props(), "icons": [{"type": "q", "at": [-0.05, 2.35, 1.1], "t": 0.15}]})
S.shot("Payungnya selalu", {"set": "warung", "cam": push([2.0, 1.25, 2.3], [2.25, 0.85, 0.55], 0.15, fov=36),
    "actors": {}, "props": warung_props()})
S.shot("Kering lagi", {"set": "warung", "cam": push([2.05, 0.95, 1.5], [1.95, 0.75, 0.55], 0.2, fov=32),
    "actors": {}, "props": warung_props()})
# ================= TUKANG OJEK =================
S.shot("Tukang ojek", {"set": "street", "rain": 1, "exposure": 0.85, "sunI": 1.2, "cam": push([0.6, 1.7, 2.0], [2.2, 1.6, -1.0], 0.12, fov=38),
    "actors": {"ojek": {"pos": [2.1, 0, -1.0], "rot": -60}}, "props": {"helm": P_(pos=[2.1, 1.98, -1.0], rot=[0, -60, 0])}})
S.shot("ngeliat kepala", {"set": "street", "rain": 1, "exposure": 0.85, "sunI": 1.2, "cam": cam([3.0, 2.0, -1.6], [0, 1.6, -2.6], fov=42, raw=True),
    "actors": {"ojek": {"pos": [2.1, 0, -1.0], "rot": -60}, "pembeli": {"pos": [-1.0, 0, -2.6], "to": [0.6, 0, -2.6], "rot": 90, "anim": "walk", "expr": "flat"}},
    "props": {"helm": P_(pos=[2.1, 1.98, -1.0], rot=[0, -60, 0]), "kresek": P_(pos=[-1.0, 1.95, -2.6], to=[0.6, 1.95, -2.6], toEase="l")}})
S.shot("terus nahan", {"set": "street", "rain": 1, "exposure": 0.85, "sunI": 1.2, "cam": push([1.4, 1.85, 0.2], [2.1, 1.8, -1.0], 0.2, fov=34),
    "actors": {"ojek": {"pos": [2.1, 0, -1.0], "rot": -60, "expr": "happy", "anim": "laugh"}}, "props": {"helm": P_(pos=[2.1, 1.98, -1.0], rot=[0, -60, 0])}})
S.shot("Helmnya bagus", {"set": "street", "rain": 1, "exposure": 0.85, "sunI": 1.2, "cam": push([1.0, 1.6, 2.4], [0.9, 1.5, -1.6], 0.1, fov=40),
    "actors": {"ojek": {"pos": [1.9, 0, -1.0], "rot": -70, "expr": "happy", "anim": "laugh"}, "pembeli": {"pos": [0.0, 0, -1.8], "rot": 60, "expr": "annoyed"}},
    "props": {"helm": P_(pos=[1.9, 1.98, -1.0], rot=[0, -70, 0]), "kresek": P_(pos=[0.0, 1.95, -1.8], rot=[0, 60, 0])}})
# ================= BESOKNYA / LUSANYA =================
S.shot("Besoknya", {"set": "warung", "cam": cam([-0.9, 2.3, 1.9], [0.4, 0.8, -0.85], p2=[-0.8, 2.2, 1.6], fov=40, raw=True),
    "actors": {"bu": {"pos": [0.6, 0, -1.2], "rot": -150, "anim": "lean"}},
    "props": {"jar": P_(pos=[0.85, TOP, 0.15]), "uc": P_(pos=[0.3, 1.35, -0.75], to=[0.3, 0.05, -0.75], rot=[0, 0, 80], toDur=0.9)}})
S.shot("di balik etalase", {"set": "warung", "cam": cam([-0.5, 0.75, -1.7], [0.3, 0.2, -0.8], p2=[-0.4, 0.7, -1.55], fov=42, raw=True),
    "actors": {}, "props": {"uc": P_(pos=[0.1, 0.06, -0.75], rot=[0, 10, 85]), "uc2": P_(pos=[0.3, 0.06, -0.85], rot=[0, -10, 88]), "uc3": P_(pos=[0.5, 0.06, -0.8], rot=[0, 25, 86])}})
S.shot("Lusanya", {"set": "warung", "cam": push([2.4, 1.5, 3.0], [0.0, 1.35, 0.0], 0.1, fov=38),
    "actors": {"bu": bu("smile"), "pria": {"pos": [-2.0, 0, 1.6], "to": CUST, "toDur": 1.0, "rot": 130, "anim": "walk"}}, "props": warung_props(full=False)})
S.shot("beli satu permen", {"set": "warung", "cam": push([-0.3, 1.45, 0.9], [-0.4, TOP, 0.2], 0.2, fov=34),
    "actors": {}, "props": warung_props(full=False, extra={"candy": P_(pos=[-0.35, TOP + 0.05, 0.3], rot=[0, 30, 0])}),
    "callouts": [{"text": "Rp500", "at": [-0.35, TOP + 0.3, 0.3], "size": 80}]})
S.shot("terus nanya", {"set": "warung", "cam": push([-0.15, 1.72, 2.2], [-0.45, 1.58, 1.05], 0.18, fov=36),
    "actors": {"pria": {"pos": CUST, "rot": 15, "expr": "mouthSmile"}}, "props": warung_props(full=False)})
S.shot("Payungnya di balik", {"set": "warung", "cam": push([0.3, 1.78, 0.45], [0.35, 1.75, -0.95], 0.25, fov=34, ),
    "actors": {"bu": bu("shock", anim="jump")}, "props": warung_props(full=False), "icons": [{"type": "drop", "at": [0.75, 2.2, -0.9], "t": 0.4}]})
# ================= LAMA-LAMA =================
S.shot("Lama-lama", {"set": "street", "cam": push([0.0, 1.3, 4.0], [0, 1.5, -8], 0.08, fov=42),
    "actors": {"pria": {"pos": [0.3, 0, 0.5], "to": [0.3, 0, -4], "rot": 180, "anim": "walk"}},
    "props": {"uc": P_(pos=hand_side([0.3, 0, 0.5], 180), to=hand_side([0.3, 0, -4], 180), toEase="l"), "uc2": P_(pos=add(hand_side([0.3, 0, 0.5], 180), [0.06, 0, 0.04]), to=add(hand_side([0.3, 0, -4], 180), [0.06, 0, 0.04]), toEase="l")}})
S.shot("payung satu gang", {"set": "street", "cam": cam([0, 3.4, 3.0], [0, 0.5, -12], p2=[0, 3.2, 1.5], fov=45),
    "actors": {}, "callouts": [{"text": "10 WARUNG", "x": 540, "y": 520, "size": 76}]})
# ================= SUATU SORE =================
S.shot("Suatu sore", {"set": "street", "sunI": 3.6, "sun": [8, 3.5, 6], "cam": cam([-1.7, 1.8, -2.2], [-2.45, 1.75, -0.45], p2=[-1.8, 1.8, -2.0], fov=38),
    "actors": {"bu": {"pos": [-2.45, 0, -0.45], "rot": 160, "expr": "annoyed", "headTurn": 0.3}}})
S.shot("ngikutin dia", {"set": "street", "sunI": 3.6, "sun": [8, 3.5, 6], "cam": cam([-1.85, 2.15, 0.9], [0.2, 1.3, -9], p2=[-1.85, 2.1, 0.6], fov=40, raw=True),
    "actors": {"bu": {"pos": [-2.55, 0, -0.45], "rot": 170}, "pria": {"pos": [0.4, 0, -7], "to": [0.2, 0, -11], "rot": 180, "anim": "walk"}}})
S.shot("Halte bis", {"set": "halte", "cam": push([-1.2, 1.6, 6.0], [-5.2, 1.5, 0], 0.1, fov=40),
    "actors": {"mbak": {"pos": [-5.6, SW, 0.3], "rot": 30}, "pembeli": {"pos": [-6.2, SW, -0.1], "rot": 40, "expr": "flat"}}})
S.shot("Hujan turun.", {"set": "halte", "rain": 1.2, "exposure": 0.8, "sunI": 0.9, "cam": push([-3.0, 1.6, 2.8], [-5.6, 1.7, 0.3], 0.15, fov=36),
    "actors": {"mbak": {"pos": [-5.6, SW, 0.3], "rot": 40, "expr": "worried"}, "pembeli": {"pos": [-6.2, SW, -0.1], "rot": 40, "expr": "flat"}}})
S.shot("Dia buka payung", {"set": "halte", "rain": 1.2, "exposure": 0.8, "sunI": 0.9, "cam": push([-2.4, 1.9, 2.6], [-4.0, 2.0, 1.0], 0.15, fov=36),
    "actors": {"pria": {"pos": [-4.0, SW, 1.0], "rot": 50, "armR": [-2.4, 0.2]}},
    "props": {"uo": P_(pos=hand_up([-4.0, SW, 1.0], 50), grow=0.35)}})
S.shot("Payung, Mbak", {"set": "halte", "rain": 1.2, "exposure": 0.8, "sunI": 0.9, "cam": push([-2.3, 1.7, 3.8], [-4.9, 1.6, 0.6], 0.1, fov=38),
    "actors": {"pria": {"pos": [-4.2, SW, 1.0], "rot": -70, "armR": [-2.4, 0.2], "expr": "mouthSmile"}, "mbak": {"pos": [-5.6, SW, 0.3], "rot": 60, "expr": "worried"}},
    "props": {"uo": P_(pos=hand_up([-4.2, SW, 1.0], -70))}})
S.shot("Tiga ribu", {"set": "halte", "rain": 1.2, "exposure": 0.8, "sunI": 0.9, "cam": push([-3.4, 1.85, 2.4], [-4.2, 1.7, 1.0], 0.15, fov=36),
    "actors": {"pria": {"pos": [-4.2, SW, 1.0], "rot": 30, "armR": [-2.4, 0.2], "expr": "mouthOpen"}},
    "props": {"uo": P_(pos=hand_up([-4.2, SW, 1.0], 30))}, "callouts": [{"text": "3 RB", "x": 540, "y": 560, "size": 110}]})
S.shot("Satu orang", {"set": "halte", "rain": 1.2, "exposure": 0.8, "sunI": 0.9, "cam": cam([-1.0, 1.5, 4.5], [-2.5, 1.4, -1], p2=[-1.0, 1.5, 3.5], t2=[-2.0, 1.4, -3], fov=40),
    "actors": {"pria": {"pos": [-3.0, 0, 0.5], "to": [-2.0, 0, -3.0], "rot": 165, "armR": [-2.4, 0.2], "anim": "walk"}, "mbak": {"pos": [-2.4, 0, 0.6], "to": [-1.4, 0, -2.9], "rot": 165, "anim": "walk"}},
    "props": {"uo": P_(pos=hand_up([-3.0, 0, 0.5], 165), to=hand_up([-2.0, 0, -3.0], 165), toEase="l")}})
S.shot("sekali jalan", {"set": "halte", "rain": 1.2, "exposure": 0.8, "sunI": 0.9, "cam": push([0.5, 3.0, 4.0], [-1.5, 0.5, -6], 0.05, fov=42),
    "actors": {"pria": {"pos": [-2.0, 0, -3.0], "to": [-1.6, 0, -5.0], "rot": 170, "armR": [-2.4, 0.2], "anim": "walk"}, "mbak": {"pos": [-1.4, 0, -2.9], "to": [-1.0, 0, -4.9], "rot": 170, "anim": "walk"}},
    "props": {"uo": P_(pos=hand_up([-2.0, 0, -3.0], 170), to=hand_up([-1.6, 0, -5.0], 170), toEase="l")}})
# ================= NYERAH =================
S.shot("Bu Ratna nyerah", {"set": "warung", "cam": push([0.35, 1.8, 0.45], [0.35, 1.72, -0.95], 0.2, fov=34),
    "actors": {"bu": bu("dizzy")}, "props": warung_props(full=False)})
S.shot("sebulan penuh", {"set": "warung", "cam": push([2.2, 2.0, -1.9], [2.2, 2.0, -2.94], 0.25, fov=36), "actors": {}, "props": {}})
# ================= AKHIR BULAN (twist) =================
S.shot("Akhir bulan", {"set": "warung", "sunI": 3.6, "cam": push([2.6, 1.5, 3.2], [0.0, 1.3, 0.3], 0.1, fov=38),
    "actors": {"bu": bu(), "pria": {"pos": [-2.2, 0, 1.6], "to": [-0.6, 0, 1.15], "toDur": 1.3, "rot": 120, "anim": "walk"}},
    "props": warung_props(full=False, extra={"lbag": P_(pos=[-2.2, 1.2, 1.4], to=[-0.6, 1.2, 0.95], toDur=1.3, toEase="l", rot=[0, 120, 0])})})
S.shot("Orangnya belum", {"set": "warung", "cam": push([0.4, 1.8, 0.5], [0.35, 1.72, -0.95], 0.2, fov=34),
    "actors": {"bu": bu("annoyed")}, "props": warung_props(full=False)})
S.shot("Datangnya sore", {"set": "warung", "sunI": 3.8, "cam": push([-0.2, 1.4, 4.2], [-0.6, 1.2, 1.15], 0.12, fov=38),
    "actors": {"pria": {"pos": [-0.6, 0, 1.15], "rot": 10}}, "rain": 0.25,
    "props": warung_props(full=False, extra={"lbag": P_(pos=[-0.22, 1.05, 1.1], rot=[0, 10, 0])})})
S.shot("tasnya panjang", {"set": "warung", "cam": push([0.5, 1.35, 2.5], [-0.3, 1.15, 1.1], 0.15, fov=38),
    "actors": {"pria": {"pos": [-0.6, 0, 1.15], "rot": 10}}, "props": warung_props(full=False, extra={"lbag": P_(pos=[-0.22, 1.05, 1.1], rot=[0, 10, 0])})})
S.shot("Payungnya kurang", {"set": "warung", "cam": push([-0.35, 1.75, 2.4], [-0.6, 1.62, 1.15], 0.15, fov=36),
    "actors": {"pria": {"pos": [-0.6, 0, 1.15], "rot": 10, "expr": "mouthOpen"}}, "props": warung_props(full=False, extra={"lbag": P_(pos=[-0.22, 1.05, 1.1], rot=[0, 10, 0])})})
S.shot("Dia senyum", {"set": "warung", "cam": push([-0.45, 1.75, 2.1], [-0.6, 1.62, 1.15], 0.2, fov=34),
    "actors": {"pria": {"pos": [-0.6, 0, 1.15], "rot": 10, "expr": "mouthSmile", "anim": "laugh"}}, "props": warung_props(full=False)})
S.shot("buka satu dus", {"set": "warung", "cam": cam([1.1, 2.0, 1.9], [0.0, TOP + 0.15, 0.1], p2=[0.95, 1.95, 1.7], fov=40, raw=True),
    "actors": {"pria": {"pos": [-0.6, 0, 1.15], "rot": 160, "give": True}}, "props": {"dus": P_(pos=[0.0, TOP, 0.1], grow=0.25)}})
S.shot("Isinya payung", {"set": "warung", "cam": cam([0.05, 2.7, 1.25], [0.0, TOP + 0.1, 0.1], p2=[0.05, 2.55, 1.1], fov=40, raw=True),
    "actors": {}, "props": {"dus": P_(pos=[0.0, TOP, 0.1])}})
S.shot("biru", {"set": "warung", "cam": push([0.3, 1.8, 0.5], [0.35, 1.75, -0.95], 0.2, fov=34),
    "actors": {"bu": bu("shock")}, "props": {"dus": P_(pos=[0.0, TOP, 0.1])}}, offset=0.1)
# ================= KONON (hitungan) =================
S.shot("Konon", {"set": "street", "sunI": 3.4, "sun": [8, 3.5, 6], "cam": push([0.3, 1.7, 2.4], [0, 1.6, -0.2], 0.15, fov=36),
    "actors": {"pria": {"pos": [0, 0, -0.2], "rot": 0, "expr": "mouthSmile"}},
    "props": {"uc": P_(pos=hand_side([0, 0, -0.2], 0)), "lbag": P_(pos=[-0.25, 1.2, -0.45], rot=[0, 0, 0])}})
S.shot("Sepuluh payung", {"set": "halte", "rain": 1.0, "exposure": 0.8, "sunI": 0.9, "cam": push([-2.6, 1.75, 2.8], [-4.2, 1.65, 0.8], 0.12, fov=38),
    "actors": {"pria": {"pos": [-4.2, SW, 0.8], "rot": 30, "armR": [-2.4, 0.2], "expr": "mouthSmile"}},
    "props": {"uo": P_(pos=hand_up([-4.2, SW, 0.8], 30))},
    "math": {"lines": ["10 PAYUNG", "× 10 JALAN"], "at": [0.0, 1.3]}})
S.shot("Tiga ribu sekali", {"set": "halte", "rain": 1.0, "exposure": 0.8, "sunI": 0.9, "cam": push([-2.9, 1.8, 2.2], [-4.2, 1.7, 0.8], 0.15, fov=36),
    "actors": {"pria": {"pos": [-4.2, SW, 0.8], "rot": 30, "armR": [-2.4, 0.2], "expr": "mouthSmile"}},
    "props": {"uo": P_(pos=hand_up([-4.2, SW, 0.8], 30))},
    "math": {"lines": ["10 PAYUNG", "× 10 JALAN", "× Rp3.000"], "at": [0, 0, 0.1]}})
S.shot("Tiga ratus ribu", {"set": "halte", "rain": 1.0, "exposure": 0.8, "sunI": 0.9, "cam": push([-3.1, 1.85, 1.9], [-4.2, 1.72, 0.8], 0.18, fov=36),
    "actors": {"pria": {"pos": [-4.2, SW, 0.8], "rot": 30, "armR": [-2.4, 0.2], "expr": "happy"}},
    "props": {"uo": P_(pos=hand_up([-4.2, SW, 0.8], 30))},
    "math": {"lines": ["10 PAYUNG", "× 10 JALAN", "× Rp3.000"], "at": [0, 0, 0], "result": "300 RB", "resultAt": 0.3}})
S.shot("Musim hujan", {"set": "street", "rain": 1.0, "exposure": 0.8, "sunI": 1.0, "cam": cam([0, 3.0, 4.0], [0, 1.0, -10], p2=[0, 2.6, 2.0], fov=44),
    "actors": {}, "math": {"lines": ["300 RB", "× 90 HARI"], "at": [0, 0.5]}})
S.shot("dua puluh tujuh", {"set": "warung", "cam": push([1.2, 1.6, 4.4], [0.0, 1.35, 0.3], 0.15, fov=38),
    "actors": {"bu": bu("shock"), "pria": {"pos": CUST, "rot": 30, "expr": "mouthSmile"}}, "props": warung_props(full=False),
    "callouts": [{"text": "27 JUTA", "x": 540, "y": 520, "size": 120, "color": "#5fd35a", "grow": True}]})
# ================= ITULAH KENAPA =================
S.shot("Itulah kenapa", {"set": "halte", "rain": 1.0, "exposure": 0.8, "sunI": 0.9, "cam": push([-1.6, 1.6, 4.4], [-4.0, 1.7, 0.9], 0.12, fov=38),
    "actors": {"pria": {"pos": [-4.0, SW, 0.9], "rot": 40, "armR": [-2.4, 0.2], "expr": "mouthOnly"}},
    "props": {"uo": P_(pos=hand_up([-4.0, SW, 0.9], 40))}})
S.shot("Yang dia jual", {"set": "halte", "rain": 1.3, "exposure": 0.78, "sunI": 0.9, "cam": push([-3.0, 1.85, 2.1], [-4.0, 1.72, 0.9], 0.22, fov=36),
    "actors": {"pria": {"pos": [-4.0, SW, 0.9], "rot": 40, "armR": [-2.4, 0.2], "expr": "mouthSmile"}},
    "props": {"uo": P_(pos=hand_up([-4.0, SW, 0.9], 40))}})
# ================= OH IYA (tag) =================
S.shot("Oh iya", {"set": "warung", "sunI": 3.6, "cam": push([3.4, 1.6, 3.6], [1.2, 1.2, 0.3], 0.1, fov=40),
    "actors": {"bu": bu("flat"), "pria": {"pos": [1.6, 0, 1.4], "rot": 150, "armR": [-0.9, 0.2]}}, "props": warung_props()})
S.shot("Langitnya cerah.", {"set": "warung", "sunI": 3.8, "cam": push([0.35, 1.8, 0.45], [0.35, 1.72, -0.95], 0.2, fov=34),
    "actors": {"bu": bu("flat")}, "props": warung_props(full=False), "icons": [{"type": "drop", "at": [0.75, 2.2, -0.9], "t": 0.3}]})

YELLOW = ["payung,", "payung", "payung.", "Gratis.", "pertama,", "kosong.", "kresek", "kresek,", "dilarang?", "ketawa.", "etalase.", "permen,",
          "sore.", "jauh.", "nyerah.", "basah,", "panjang.", "biru.", "ribu.\"", "sehari.", "juta.", "hujannya.", "cerah.", "Konon,", "kejebak."]
S.build(sys.argv[2], yellow=YELLOW)
print("ok", len(S.shots), "shots")
