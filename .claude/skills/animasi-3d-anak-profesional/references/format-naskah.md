# Format NASKAH (window.NASKAH)

Satu-satunya bagian `template-episode.html` yang diubah per episode. Koordinat dunia dalam **meter**:
`x` kiri(−)/kanan(+), `z` belakang(−)/depan(+). Rumah bawaan ada di z ≈ −8; area main (halaman pasir)
berpusat di (0,0) radius ±7 m. "Depan"/arah penonton = +z. Sudut `hadap` dalam derajat: 0 = menghadap
+z (penonton), 90 = menghadap +x, −90 = menghadap −x, 180 = membelakangi.

```js
window.NASKAH = {
  judul: "Judul Episode", subjudul: "Episode 1",
  rasio: "16:9",            // atau "9:16"
  fps: 25,                  // 24/25/30
  kartuJudul: true,         // judul tampil 0–3,3 dtk di atas shot pertama
  kartuAkhir: "TAMAT",      // teks akhir (false untuk mematikan)
  waktuJudul: 5.6,          // detik munculnya kartu judul (setelah HOOK). 0 = di awal
  namaNarator: "Narator",   // label subtitle narasi
  latar: { jenis:"kampung", waktu:"siang", radiusHalaman:7, warnaRumput:"#7bbd4c", warnaHalaman:"#e4c690", areaBayangan:15 },
  props: [ ... ],           // opsional; kosong = tata letak kampung bawaan
  tokoh: [ ... ],
  adegan: [ ... ]
};
```

## gayaTokoh (gaya tubuh semua tokoh)

`gayaTokoh: "balok"` → avatar blok ala game blok: kepala silinder, badan/lengan/kaki kotak membulat,
mata oval hitam, senyum lebar — **BAWAAN** (dipakai walau `gayaTokoh` tidak ditulis). `gayaTokoh: "bulat"` → kartun kepala bulat besar (hanya bila pengguna meminta).
Bisa ditimpa per tokoh dengan `gaya:"balok"` / `gaya:"bulat"`. Semua gerak, ekspresi, lip-sync, dan kamera
berlaku untuk kedua gaya. Gaya balok: kulit klasik `#f5cd30` (kuning), jarak kamera otomatis disesuaikan
karena kepalanya lebih kecil. Jangan pakai logo/nama merek game mana pun di tokoh.

Kunci khusus gaya balok:
| Kunci | Contoh | Keterangan |
|---|---|---|
| `topi` | `{ warna:"#e63946", teks:"Akmal", warnaTeks:"#ffffff" }` | topi pet dengan tulisan di depan (teks pendek ≤ 8 huruf paling terbaca). `topi:"#e63946"` = topi polos |
| `logoBaju` / `warnaLogo` | `"A"`, `"#ffffff"` | tulisan di dada baju |
| `rambut` | `pendek` `kuncir` `tudung` `peci` `tanpa` | rambut balok; bila ada `topi`, bawaan tanpa rambut |

## tokoh[]

| Kunci | Nilai | Keterangan |
|---|---|---|
| `id` | string | dipakai di `siapa`, `fokus`, `hadap`, `lihat`, `ke` |
| `nama` | string | tampil di label subtitle |
| `jenis` | `"anak"` / `"dewasa"` | proporsi tubuh (anak ±1,4 m kepala besar; dewasa ±2 m) |
| `pos` | `[x, z]` | posisi awal |
| `hadap` | derajat | arah awal |
| `kulit`, `baju`, `celana`, `sepatu` | warna hex | |
| `rambut` | `pendek` `jabrik` `kuncir` `tudung` `peci` `tanpa` | |
| `warnaRambut` | hex | juga warna alis & kumis |
| `tudung` | hex | warna kerudung (untuk `rambut:"tudung"`) |
| `pita` | hex | ikat rambut (untuk `kuncir`) |
| `warnaPeci` | hex | bawaan hitam |
| `rok` | hex | ganti celana dengan rok/baju kurung |
| `lenganPanjang`, `celanaPanjang` | bool | bawaan: dewasa & tudung = lengan panjang; dewasa = celana panjang |
| `kacamata`, `kumis` | bool | |
| `warnaMata` | hex | bawaan coklat tua |
| `ekspresi` | lihat daftar | ekspresi awal (bawaan `senang`) |
| `skala` | angka | 0,85–1,15 untuk variasi tinggi (adik/kakak) |
| `warnaNama` | hex | warna label nama (bawaan = warna baju) |

## adegan[] (1 adegan = 1 shot)

```js
{ durasi: 3.5,
  kamera: { jenis:"sedang", fokus:"raka", sudut:-15, gerak:"majuPelan" },
  transisi: "pudar",        // opsional: hitam-pudar masuk ke shot ini
  aksi: [ { t:0.2, siapa:"raka", bicara:"Halo!", durasi:1.5, gerak:"lambai", ekspresi:"senang" } ] }
```

### kamera
| Kunci | Nilai |
|---|---|
| `jenis` | `lebar` (establishing, seluruh tubuh + latar) · `sedang` (pinggang ke atas) · `dua` (dua tokoh) · `dekat` (kepala-bahu) · `sangatDekat` (wajah) · `rendah` (dari bawah, heroik/ceria) · `atas` (dari atas, kecil/sedih) · `ots` (dari balik bahu `fokus[0]` ke `fokus[1]`) |
| `fokus` | id atau array id. Kosong = semua tokoh |
| `sudut` | derajat, memutar kamera mengelilingi fokus (−30…30 wajar). 0 = tepat di depan wajah (1 tokoh) atau tegak lurus garis antar tokoh (≥2 tokoh) |
| `gerak` | `diam` (drift halus) · `majuPelan` · `mundurPelan` · `geserKiri` · `geserKanan` · `orbit` (+`arahOrbit:-1`) · `naik` |

Kamera otomatis mengikuti tokoh yang berjalan dan selalu berada di sisi +z garis aksi (aturan 180°).

### aksi[] — `t` relatif terhadap awal adegan
Satu objek boleh berisi beberapa kunci sekaligus (mis. bicara + gerak + ekspresi).

| Kunci | Contoh | Keterangan |
|---|---|---|
| `bicara` | `"Ayo main!"` | subtitle + lip-sync. `durasi` = lama bicara (bawaan ≈ 0,5 + 0,38×jumlah kata) |
| `audio` | `"suara/03.mp3"` | file suara baris itu (relatif ke HTML) — dicampur saat render |
| `ke` | `"sari"` | lawan bicara (kepala menoleh ke dia). Bawaan: tokoh terdekat |
| `gerak` | `"lambai"` | lihat daftar. Durasi: `durasiGerak` → `durasi` (bila tanpa bicara) → bawaan |
| `durasiGerak` | `2.0` | durasi gerak bila berbeda dari durasi bicara |
| `ekspresi` | `"kaget"` | berlaku sampai diganti |
| `jalan` / `lari` | `[x, z]` | berpindah ke titik; `durasi` opsional (bawaan dari kecepatan: anak 1 m/dtk, lari 2,6 m/dtk). Tokoh otomatis menghadap arah jalan |
| `durasiBicara` | `1.5` | bila `jalan` + `bicara` dalam satu aksi |
| `hadap` | `"wak"` / `"depan"` / `"belakang"` / `45` | berputar halus (0,45 dtk) |
| `lihat` | `"sari"` / `"kamera"` / `"depan"` | paksa arah pandang; `durasi` opsional |
| `pindah` | `[x, z]` | pindahkan tokoh seketika (tanpa animasi jalan) — untuk HOOK *flash-forward* dan kembali ke posisi awal di balik `transisi:"pudar"` |

Tokoh yang baru muncul belakangan (mis. untuk REVEAL): taruh `pos` awalnya jauh di luar layar (mis. `[-40,-25]`), lalu di adegan kemunculannya tulis `pindah` ke titik masuk **sebelum** `jalan` pada detik `t` yang sama, misalnya `{t:0, siapa:"wak", pindah:[-4.4,-6.5]}, {t:0, siapa:"wak", jalan:[-1.4,-0.4]}`. Jangan sembunyikan tokoh di belakang rumah panggung, karena kakinya terlihat dari kolong.
| `narasi` | `"Tapi hari ini..."` | suara narator (tanpa `siapa`): subtitle miring berlabel narator; boleh `audio` & `durasi` |
| `teksLayar` | `"10 MENIT SEBELUMNYA..."` | teks besar di layar bagian atas (penanda waktu, efek suara "KUKURUYUUUK!"); `warna`, `durasi` (bawaan 2 dtk). Tanpa `siapa` |

### Daftar gerak (durasi bawaan)
`lambai` 1,6 · `sorak` 1,6 (dua tangan ke atas) · `tunjuk` 1,4 · `angguk` 1,0 · `geleng` 1,0 ·
`lompat` 0,9 (antisipasi–squash–stretch–mendarat) · `ketawa` 1,6 · `pikir` 2,0 (tangan ke dagu, mata ke atas) ·
`kaget` 1,0 · `tepuk` 1,5 · `garuk` 1,6 (garuk kepala, malu) · `sedih` 2,0 · `bicaraTangan` 2,0 ·
`pinggang` 2,0 (tangan di pinggang) · `menari` 3,0

### Daftar ekspresi
`senang` · `netral` · `sedih` (alis turun, cemberut) · `marah` (alis menukik) · `kaget` (mata besar, mulut O) ·
`malu` (pipi merah, mata ke bawah) · `bingung` (alis asimetris)

Perilaku otomatis (tak perlu ditulis): kedip, napas, ayunan kecil, pendengar menoleh ke pembicara,
gestur tangan saat bicara bila tak ada gerak lain, kepala mengangguk kecil saat bicara.

## props[] (opsional, menggantikan seluruh tata letak bawaan)

```js
props: [
  { jenis:"rumah", pos:[-1,-8], putar:0, warna:"#c98b52", warnaAtap:"#9c3b2e" },
  { jenis:"pohonKelapa", pos:[-6,-5], tinggi:5.6, condong:8 },
  { jenis:"pohonRindang", pos:[8,-12], skala:1.2 },
  { jenis:"semak", pos:[3,-4] }, { jenis:"bunga", pos:[2,-5] }, { jenis:"batu", pos:[4,3], skala:.8 },
  { jenis:"pagar", dari:[-14,-15], ke:[14,-15] },
  { jenis:"bangku", pos:[-4.4,-1.6], putar:20 }, { jenis:"bola", pos:[-4.2,-1.45], warna:"#e63946" },
  { jenis:"ayam", pos:[3.6,1.6], warna:"#b5652b" }
]
```
Jaga jalur kamera bersih: jangan taruh pohon/semak di antara kamera (sisi +z) dan tokoh.
Ayam berkeliaran ±0,7 m dari posisinya — jauhkan dari titik tokoh agar tak menutupi wajah.

## Pola-pola siap pakai

**Masuk dari luar layar:** tokoh mulai di `pos:[-9, 1]`, aksi `{t:0, siapa:"x", jalan:[-2,0.5]}` di shot lebar.

**Percakapan dua arah (shot/reverse-shot):**
```js
{ durasi:3, kamera:{ jenis:"ots", fokus:["raka","sari"] }, aksi:[{ t:.2, siapa:"sari", bicara:"..." }] },
{ durasi:3, kamera:{ jenis:"ots", fokus:["sari","raka"] }, aksi:[{ t:.2, siapa:"raka", bicara:"..." }] },
```

**Reaksi kaget lucu:** shot `dekat` 1,5–2 dtk, `{gerak:"kaget", ekspresi:"kaget"}` di t=0,1, lalu potong ke shot `lebar`.

**Penutup ceria:** shot `rendah` + `gerak:"naik"`, semua tokoh `hadap:"depan"` (taruh di shot sebelumnya), lalu `sorak`/`lompat` bergiliran 0,1 dtk.
