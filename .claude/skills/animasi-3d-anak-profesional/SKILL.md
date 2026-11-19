---
name: animasi-3d-anak-profesional
description: Membuat video animasi kartun 3D anak-anak berkualitas serial TV (genre kartun keluarga bernuansa kampung Melayu/Indonesia, sejenis Upin & Ipin) dengan tokoh dan cerita ORISINAL — dari ide, naskah, desain tokoh, storyboard, animasi 3D (Three.js), dialog + lip-sync, sampai render MP4 1080p 16:9 atau 9:16 lengkap dengan suara dan musik. Pakai saat pengguna minta "animasi 3D", "kartun 3D anak", "video animasi seperti Upin Ipin", "episode kartun kampung", "film animasi pendek 3D", atau memanggil /animasi-3d-anak-profesional.
---

# Animasi 3D Anak Profesional

Skill ini menghasilkan **episode kartun 3D pendek (20 dtk – 3 mnt)** dengan rasa serial TV anak:
tokoh bulat menggemaskan, warna tropis cerah, cahaya matahari hangat, kampung dengan rumah panggung
dan pohon kelapa, dialog polos-lucu, dan pesan moral. Semuanya dibangun dari **satu file HTML**
(mesin animasi 3D berbasis data) lalu dirender bingkai-demi-bingkai menjadi MP4.

## ⚠️ Aturan orisinalitas (wajib)

"Seperti Upin & Ipin" = **genre dan mutu**, bukan menyalin. Jangan pernah memakai:
nama/desain tokoh Upin, Ipin, Kak Ros, Opah, Mei Mei, Jarjit, dll.; anak kembar botak dengan
sejumput rambut; slogan khas ("Betul, betul, betul"); nama "Kampung Durian Runtuh"; lagu tema,
logo, atau musik mereka. Kalau pengguna meminta tokoh-tokoh itu secara langsung, jelaskan singkat
dan tawarkan tokoh orisinal yang senada. Lihat `references/gaya-visual.md` untuk ciri genre yang boleh dipakai.

## Isi skill

| File | Fungsi |
|---|---|
| `assets/template-episode.html` | Mesin animasi 3D + naskah contoh. **Salin per episode**, ubah hanya blok `window.NASKAH`. Bisa dibuka di browser/HP (tombol Putar, geser waktu, Rekam). |
| `scripts/render.cjs` | Render offline deterministik → MP4 H.264 (1080p), campur suara dialog + musik (otomatis *ducking*), mode foto QC. |
| `references/format-naskah.md` | Skema lengkap NASKAH: tokoh, adegan, kamera, aksi, gerak, ekspresi, properti. **Baca sebelum menulis naskah.** |
| `references/gaya-visual.md` | Bible gaya: proporsi, palet, latar, desain tokoh orisinal. |
| `references/sinematografi.md` | Jenis shot, aturan 180°, ritme potongan, resep adegan. |
| `references/cerita-dan-naskah.md` | Struktur cerita anak, gaya dialog, contoh premis, timing dialog. |
| `references/suara-dan-musik.md` | Pengisi suara (ElevenLabs / rekam sendiri), sinkron durasi, musik & SFX. |
| `references/jalur-blender.md` | Untuk mutu bioskop/TV: alur kerja Blender (rigging, Cycles/EEVEE) bila pengguna punya PC kuat. |

## Alur kerja

### 1. Brief (tanya seperlunya, sisanya pakai bawaan)
Kumpulkan: **tema/pesan moral**, **durasi** (bawaan 45–60 dtk), **rasio** (16:9 YouTube / 9:16 Shorts),
**bahasa** (Indonesia bawaan; Melayu bila diminta), **tokoh** (bawaan 2 anak + 1 orang dewasa),
**suara** (ElevenLabs / rekaman sendiri / teks saja). Kalau pengguna hanya bilang "buatkan", langsung
usulkan 3 premis singkat (lihat `references/cerita-dan-naskah.md`) dan lanjut dengan yang terbaik.

### 2. Cerita & naskah — STRUKTUR WAJIB 6 BAGIAN
Setiap episode disusun dengan urutan ini (rincian, porsi durasi, dan teknik di `references/cerita-dan-naskah.md`):
1. **HOOK**: kejadian paling gila, mengejutkan, atau paling menarik di awal (flash-forward dari CHAOS/REVEAL).
2. **PROMISE**: alasan mengapa penonton harus mengetahui cerita ini (narasi/teks janji; kartu judul di sini).
3. **CONTEXT**: perkenalkan situasi secara singkat.
4. **BUILD-UP**: masalah mulai berkembang, dengan informasi baru dan perubahan situasi.
5. **CHAOS**: situasi semakin kacau, lucu, menegangkan, atau berbahaya (tetap aman untuk anak).
6. **REVEAL**: fakta atau kejadian yang mengubah pemahaman penonton.

Kalimat pendek (≤ 8 kata), satu ide per baris, ada reaksi tokoh lain. Tampilkan naskah ke pengguna
dalam bentuk tabel singkat (Bagian | Shot | Tokoh | Dialog/Aksi) sebelum membangun, kecuali pengguna minta langsung jadi.
Alat mesin untuk struktur ini: `pindah` (flash-forward), `narasi`, `teksLayar`, `waktuJudul`, `transisi:"pudar"`.

### 3. Desain tokoh orisinal
Tentukan untuk tiap tokoh: nama, umur, sifat, warna baju khas (kontras antar tokoh!), gaya rambut
(`pendek`/`jabrik`/`kuncir`/`tudung`/`peci`), aksesori (`kacamata`, `kumis`). Warna baju tiap tokoh
harus mudah dibedakan dari jauh — itu kunci keterbacaan kartun anak.

### 4. Storyboard → NASKAH
Salin template ke folder kerja (mis. `episode-<judul>/episode.html`), lalu isi `window.NASKAH`
mengikuti `references/format-naskah.md` dan resep `references/sinematografi.md`:
- 1 adegan = 1 shot kamera, durasi 2,5–5 dtk (anak-anak butuh ritme cepat tapi terbaca).
- Mulai dengan shot **lebar** (establishing), dialog pakai **sedang/dekat**, reaksi pakai **dekat**, akhiri dengan **lebar/rendah** yang ceria.
- Setiap baris dialog beri `gerak` (lambai, pikir, garuk, tunjuk, sorak…) dan `ekspresi`.
- Atur posisi dan `hadap` tokoh **sebelum** cut, bukan di awal shot berikutnya.

### 5. Suara (opsional tapi sangat menaikkan mutu)
Ikuti `references/suara-dan-musik.md`. Ringkasnya: buat file per baris (`suara/01.mp3` …), ukur
durasinya dengan `ffprobe`, set `durasi` bicara = durasi audio + 0,2 dtk, isi `audio:"suara/01.mp3"`.
ElevenLabs memakai kredit pengguna — konfirmasi dulu sebelum membuat banyak baris.

### 6. QC visual (WAJIB sebelum render penuh)
```bash
node <skill>/scripts/render.cjs episode.html --skala 0.5 --foto 1,4,8,12 --out foto-qc
```
Buka foto-fotonya (Read tool) dan periksa: kepala tidak terpotong, tokoh tidak tertutup properti/ayam,
kamera tidak menembus rumah/pohon, tokoh menghadap lawan bicara, teks tidak menutupi wajah,
tak ada layar hitam. Perbaiki `posisi`, `sudut`, `jenis` kamera, atau pindahkan properti (`props`).

### 7. Render
```bash
node <skill>/scripts/render.cjs episode.html --skala 0.5 --out draf.mp4          # draf cepat (~0,2 dtk/bingkai)
node <skill>/scripts/render.cjs episode.html --musik musik.mp3 --out final.mp4   # final 1080p
```
Render final 1080p di CPU ±0,5–1 dtk/bingkai (1 menit video ≈ 15–25 menit) — jalankan di latar belakang.
Untuk pratinjau gerakan tanpa render ulang, buat lembar kontak:
`ffmpeg -ss 10 -t 2 -i draf.mp4 -vf "fps=6,scale=480:-1,tile=4x3" -frames:v 1 kontak.png`.

### 8. Serahkan
Kirim MP4 final + file `episode.html` (bisa dibuka di HP: tombol ⏺ Rekam menghasilkan video langsung
dari browser, tanpa audio; di HP lemah buka dengan akhiran `?skala=0.5` agar lancar). Sertakan ringkasan: judul, durasi, daftar tokoh, dan ide episode lanjutan.

## Kemampuan mesin (ringkas)
- **Gaya tokoh**: `gayaTokoh:"bulat"` (kartun kepala bulat) atau `"balok"` (avatar blok ala game blok: kepala silinder, badan kotak, topi bertulisan nama). Contoh di template: **Akmal** (kulit kuning, baju biru, topi merah bertulisan "Akmal").
- **Tokoh**: anak (kepala besar ±40% tinggi) & dewasa; kedip otomatis, napas, mata mengikuti lawan bicara, kepala menoleh ke pembicara, lip-sync dari teks (visem a/i/u/e/o/m), gestur saat bicara.
- **Gerak**: `lambai sorak tunjuk angguk geleng lompat ketawa pikir kaget tepuk garuk sedih bicaraTangan pinggang menari` + `jalan` / `lari` ke titik, `hadap`, `lihat`.
- **Ekspresi**: `senang netral sedih marah kaget malu bingung`.
- **Kamera**: `lebar sedang dua dekat sangatDekat rendah atas ots` × gerak `diam majuPelan mundurPelan geserKiri geserKanan orbit naik`, aturan 180° otomatis, transisi `pudar`.
- **Latar**: kampung (rumah panggung, kelapa, pohon rindang, semak, bunga, batu, pagar, bangku, bola, ayam yang mematuk), waktu `pagi/siang/sore`, langit gradasi, awan, bukit, bayangan lembut, tone-mapping ACES.
- **Overlay**: kartu judul (bisa ditunda setelah HOOK), subtitle bernama-warna per tokoh, narasi narator, teks layar besar, kartu akhir.

## Batasan yang jujur disampaikan ke pengguna
Mesin ini prosedural (tanpa model 3D rigging penuh): kualitasnya setara kartun 3D web yang rapi,
belum setara studio dengan rig wajah, rambut simulasi, dan render path-tracing. Untuk itu gunakan
`references/jalur-blender.md`. Tokoh belum bisa memegang/melempar benda; akali dengan cut & properti.
Perekaman langsung di browser tidak menyertakan audio — audio dicampur oleh `render.cjs`.

## Memperluas
Properti baru: tambahkan fungsi di objek `PROP` (kembalikan `THREE.Group`, kaki di y=0). Gerak baru:
tambahkan fungsi di objek `GERAK` `(k, lt, durasi, amplop, x)` yang memutar `k.bahu[0|1]` (kanan|kiri),
`k.kaki`, `k.kepala`, `k.tubuh`, lalu tambahkan durasi bawaannya di `DUR_GERAK`. Selalu uji dengan foto QC.
