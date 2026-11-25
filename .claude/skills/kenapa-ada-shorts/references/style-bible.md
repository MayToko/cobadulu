# Style Bible — "Kenapa Ada…?" Shorts (bedah 3 video referensi)

Sumber bedah: 3 Shorts 1080×1920, 30 fps, H.264 + AAC 44.1 kHz stereo, durasi 94–107 detik.
("Kenapa Ada Pelanggan yang Cuma Nukerin Koin Tiap Hari", "…Cuma Pesan Es Teh Tawar Lalu Duduk Lima Jam",
"Kenapa Ada Orang yang Bayar Mancing Cuma Buat Lepasin Ikannya").
Angka di bawah diukur dari frame/audio asli (ffmpeg + sampling piksel), bukan tebakan.

---

## 1. Karakter

Desain seragam untuk semua tokoh (yang beda hanya warna baju & penutup kepala):

| Bagian | Spesifikasi | Di engine |
|---|---|---|
| Kepala | Bola besar krem `#F2E4C4`, diameter ≈ lebar badan (rasio kepala:tinggi total ≈ 1:3). Shading lembut, hampir rata. | `SKIN`, `HR=0.36` |
| Outline | Garis tebal ungu-hitam `#1C1022`, ±8–10 px di 1080p pada kepala, lebih tipis di tangan/kaki. Semua objek ber-outline (gaya cel/toon 3D). | `OUT.l/m/s` (inverted hull) |
| Badan | Telur/kapsul, warna solid (coklat `#7A4A24`, hijau `#3F8F3A`, biru `#2F5FB0`, kuning, merah, ungu `#3B3F9A`). Kancing krem bulat berjajar vertikal 4 buah. | `LatheGeometry`, `buttons` |
| Tangan & kaki | Lidi tipis biru-tua `#1F2550`, ujung bola kecil; kaki berakhir sepatu oval gelap. | `limb` |
| Wajah | Digambar 2D datar di bola: mata titik hitam lonjong, alis garis tebal, mulut satu garis. | `drawFace()` |
| Ekspresi baku | `neutral` (titik + garis), `smile`, `happy` (^^ + mulut terbuka merah), `content` (^^ senyum), `worried` (alis naik + mulut zigzag + tetes keringat biru), `annoyed`/`flat` (kelopak setengah, mulut cemberut/datar), `shock` (mata putih besar + mulut O merah tua), `dizzy` (mata spiral), `sleepy`, `talk`. | nama ekspresi sama |
| Tokoh misterius | SELALU poni/rambut menutupi mata (`hair:"cover"`), hanya mulut terlihat. Biasanya tenang, senyum tipis. Inilah "pelanggan aneh"-nya. | `hair:"cover"`, `mouthOnly/mouthSmile/mouthOpen` |
| Pemilik usaha | Ibu berhijab teal `#12AAC2` + kerah biru (Bu Ratna), ibu rambut bob + syal merah (Bu Sari), bapak rambut abu + kacamata + syal oranye (Pak Darmo). | `hijab`, `bob`, `grey`+`glasses` |
| Figuran | Tukang ojek (helm), tukang parkir, tukang gorengan, pembeli ber-peci, petani ber-caping. Fungsinya: "nahan ketawa" + satu celetukan. | `peci`, `caping`, `cap`, prop `helmet` |
| Ikon emosi 2D | Tetes keringat biru, tanda "?", "Z" tidur, hati, "!" — melayang dekat kepala, sedikit naik-turun. | `icons:[{type}]` |

Animasi: idle "napas" (scale Y ±1.2 %), jalan (kaki ayun + badan memantul), `nod`, `shake`, `laugh` (badan memantul cepat), `jump` (kaget), `tremble` (gemetar), `lean`. Tidak ada lip-sync — wajah ganti ekspresi per shot (kadang di tengah shot: `exprAt`).

## 2. Video visual & lingkungan

- Gaya: **3D low-poly + toon shading** dengan tekstur kayu/bata hasil lukis (garis papan gelap, paku, serat).
- Set baku: interior **warung kayu** (dinding papan coklat, rak botol & kotak warna-warni, lampu gantung kap hijau, etalase kayu oranye, kalender dinding), **gang pasar** (deret warung beratap terpal belang, plang "WARUNG", gedung **BANK** bata krem di ujung), **loket bank**, **kolam pancing / taman** (rumput hijau tua, pagar bambu kuning, pohon bulat, saung).
- Properti selalu berbentuk sederhana, ber-outline, warna jenuh (kaleng biru tutup kuning, toples permen polkadot, gelas es teh oranye, ember, dus kardus oranye).
- Kertas/kalender kosong bertepi merah dipakai sebagai simbol "sebulan penuh".

## 3. VISUAL EFFECTS

| Efek | Detail | Engine |
|---|---|---|
| Debu melayang | 30–40 partikel krem kecil (2–4 px) melayang pelan, kedip lembut — ada di HAMPIR SEMUA shot. | `drawDust` |
| Callout angka | Teks Poppins 800 kuning `#F4C430` + stroke coklat gelap, panah dua arah tipis di bawahnya ("50 RB", "3 RB", "20 RB"), muncul pop-scale 0.18 dtk, menempel di objek 3D. | `callouts:[{text, at}]` |
| Rumus pojok kanan atas | Baris kecil putih bold ("100 PERMEN / × Rp200"), garis, hasil besar hijau `#5FD35A` ("20 RB"). | `math:{lines,result}` |
| Angka hitung | Angka kuning besar di frame (mis. "10" warung). | callout tanpa panah |
| Hujan | (dipakai di contoh) garis diagonal tipis putih transparan. | `rain` |
| Transisi | **Hard cut** saja. Fade dari hitam 0.25 dtk di awal, fade ke hitam 0.6 dtk di akhir. | otomatis |
| Caption | lihat §11. | |

## 4. COLOR GRADING & COLOR CORRECTION

Hasil sampling piksel referensi:
- Interior: rata-rata RGB ≈ (78, 34, 14) di bayangan, kayu terang ≈ (118, 60, 20); biru di bayangan hampir 0 → **biru diremukkan**, hitam jatuh ke coklat-merah.
- Luma rata-rata frame 45–118 (low-key, gelap-hangat). Eksterior hijau tetap hijau tapi hangat (rata-rata ≈ 75, 84, 38).
- Kepala krem tetap terbaca krem (≈ 240, 228, 196 di cahaya).

Resep (post shader engine, urutan):
1. Linear → sRGB, lalu tint hangat `× (1.03, 0.98, 0.90)`.
2. Biru di bayangan ditekan (`b = mix(b, b²·1.15, 0.25·(1-luma))`).
3. Crush black 3 % (`(c-0.03)/0.97`), S-curve 40 %.
4. Angkat bayangan ke coklat-merah `+ (0.03, 0.01, 0)·(1-luma)`.
5. **Vignette elips berat** (tepi turun ke ±38 %).
6. Grain halus ±0.045, berubah tiap frame.
7. Sedikit lembut (blur 1-px 4-tap) — referensi terlihat seperti di-upscale; engine render 720×1280 lalu diperbesar ke 1080×1920.

## 5. Camera angle
- Dominan **eye-level karakter** (kamera ±1.5–1.9 m) dan **low angle setinggi meja** (kamera di bibir etalase, objek di meja jadi foreground besar).
- **Top-down/high angle** untuk isi wadah (koin, dus, ember, kolam).
- **Over-the-shoulder** saat tokoh mengintip (ngikutin dari jauh / ngintip dari balik etalase/saung).
- Kadang **dutch kecil** tidak dipakai — horizon selalu lurus.

## 6. Camera movement
- Hampir setiap shot = **slow push-in linear** (maju 10–25 % jarak ke subjek selama shot) atau **drift lateral pelan**. Tidak ada handheld; tidak ada whip.
- Shot jalan: kamera mundur pelan di depan tokoh yang mendekat.
- Durasi shot rata-rata **1.2–2.5 dtk** (≈ 55–65 shot per 100 dtk), cut tepat di awal frasa narasi.

## 7. Camera framing
- 9:16. Close-up wajah: kepala mengisi 60–90 % lebar frame, wajah di **sepertiga atas** sehingga caption (70 % tinggi) jatuh di dagu/badan, tidak menutupi mata.
- Medium: kepala + badan, objek meja di foreground.
- Wide: seluruh tubuh + set (rak, etalase) — tetap rapat, jarang ada ruang kosong.
- Ekstrem close-up objek (koin, permen, gelas, ember) untuk menekankan kata benda yang sedang diucapkan.

## 8. Shot composition
- Subjek terpusat atau sedikit off-center; **foreground occluder** (pinggir etalase, tiang, kepala tokoh lain) sering memotong frame → kedalaman.
- Objek kunci di tengah-bawah tepat di atas caption.
- Bayangan jendela/karakter jatuh ke dinding belakang sebagai elemen grafis.
- Satu ide visual per shot = satu frasa narasi.

## 9. Lens selection
- Setara **35–50 mm** (FOV vertikal 34–42° di engine) untuk close/medium; **24–28 mm** (FOV 44–45°) untuk wide gang/kolam. Distorsi minimal.

## 10. Depth of field
- Hampir **deep focus** (semua tajam) — gaya toon; pemisahan subjek dari latar dicapai lewat cahaya & vignette, bukan blur. Latar hanya sedikit lebih lembut karena keseluruhan gambar lembut.

## 11. Caption (teks layar)
- Font **Poppins Bold 700**, ±78 px di 1080 lebar, putih `#FFFFFF`, drop shadow lembut hitam (blur 18, offset 4).
- Posisi tengah, baseline ±1352 px (≈ 70 % tinggi). 1–2 kata (maks ±16 huruf) per potongan, berganti tiap 0.3–0.8 dtk mengikuti kata narasi.
- Kata kunci (angka, benda kunci, punchline, nama hari/waktu, pertanyaan "Salahnya apa?") berwarna **kuning `#F4C430`**.
- Fade in 0.12 dtk / fade out 0.1 dtk. Tidak ada animasi pop.
- Kutipan dialog ditampilkan tanpa tanda kutip.

## 12. Exposure
- Low-key: area terang hanya pada patch cahaya jendela & wajah; latar 40–60 % lebih gelap. Shot hujan/sore diturunkan (`exposure 0.78–0.85`).

## 13. Focus
- Fokus selalu pada subjek yang disebut narasi saat itu; tidak ada rack focus.

## 14. Lighting
- **Satu key light matahari keras** dari samping (jendela kanan) → bayangan tajam karakter memanjang di lantai & dinding, pola kisi jendela di dinding.
- Fill hangat dari hemisphere (langit krem, lantai coklat) agar sisi gelap tidak hitam.
- Practical: lampu gantung kap hijau dengan bohlam krem bercahaya.
- Toon ramp 4 tingkat (150/205/240/255) → transisi terang-gelap bertahap tapi tetap "kartun".

## 15. Color temperature
- **Hangat ±3000–3500 K** (sore/golden hour) di semua interior; eksterior siang sedikit lebih netral tapi tetap digrading hangat. Tidak ada adegan bertemperatur dingin; hujan pun tetap hangat-redup.

## 15b. Suasana per adegan (pembaruan)
Referensi dominan sore-hangat, tetapi tiap video tetap berganti lokasi 4–6 kali (warung ↔ gang ↔ bank ↔ loket; kolam ↔ saung ↔ loket ↔ jalan) dan berganti waktu sesuai kata narasi ("Suatu sore", "Datangnya pagi", "Suatu siang"). Engine kini punya preset `pagi/siang/sore/malam/hujan/mendung` + modifier emosi `tegang/sedih/ceria/misteri/mewah/lega` yang dipilih otomatis dari narasi; `sore` identik dengan grading referensi.

## 16. Visual continuity
- Karakter tidak pernah berubah desain antar shot; posisi baku per set (pemilik selalu di balik etalase, pelanggan di depan).
- Prop kunci (kaleng koin, toples, gantungan payung) selalu di posisi sama → penonton paham perubahan (penuh → kosong).
- Arah hadap konsisten (pelanggan menghadap pemilik; close-up boleh "cheat" menghadap kamera).
- Grading, debu, vignette, dan gaya caption identik dari detik 0 sampai akhir.

## 17. Audio
- Narasi pria muda santai (F0 median ±137 Hz), **cepat & padat** ±2.2 kata/detik, jeda antar kalimat < 0.3 dtk.
- Musik latar ringan terus-menerus (tidak pernah hening; RMS saat jeda ±-26…-29 dBFS).
- Loudness akhir **-14.5 LUFS, LRA ±2 LU** (sangat rata). Low-pass ±16 kHz (khas re-encode YouTube).
- SFX kecil sesuai cerita ("cring" koin, "krek" tusuk gigi, pop saat angka muncul).
