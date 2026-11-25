---
name: kenapa-ada-shorts
description: Membuat YouTube Shorts/Reels/TikTok 9:16 (±95–110 dtk) bergaya animasi kartun 3D penuh (wajah 3D, PBR, AO, depth of field, teks & partikel 3D) "Kenapa Ada Orang/Pelanggan yang Cuma …?" — tokoh kepala bulat krem ber-outline tebal, tokoh misterius berponi menutupi mata, warung kayu bercahaya sore hangat, caption 1–2 kata Poppins putih/kuning, callout angka kuning, rumus hitungan pojok kanan atas, narasi santai cepat, lokasi & suasana (pagi/siang/sore/malam/hujan + emosi) berganti mengikuti narasi agar tidak monoton. Meniru persis 3 video referensi (koin kembalian, es teh tawar 5 jam, mancing lepas ikan) dari ide → naskah 13 beat → suara ElevenLabs → storyboard → render Three.js → grading → mix audio → MP4 1080×1920 30 fps. Pakai saat pengguna minta "video kenapa ada", "cerita pelanggan aneh", "shorts kartun warung", "video seperti referensi koin/es teh/mancing", atau /kenapa-ada-shorts.
---

# Kenapa-Ada Shorts

Skill ini adalah hasil bedah 3 video referensi. **Baca dulu**:
- `references/style-bible.md` — spesifikasi terukur: karakter, VFX, grading, kamera (angle, movement, framing, komposisi, lensa, DOF), exposure, fokus, lighting, suhu warna, kontinuitas, caption, audio.
- `references/naskah-template.md` — kerangka 13 beat yang dipakai ketiga referensi + ide topik.
- `examples/payung/build.py` — contoh storyboard lengkap (64 shot) yang sudah jadi video.

## Alur kerja

1. **Ide & judul** — format wajib "Kenapa Ada [Orang/Pelanggan] yang Cuma [aksi aneh]?". Cerita orisinal; twist = tokoh misterius ternyata menjalankan bisnis cerdik yang dihitung angkanya.
2. **Naskah** — ikuti 13 beat (`naskah-template.md`), 210–260 kata, kalimat pendek, bahasa lisan. Tunjukkan naskah ke pengguna bila mereka ingin menyetujui dulu; kalau diminta langsung jadi, lanjut.
3. **Narasi (ElevenLabs MCP)**
   - `creative_create_flow` → `creative_list_voices` (languages `["id"]`, gender male, use_case narrative_story). Default: **"Lucky Adrian"** (santai, cocok short-form) — pilih ulang dari daftar bila id berubah.
   - `creative_generate_speech` model `eleven_v3`, `generations_count: 1`, seluruh naskah satu kali.
   - `creative_transcribe_audio` (`connect_from` = node speech) → dapat `words` (start/end per kata).
   - Unduh `content_url` audio → `vo_raw.mp3` dan `words_download_url` → `words.json` (host `elevenlabsusercontent.com` harus diizinkan di jaringan environment; jika diblokir, minta via `update_environment`).
   - Narasi v3 biasanya ±1.7 kata/dtk; referensi ±2.2 kata/dtk → pakai `TEMPO=1.25` (atempo, pitch tetap).
4. **Storyboard** — pakai `examples/payung/build.py` sebagai contoh API (cast/props/shot), tapi susun lokasinya mengikuti aturan "Suasana & variasi latar" (contoh payung dibuat sebelum aturan ini dan masih memicu peringatan monoton). Satu `S.shot("frasa anchor", {...})` per frasa narasi (cut tepat saat frasa diucapkan). Target 55–65 shot / 100 dtk, tiap shot 1–2.5 dtk.
   - **Rencanakan peta lokasi dulu** (lihat bagian "Suasana & variasi latar"): tiap beat naskah → lokasi + waktu + emosi. Minimal 4–6 lokasi per video, tidak ada lokasi > 45 % durasi.
   - Suasana diisi otomatis dari narasi saat `S.build()` (kata pagi/siang/sore/malam/hujan + kata emosi). Timpa per shot dengan `"mood": "malam+tegang"` bila perlu.
   - `S.build()` mencetak `LOKASI`, `SUASANA`, dan `PERINGATAN` monoton. Perbaiki semua peringatan sebelum preview.
5. **Preview** — `engine/preview.sh story.json pv` → contact sheet `pv/sheet_*.jpg` (still tiap shot). WAJIB dilihat (Read) dan diperbaiki sebelum render penuh: kamera tembus kepala/dinding, wajah tertutup caption, karakter membelakangi kamera, prop hilang.
6. **Render + audio + mux** — `TEMPO=1.25 engine/make_video.sh path/to/build.py workdir` → `workdir/FINAL.mp4`. Mode 3D: ±1.5 dtk/frame (±75 menit untuk 100 dtk) dengan AO+DOF; `S.opts.update(ao=False)` ±1 dtk/frame; `style:"toon"` ±0.5 dtk/frame. CPU 4 core sudah terpakai penuh → jangan render dua video bersamaan. Jalankan di background.
7. **QC** — ambil frame acak + cek `ffmpeg -af ebur128` (target -14.5 LUFS, LRA ±2). Kirim file ke pengguna (SendUserFile) dan commit sumber (bukan MP4 besar kecuali diminta).

## Mode visual 3D (default)

Sejak versi ini semua video dirender sebagai **animasi 3D penuh**, bukan tampilan toon/2D:

| Elemen | Mode `3d` (default) | Mode `toon` (lama, mirip referensi) |
|---|---|---|
| Material | PBR (`MeshStandardMaterial`) + pantulan lingkungan (RoomEnvironment) | toon 4 tingkat + outline tebal |
| Wajah | Mesh 3D di permukaan kepala: mata ellipsoid mengilap + titik pantul, alis kapsul, mulut torus / "D" ekstrusi + lidah, mata ^^ torus, mata spiral tube, mata kaget bola + pupil, keringat 3D bening | tekstur 2D digambar di kanvas |
| Cahaya | Matahari + bayangan lembut (PCFSoft), hemisphere, **rim light** dari belakang subjek, lampu praktis | matahari keras |
| Ruang | **GTAO** (ambient occlusion: kontak & lekukan gelap), **depth of field** (fokus otomatis ke target kamera), tone mapping filmis ACES | datar |
| Kamera | push-in + **busur parallax ±4°** otomatis tiap shot (`cam.arc` untuk atur/0 untuk mematikan) | push-in |
| Callout & ikon | **Teks 3D timbul** Poppins ExtraBold (bevel, berayun masuk) + panah 3D; ikon 3D (keringat, hati, !, ?, Z) | gambar 2D |
| Partikel | debu `Points` 3D, hujan garis 3D jatuh, kilau emas 3D | titik/garis 2D |
| Tetap 2D | caption (agar terbaca, sesuai referensi) & rumus pojok kanan atas | sama |

Opsi di `build.py`: `S.opts.update(style="3d"|"toon", ao=True|False, dof=True|False, scale=0.82, outline=0|1)`; per shot: `"dof": 0.0018` (aperture; 0 = tajam semua), `cam.arc`.
Tips 3D: close-up wajah (jarak 1–1.6 m) paling memamerkan volume; beri arah cahaya miring (bukan frontal); hindari dua shot dengan busur searah berturut-turut (engine sudah selang-seling).

## Setup engine
```bash
cd engine && npm install          # three@0.170.0 + @fontsource/poppins@5.1.0
# Chromium + Playwright sudah ada di container (require('playwright')).
```
`render.js` membuka `index.html` lewat server lokal, WebGL via SwiftShader, menyalurkan JPEG frame ke ffmpeg (libx264 CRF 18, yuv420p).

## Format story.json (dibuat oleh build.py)
```jsonc
{
  "cast":  { "pria": {"body":"#7a4a24","hair":"cover","bag":true}, "bu": {"body":"#3b3f9a","hair":"hijab"} },
  "props": { "rack": {"type":"umbrellaRack","args":[5]} },
  "shots": [{
    "dur": 1.6, "set": "warung",                 // warung | rumah | street | pasar | kampung | halte | bank | istana | taman
    "mood": "malam+tegang",                      // base: pagi|siang|sore|malam|hujan|mendung  + emosi: tegang|sedih|ceria|misteri|mewah|lega
    "cam": {"p":[x,y,z], "p2":[...], "t":[...], "t2":[...], "fov":36, "ease":"l"},  // push-in p→p2
    "actors": { "bu": {"pos":[x,0,z], "rot":0, "expr":"worried", "anim":"nod",
                        "to":[x,0,z], "exprAt":[[0.7,"shock"]], "armR":[-2.4,0.2], "give":true} },
    "props":  { "rack": {"pos":[...], "rot":[deg,deg,deg], "scale":1, "to":[...], "grow":0.3} },
    "callouts": [{"text":"3 RB", "at":[x,y,z] | "x":540,"y":560, "size":96, "color":"#f4c430", "arrow":true}],
    "math": {"lines":["10 PAYUNG","× 10 JALAN"], "at":[0,0.3], "result":"300 RB", "resultAt":0.3},
    "icons": [{"type":"drop|q|z|heart|bang", "at":[x,y,z], "t":0.2}],
    "rain": 1, "exposure": 0.85, "sunI": 1.2, "sun":[x,y,z], "dust": 1, "vig": 1, "warm": 1
  }],
  "captions": [{"s":0.0,"e":0.6,"text":"Dia datang","c":"w|y"}]
}
```
- Karakter menghadap +Z saat `rot:0`; `rot` derajat searah sumbu Y (90 = menghadap +X).
- Tinggi karakter ±2.15 m (kepala pusat y≈1.78). Etalase warung: atas y=1.11, z∈[-0.48,0.48]; pemilik di z≈-0.95, pelanggan z≈+1.05. Trotoar halte y=0.15.
- `story_lib.DIST` (contoh: 1.7) mengalikan jarak kamera→target; pakai `cam(..., raw=True)` untuk over-the-shoulder/kamera di sela dinding.
- Close-up: target kamera ±0.15 m di bawah pusat kepala supaya wajah di sepertiga atas dan caption (70 % tinggi) tidak menutupi mata/mulut.
- Animasi: idle, walk, run, nod, shake, laugh, jump, tremble, lean, sit, pushup, turn. Prop kerajaan: crown, chefHat, hood, vial, soup, teacup, cake, pot, chest, coinsGold, jahe.
- Prop yang dipegang: `hand_up(pos, rot)` (payung terbuka, `armR:[-2.4,0.2]`), `hand_side(pos, rot)` (dijinjing).

### Ekstensi
- Set baru: tambah `buildXxx()` di `engine.js` (lantai + dinding bertekstur `woodTex/brickTex/grassTex`, `windowFrame()` agar bayangan kisi muncul, `userData` sun/hemi/amb/bg) lalu daftarkan di `loadStory`.
- Prop baru: tambah fungsi di objek `P` (pakai `box/cyl/sph/mk` agar outline otomatis).
- Ekspresi baru: tambah `case` di `drawFace` (kanvas 512², mata y≈250, mulut y≈345).

## Suasana & variasi latar (WAJIB)

Visual harus **mengikuti isi narasi**, bukan diam di satu tempat. Aturan:

1. **Peta lokasi per beat.** Sebelum menulis shot, buat tabel: beat → lokasi utama + 1 lokasi selingan. Contoh payung: hook=gang (eksterior) → warung (interior) · aturan=close-up gantungan · hujan=gang basah · tukang ojek=emperan · investigasi=halte · twist=warung · hitungan=halte hujan + gang wide · tag=warung terang.
2. **Lokasi mengikuti kata.** Kalau narasi menyebut tempat ("ke pasar", "di rumah", "halte", "taman", "kampung", "dapur", "istana"), shot itu HARUS di tempat itu. Kalau menyebut aktivitas di luar (jalan, pulang, ngikutin), pakai eksterior.
3. **Maks 3 shot berturut-turut di set yang sama.** Selingi dengan: insert benda (close-up prop), reaksi tokoh lain, eksterior/establishing, atau lokasi kilas (mis. bayangan rumah tokoh misterius).
4. **Satu lokasi maksimal 45 % durasi; minimal 4 lokasi** untuk video > 60 dtk.
5. **Di set yang sama, ganti sudut.** Jangan dua shot berurutan dengan posisi kamera hampir sama (lint memperingatkan < 0.25 m). Variasikan: wide → medium → close-up wajah → insert benda → over-the-shoulder → low angle meja.
6. **Waktu & cuaca mengikuti narasi** (otomatis): "pagi/subuh" → `pagi` (biru-krem lembut, kabut tipis) · "siang" → `siang` (terang, langit biru) · "sore" → `sore` (tampilan referensi, oranye hangat) · "malam/gelap" → `malam` (biru gelap + lampu kuning hangat) · "hujan/gerimis" → `hujan` (abu, kabut, hujan) · "mendung". Kata lompatan waktu (besoknya, lusanya, akhir bulan, seminggu kemudian, suatu…) mengembalikan jam ke default.
7. **Emosi mengikuti narasi** (otomatis, per shot): kaget/diusir/racun → `tegang` (kontras, vignette berat) · nyerah/lemas/gagal/kosong → `sedih` (pucat, dingin) · ketawa/senyum/sehat/bonus → `ceria` (terang, jenuh) · ngintip/ngikutin/konon/rahasia → `misteri` (gelap kebiruan, kabut) · emas/juta/hadiah → `mewah` (keemasan + kilau) · ternyata/itulah → `lega`.
8. **Gaya tetap referensi.** Suasana hanya menggeser cahaya & grading; outline, caption, debu, vignette, dan karakter tetap sama. `sore` = tampilan persis referensi, jadi dipakai sebagai default.

Lokasi tersedia: `warung` (warung kayu), `rumah` (ruang tamu: sofa, TV, jendela gorden), `street` (gang pasar + bank), `pasar` (lorong kios buah + untaian lampu), `kampung` (jalan desa, rumah genteng, sawah, kelapa, gunung), `halte` (halte bis + jalan raya), `bank` (loket), `istana` (ruang tahta + meja makan), `taman` (taman istana/kota). Tambah lokasi baru bila cerita butuh (lihat Ekstensi).

## Checklist kecocokan dengan referensi
- [ ] Mode 3D aktif: wajah 3D, bayangan lembut, AO, DOF, teks callout 3D timbul (kecuali sengaja `style:"toon"`).
- [ ] Caption Poppins Bold putih + kuning kata kunci, 1–2 kata, y≈1352, shadow lembut.
- [ ] Setiap shot push-in pelan, hard cut di awal frasa, rata-rata < 2.5 dtk.
- [ ] Grading hangat-coklat, biru diremukkan, vignette berat, grain, debu melayang.
- [ ] Bayangan keras dari jendela, outline tebal ungu-hitam di semua objek.
- [ ] Tokoh misterius berponi menutupi mata; pemilik ekspresif (worried → annoyed → dizzy → shock).
- [ ] Callout angka kuning + panah, rumus pojok kanan atas, hasil hijau.
- [ ] Narasi ±2.2 kata/dtk, musik latar terus-menerus, -14.5 LUFS.
- [ ] Ditutup "Oh iya, besoknya…" + punchline.
- [ ] `S.build()` tanpa PERINGATAN: ≥4 lokasi, tak ada lokasi >45 %, tak ada >3 shot beruntun di set sama.
- [ ] Suasana (waktu, cuaca, emosi) berubah mengikuti narasi; malam terlihat malam, hujan terlihat hujan.
