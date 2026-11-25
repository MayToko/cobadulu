"""Uji coba skill: "Kenapa Ada Orang yang Cuma Numpang Ngecas di Warung Kopi?"
python3 build.py words.json story.json      (TEMPO=1.1)
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "engine"))
import story_lib
story_lib.DIST = 1.7
from story_lib import Story, cam, push, add

S = Story(sys.argv[1], tempo=1.1)
S.cast = {
    "pria":    {"body": "#4f5d3a", "hair": "cover", "bag": "#5a3a20", "limb": "#1f2550", "expr": "mouthOnly"},
    "sari":    {"body": "#6a3a8c", "hair": "bob", "collar": "#d0402f", "limb": "#2a1a30"},
    "ojek":    {"body": "#2f5fb0", "hair": "bowl", "limb": "#1f2550"},
    "ojek2":   {"body": "#c0392b", "hair": "bowl", "limb": "#1f2550", "expr": "smile"},
    "ojek3":   {"body": "#d4a23a", "hair": "bowl", "limb": "#1f2550", "expr": "content"},
    "pembeli": {"body": "#3f8f3a", "hair": "peci", "limb": "#1f2550"},
}
S.props = {
    "table": {"type": "table", "args": [0.9, 0.8, 0.7, "#c9741f"]},
    "stool": {"type": "stool"},
    "phone": {"type": "phone"},
    "socket": {"type": "socket"},
    "cable": {"type": "cable", "args": [0.55]},
    "termos": {"type": "termos"},
    "termos2": {"type": "termos", "args": ["#2e6f9e"]},
    "cup": {"type": "coffee"}, "cup2": {"type": "coffee"},
    "lakban": {"type": "lakban"},
    "goreng": {"type": "gorengan"},
    "pbs": {"type": "pbPile", "args": [20]},
    "pb1": {"type": "powerbank", "args": ["#c0392b"]}, "pb2": {"type": "powerbank", "args": ["#2e6f9e"]},
    "bill": {"type": "bill"},
    "env": {"type": "envelope"},
    "helm": {"type": "helmet", "args": ["#3f8a4a"]}, "helm2": {"type": "helmet", "args": ["#d0402f"]}, "helm3": {"type": "helmet", "args": ["#2a2a2a"]},
    "tree": {"type": "tree", "args": [1.2]},
}
TOP = 1.11
SARI = [0.35, 0, -0.95]
TBL = [-2.0, 0, 0.55]; TT = 0.825          # meja pelanggan + tinggi permukaannya
SEAT = [-2.6, 0, 0.55]                      # posisi duduk (menghadap +x ke meja)
SOCK = [-1.235, 0.98, 0.55]                  # colokan di sisi kiri etalase
P_ = lambda **k: k
sari = lambda expr="neutral", **k: {"pos": SARI, "rot": 0, "expr": expr, **k}
def base(extra=None, termos=True):
    d = {"table": P_(pos=TBL), "stool": P_(pos=[SEAT[0], 0, SEAT[2]]), "socket": P_(pos=SOCK, rot=[0, -90, 0]),
         "phone": P_(pos=[TBL[0] + 0.15, TT + 0.01, TBL[2]], rot=[0, 80, 0]),
         "cable": P_(pos=[(SOCK[0] + TBL[0] + 0.15) / 2, TT + 0.01, TBL[2]], scale=0.9)}
    if termos: d["termos"] = P_(pos=[0.75, TOP, 0.05])
    if extra: d.update(extra)
    return d
sit = lambda expr="mouthOnly", rot=90: {"pos": SEAT, "rot": rot, "anim": "sit", "expr": expr}

# ===== HOOK
S.shot("Dia datang", {"set": "street", "cam": cam([0.4, 0.9, 3.2], [0, 1.4, -6], p2=[0.3, 0.95, 2.4], fov=40),
    "actors": {"pria": {"pos": [0, 0, -5], "to": [0, 0, -2.2], "anim": "walk"}}})
S.shot("tiap pagi", {"set": "warung", "cam": push([1.6, 1.5, 4.2], [-0.8, 1.2, 0.3], 0.1, fov=40),
    "actors": {"sari": sari("smile"), "pria": {"pos": [-3.5, 0, 2.2], "to": [-2.45, 0, 1.2], "rot": 140, "anim": "walk"}}, "props": base()})
S.shot("Nggak pesan", {"set": "warung", "cam": push([-0.2, 1.7, 2.6], [-0.45, 1.55, 1.0], 0.15, fov=36),
    "actors": {"pria": {"pos": [-0.45, 0, 1.0], "rot": 15}, "sari": sari()}, "props": base()})
S.shot("Cuma numpang", {"set": "warung", "cam": cam([-1.75, 1.25, 1.55], [-1.3, 0.95, 0.55], p2=[-1.7, 1.2, 1.35], fov=38, raw=True),
    "actors": {}, "props": base()})
S.shot("terus duduk", {"set": "warung", "cam": push([-1.0, 1.5, 3.6], [-2.1, 1.1, 0.55], 0.12, fov=38),
    "actors": {"pria": sit(), "sari": sari()}, "props": base()})
# ===== ATURAN
S.shot("Jadi gini", {"set": "warung", "cam": push([1.4, 1.6, 5.0], [-0.4, 1.25, 0.0], 0.12, fov=42),
    "actors": {"sari": sari("smile"), "pria": sit()}, "props": base()})
S.shot("colokannya cuma", {"set": "warung", "cam": cam([-1.65, 1.15, 1.3], [-1.25, 0.98, 0.55], p2=[-1.6, 1.12, 1.15], fov=36, raw=True),
    "actors": {}, "props": base(), "callouts": [{"text": "1", "at": [-1.25, 1.3, 0.55], "size": 120, "arrow": False}]})
S.shot("Buat termos", {"set": "warung", "cam": cam([0.95, 1.55, 1.3], [0.75, 1.3, 0.05], p2=[0.9, 1.5, 1.1], fov=36, raw=True),
    "actors": {"sari": sari()}, "props": base()})
# ===== HARI PERTAMA
S.shot("Hari pertama", {"set": "warung", "cam": push([0.35, 1.7, 0.45], [0.35, 1.58, -0.95], 0.2, fov=36),
    "actors": {"sari": sari("neutral", exprAt=[[0.6, "worried"]])}, "props": base()})
S.shot("kok nggak", {"set": "warung", "cam": push([1.6, 1.55, 3.6], [-0.9, 1.3, -0.2], 0.1, fov=40),
    "actors": {"sari": sari("talk", rot=-40), "pria": sit()}, "props": base(),
    "icons": [{"type": "q", "at": [0.9, 2.35, -0.9], "t": 0.3}]})
# ===== SEMINGGU
S.shot("Seminggu kemudian", {"set": "warung", "sunI": 2.6, "cam": cam([3.4, 1.7, 3.8], [-0.5, 1.2, -0.2], p2=[3.0, 1.7, 3.3], fov=42),
    "actors": {"sari": sari(), "pria": sit()}, "props": base()})
S.shot("termosnya dingin", {"set": "warung", "cam": cam([0.95, 1.5, 1.1], [0.75, 1.3, 0.05], p2=[0.9, 1.45, 0.9], fov=34, raw=True),
    "actors": {}, "props": base(), "icons": [{"type": "drop", "at": [0.95, 1.75, 0.1], "t": 0.2}]})
S.shot("Pembeli pesan", {"set": "warung", "cam": push([0.6, 1.7, 3.2], [-0.2, 1.5, 1.0], 0.12, fov=38),
    "actors": {"pembeli": {"pos": [-0.2, 0, 1.0], "rot": 20, "armR": [-1.9, 0.3], "expr": "flat"}, "sari": sari()},
    "props": base(extra={"cup": P_(pos=[0.1, 1.42, 1.25])})})
S.shot("kopi suam", {"set": "warung", "cam": push([0.15, 1.42, 1.7], [0.1, 1.45, 1.25], 0.2, fov=34),
    "actors": {"pembeli": {"pos": [-0.2, 0, 1.0], "rot": 20, "armR": [-1.9, 0.3], "expr": "worried"}},
    "props": {"cup": P_(pos=[0.1, 1.42, 1.25])}})
# ===== DILEMA
S.shot("Mau diusir", {"set": "warung", "cam": push([0.45, 1.7, 0.5], [0.35, 1.58, -0.95], 0.2, fov=36),
    "actors": {"sari": sari("annoyed")}, "props": base()})
S.shot("Salahnya apa", {"set": "warung", "cam": push([-1.75, 1.7, 1.9], [-2.6, 1.6, 0.55], 0.15, fov=36),
    "actors": {"pria": sit(rot=40)}, "props": base(), "icons": [{"type": "q", "at": [-2.0, 2.0, 0.6], "t": 0.2}]})
S.shot("nggak pernah ribut", {"set": "warung", "cam": push([-0.4, 1.4, 3.4], [-2.0, 1.0, 0.55], 0.12, fov=40),
    "actors": {"pria": sit()}, "props": base()})
S.shot("Duduknya juga", {"set": "warung", "cam": push([-1.85, 1.7, 1.9], [-2.6, 1.6, 0.55], 0.18, fov=36),
    "actors": {"pria": sit(expr="mouthSmile", rot=50)}, "props": base()})
# ===== FIGURAN
S.shot("Tukang ojek", {"set": "warung", "cam": push([1.0, 1.6, 3.6], [0.3, 1.5, 1.05], 0.12, fov=38),
    "actors": {"ojek": {"pos": [-0.8, 0, 1.6], "to": [0.3, 0, 1.05], "toDur": 1.0, "rot": 120, "anim": "walk"}, "sari": sari()},
    "props": base(extra={"helm": P_(pos=[-0.8, 1.98, 1.6], to=[0.3, 1.98, 1.05], toDur=1.0, toEase="l", rot=[0, 120, 0])})})
S.shot("nyeruput", {"set": "warung", "cam": push([0.55, 1.75, 2.6], [0.3, 1.6, 1.05], 0.18, fov=36),
    "actors": {"ojek": {"pos": [0.3, 0, 1.05], "rot": 15, "armR": [-2.0, 0.6], "expr": "flat"}},
    "props": {"helm": P_(pos=[0.3, 1.98, 1.05], rot=[0, 15, 0]), "cup": P_(pos=[0.42, 1.55, 1.4])}})
S.shot("terus nahan", {"set": "warung", "cam": push([0.55, 1.75, 2.4], [0.3, 1.62, 1.05], 0.2, fov=34),
    "actors": {"ojek": {"pos": [0.3, 0, 1.05], "rot": 15, "expr": "happy", "anim": "laugh"}},
    "props": {"helm": P_(pos=[0.3, 1.98, 1.05], rot=[0, 15, 0])}})
S.shot("Ini es kopi", {"set": "warung", "cam": push([1.6, 1.6, 3.2], [0.3, 1.45, 0.0], 0.1, fov=38),
    "actors": {"ojek": {"pos": [-0.1, 0, 1.05], "rot": 150, "expr": "talk"}, "sari": sari("flat")},
    "props": base(extra={"helm": P_(pos=[-0.1, 1.98, 1.05], rot=[0, 150, 0]), "cup": P_(pos=[0.25, TOP, 0.3])})})
# ===== BALASAN
S.shot("Besoknya", {"set": "warung", "cam": cam([-1.65, 1.15, 1.25], [-1.24, 0.98, 0.55], p2=[-1.6, 1.12, 1.1], fov=36, raw=True),
    "actors": {}, "props": base(extra={"lakban": P_(pos=[-1.26, 0.98, 0.55], rot=[0, -90, 0], grow=0.2)})})
S.shot("Lusanya", {"set": "warung", "cam": push([1.4, 1.5, 3.4], [-0.3, 1.3, 0.3], 0.1, fov=40),
    "actors": {"sari": sari("smile"), "pria": {"pos": [-2.0, 0, 1.6], "to": [-0.45, 0, 1.05], "toDur": 1.0, "rot": 120, "anim": "walk"}},
    "props": base(extra={"lakban": P_(pos=[-1.26, 0.98, 0.55], rot=[0, -90, 0])})})
S.shot("beli satu gorengan", {"set": "warung", "cam": push([-0.3, 1.5, 1.0], [-0.35, TOP, 0.2], 0.2, fov=36),
    "actors": {}, "props": {"goreng": P_(pos=[-0.35, TOP + 0.02, 0.2])}, "callouts": [{"text": "Rp1.000", "at": [-0.35, TOP + 0.32, 0.2], "size": 80}]})
S.shot("terus nanya", {"set": "warung", "cam": push([-0.15, 1.72, 2.2], [-0.45, 1.58, 1.05], 0.18, fov=36),
    "actors": {"pria": {"pos": [-0.45, 0, 1.05], "rot": 15, "expr": "mouthSmile"}}, "props": base()})
S.shot("Lakbannya boleh", {"set": "warung", "cam": push([0.3, 1.72, 0.45], [0.35, 1.6, -0.95], 0.25, fov=36),
    "actors": {"sari": sari("shock", anim="jump")}, "props": base(), "icons": [{"type": "drop", "at": [0.75, 2.2, -0.9], "t": 0.4}]})
# ===== MELUAS
S.shot("Lama-lama", {"set": "street", "sunI": 3.4, "sun": [8, 3.5, 6], "cam": push([0.0, 1.3, 4.0], [0, 1.5, -8], 0.08, fov=42),
    "actors": {"pria": {"pos": [0.3, 0, 0.5], "to": [0.3, 0, -3.5], "rot": 180, "anim": "walk", "headTilt": 0.1}}})
S.shot("makin berat", {"set": "street", "sunI": 3.4, "sun": [8, 3.5, 6], "cam": push([0.9, 1.0, 0.2], [0.3, 0.85, -1.3], 0.15, fov=38),
    "actors": {"pria": {"pos": [0.3, 0, -1.2], "rot": 160, "anim": "tremble"}}, "callouts": [{"text": "BERAT", "x": 540, "y": 480, "size": 90, "arrow": False}]})
# ===== INVESTIGASI
S.shot("Suatu siang", {"set": "warung", "cam": cam([-0.6, 1.55, 0.9], [0.35, 1.3, -0.95], p2=[-0.5, 1.5, 0.7], fov=38, raw=True),
    "actors": {"sari": {"pos": [0.35, -0.45, -0.95], "rot": -30, "expr": "annoyed"}}, "props": base()})
S.shot("Tasnya dibuka", {"set": "warung", "cam": cam([0.6, 2.1, -1.7], [-1.9, 1.0, 0.6], p2=[0.4, 2.05, -1.5], fov=40, raw=True),
    "actors": {"sari": {"pos": [0.35, -0.45, -0.95], "rot": -50, "expr": "annoyed"}, "pria": sit(rot=60)}, "props": base()})
S.shot("Isinya powerbank", {"set": "warung", "cam": cam([-2.0, 1.95, 1.35], [-2.0, TT, 0.55], p2=[-2.0, 1.8, 1.2], fov=40, raw=True),
    "actors": {}, "props": {"table": P_(pos=TBL), "pbs": P_(pos=[-2.0, TT + 0.01, 0.55], grow=0.3)}})
S.shot("Dua puluh biji", {"set": "warung", "cam": cam([-1.65, 1.6, 1.5], [-2.0, TT + 0.1, 0.55], p2=[-1.7, 1.5, 1.3], fov=38, raw=True),
    "actors": {}, "props": {"table": P_(pos=TBL), "pbs": P_(pos=[-2.0, TT + 0.01, 0.55])},
    "callouts": [{"text": "20", "at": [-2.0, TT + 0.45, 0.55], "size": 130, "arrow": False}]})
S.shot("Satu penuh", {"set": "warung", "cam": cam([-1.7, 1.25, 1.5], [-1.4, 0.95, 0.55], p2=[-1.65, 1.2, 1.3], fov=38, raw=True),
    "actors": {}, "props": base(extra={"pb1": P_(pos=[-1.7, TT + 0.01, 0.6], to=[-1.7, TT + 0.3, 0.9], toDur=0.6),
                                        "pb2": P_(pos=[-1.7, TT + 0.3, 0.3], to=[-1.7, TT + 0.01, 0.45], toStart=0.6, toDur=0.6)})})
# ===== MENYERAH
S.shot("Bu Sari nyerah", {"set": "warung", "cam": push([0.35, 1.7, 0.45], [0.35, 1.58, -0.95], 0.2, fov=36),
    "actors": {"sari": sari("dizzy")}, "props": base()})
S.shot("sebulan penuh", {"set": "warung", "cam": push([2.2, 2.0, -1.9], [2.2, 2.0, -2.94], 0.25, fov=36), "actors": {}, "props": {}})
# ===== TWIST
S.shot("Akhir bulan", {"set": "warung", "cam": cam([0.5, 1.9, 1.1], [0.2, TOP, 0.1], p2=[0.45, 1.8, 0.95], fov=38, raw=True),
    "actors": {}, "props": {"bill": P_(pos=[0.2, TOP + 0.01, 0.1], rot=[0, 10, 0])}, "callouts": [{"text": "Rp500 RB", "at": [0.2, TOP + 0.35, 0.1], "size": 80, "color": "#ff6a4a"}]})
S.shot("Bu Sari lemas", {"set": "warung", "cam": push([0.35, 1.65, 0.45], [0.35, 1.5, -0.95], 0.2, fov=36),
    "actors": {"sari": sari("worried", anim="lean")}, "props": base()})
S.shot("Tapi di bawah", {"set": "warung", "cam": cam([-1.7, 1.55, 1.35], [-2.0, TT, 0.55], p2=[-1.72, 1.5, 1.2], fov=36, raw=True),
    "actors": {}, "props": {"table": P_(pos=TBL), "env": P_(pos=[-2.0, TT + 0.01, 0.55], rot=[0, 15, 0]), "cup": P_(pos=[-2.05, TT + 0.02, 0.5])}})
S.shot("Isinya uang", {"set": "warung", "cam": push([0.35, 1.7, 0.45], [0.35, 1.58, -0.95], 0.2, fov=36),
    "actors": {"sari": sari("shock")}, "props": base()})
S.shot("lebih dua kali", {"set": "warung", "cam": cam([-1.7, 1.5, 1.35], [-2.0, TT, 0.55], p2=[-1.72, 1.42, 1.15], fov=36, raw=True),
    "actors": {}, "props": {"table": P_(pos=TBL), "env": P_(pos=[-2.0, TT + 0.01, 0.55], rot=[0, 15, 0])},
    "callouts": [{"text": "×2", "at": [-2.0, TT + 0.35, 0.55], "size": 130, "color": "#5fd35a", "grow": True}]})
# ===== KONON + HITUNGAN
pangkalan = lambda: {"ojek": {"pos": [-1.0, 0, -2.2], "rot": 30, "expr": "happy"}, "ojek2": {"pos": [-0.2, 0, -2.6], "rot": 10},
                     "ojek3": {"pos": [0.7, 0, -2.3], "rot": -20}, "pria": {"pos": [0.2, 0, -0.9], "rot": 180, "give": True}}
helms = lambda: {"helm": P_(pos=[-1.0, 1.98, -2.2], rot=[0, 30, 0]), "helm2": P_(pos=[-0.2, 1.98, -2.6], rot=[0, 10, 0]),
                 "helm3": P_(pos=[0.7, 1.98, -2.3], rot=[0, -20, 0]), "tree": P_(pos=[-1.6, 0, -3.6])}
S.shot("Konon", {"set": "street", "sunI": 3.2, "cam": push([1.6, 1.7, 2.8], [-0.2, 1.4, -2.0], 0.1, fov=42),
    "actors": pangkalan(), "props": {**helms(), "pb1": P_(pos=[0.25, 1.15, -1.4])}})
S.shot("Dua puluh powerbank", {"set": "street", "sunI": 3.2, "cam": push([0.9, 1.5, 0.9], [-0.2, 1.4, -2.4], 0.12, fov=40),
    "actors": pangkalan(), "props": helms(), "math": {"lines": ["20 POWERBANK"], "at": [0.0]}})
S.shot("Lima ribu", {"set": "street", "sunI": 3.2, "cam": push([-0.4, 1.75, -0.6], [-1.0, 1.6, -2.2], 0.15, fov=36),
    "actors": pangkalan(), "props": helms(), "math": {"lines": ["20 POWERBANK", "× Rp5.000"], "at": [0, 0.1]}})
S.shot("Seratus ribu", {"set": "street", "sunI": 3.2, "cam": cam([1.5, 1.8, 0.8], [-0.2, 1.55, -2.6], p2=[1.3, 1.78, 0.5], fov=38, raw=True),
    "actors": pangkalan(), "props": helms(), "math": {"lines": ["20 POWERBANK", "× Rp5.000"], "at": [0, 0], "result": "100 RB", "resultAt": 0.2}})
S.shot("Sebulan tiga", {"set": "warung", "cam": push([-0.8, 1.5, 3.0], [-2.1, 1.1, 0.55], 0.12, fov=38),
    "actors": {"pria": sit(expr="mouthSmile")}, "props": base(), "math": {"lines": ["100 RB", "× 30 HARI"], "at": [0, 0.15], "result": "3 JUTA", "resultAt": 0.5}})
S.shot("Listriknya cuma", {"set": "warung", "cam": cam([0.5, 1.9, 1.1], [0.2, TOP, 0.1], p2=[0.45, 1.8, 0.95], fov=38, raw=True),
    "actors": {}, "props": {"bill": P_(pos=[0.2, TOP + 0.01, 0.1], rot=[0, 10, 0])},
    "callouts": [{"text": "500 RB", "at": [0.2, TOP + 0.35, 0.1], "size": 90, "color": "#ff6a4a"}]})
# ===== ITULAH KENAPA
S.shot("Itulah kenapa", {"set": "warung", "cam": push([-1.75, 1.7, 2.0], [-2.6, 1.6, 0.55], 0.15, fov=36),
    "actors": {"pria": sit(rot=45)}, "props": base()})
S.shot("Yang dia jual", {"set": "warung", "cam": cam([-1.65, 1.15, 1.25], [-1.25, 0.98, 0.55], p2=[-1.58, 1.1, 1.05], fov=36, raw=True),
    "actors": {}, "props": base(), "icons": [{"type": "bang", "at": [-1.25, 1.3, 0.6], "t": 0.6, "size": 1.3}]})
# ===== TAG
S.shot("Oh iya", {"set": "warung", "sunI": 3.6, "cam": push([1.4, 1.6, 4.0], [-0.6, 1.25, 0.6], 0.1, fov=40),
    "actors": {"sari": sari("flat"), "pria": {"pos": [-2.6, 0, 1.6], "to": [-2.2, 0, 1.0], "toDur": 1.0, "rot": 140, "anim": "walk"}},
    "props": base(extra={"termos2": P_(pos=[-2.3, 0.2, 1.75], to=[-1.9, 0.2, 1.15], toDur=1.0, toEase="l")})})
S.shot("Kali ini", {"set": "warung", "cam": push([-1.2, 1.4, 2.6], [-2.1, 1.0, 0.55], 0.15, fov=38),
    "actors": {"pria": sit(expr="mouthSmile")}, "props": base(extra={"termos2": P_(pos=[-1.65, TT, 0.35])})})
S.shot("termos sendiri", {"set": "warung", "sunI": 3.6, "cam": push([0.35, 1.7, 0.45], [0.35, 1.58, -0.95], 0.2, fov=36),
    "actors": {"sari": sari("flat")}, "props": base(), "icons": [{"type": "drop", "at": [0.75, 2.2, -0.9], "t": 0.3}]})

YELLOW = ["ngecas,", "ngecas.", "satu.", "termos", "pertama,", "dingin.", "suam.", "diusir?", "apa?", "ketawa.", "lakban.", "gorengan,",
          "berat", "powerbank.", "biji.", "nyerah.", "lemas.", "amplop.", "lipat.", "sehari.", "juta.", "ribu.", "setrumnya.", "sendiri."]
S.build(sys.argv[2], yellow=YELLOW)
print("ok", len(S.shots), "shots")
