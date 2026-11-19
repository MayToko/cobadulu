# Bible Gaya Visual — Kartun 3D Anak Bernuansa Kampung

## Ciri genre yang BOLEH dipakai (bukan milik siapa pun)
- Kartun 3D lembut ("soft 3D"): bentuk bulat, permukaan halus, bayangan lembut, tanpa garis luar.
- Proporsi chibi untuk anak: kepala ±40% tinggi badan, mata besar, badan gempal, tangan-kaki pendek.
- Dewasa lebih proporsional (kepala ±28%), tetap bulat dan ramah.
- Palet tropis cerah dan jenuh; langit biru, rumput hijau segar, tanah halaman krem.
- Latar kehidupan sehari-hari kampung Asia Tenggara: rumah panggung kayu, pohon kelapa, ayam, bangku,
  pagar kayu, warung, surau/musala, sekolah, sawah, sungai kecil.
- Cerita keseharian anak: bermain, sekolah, membantu orang tua, puasa & lebaran, hari kemerdekaan,
  gotong royong — humor polos, konflik kecil, pesan moral yang lembut.

## Yang TIDAK boleh (meniru IP tertentu)
Anak kembar botak dengan satu helai rambut, kakak perempuan galak berbaju merah yang mirip, nenek
khas serial tertentu, nama kampung/tokoh/slogan/lagu milik serial yang ada. Bila ragu: ubah konsep
tokoh (umur, hubungan, sifat, warna, rambut) sampai jelas berbeda.

## Desain tokoh orisinal — resep
1. **Siluet unik**: bedakan lewat rambut (jabrik vs kuncir vs tudung vs peci), tinggi (`skala`), dan jenis.
2. **Satu warna khas per tokoh** (baju) yang tidak bertabrakan:
   oranye `#ff8a1f`, merah muda `#ff7eb3`, kuning `#ffd166`, biru `#3a86ff`, hijau `#3e9d6b`,
   ungu `#9b5de5`, merah `#e63946`, toska `#2ec4b6`. Celana/rok gelap atau netral agar baju menonjol.
3. **Kulit**: gaya blok (bawaan) memakai kuning klasik `#f5cd30` untuk semua tokoh. Hanya untuk gaya bulat: `#f0c09a`, `#e3a77c`, `#d4956b`, `#c98d63`, `#a8714c`.
4. **Sifat dalam satu kalimat** (mis. "Akmal: merasa paling berani, padahal gampang kaget"; "Sari: teliti dan suka bertanya")
   dan ekspresi/gerak favorit yang konsisten (Akmal sering `garuk`/`kaget`, Sari sering `pikir`/`pinggang`).
5. **Tokoh dewasa** sebagai pemberi solusi/hikmah: `peci` + `kumis`/`kacamata` (kakek/paman), `tudung` dewasa (ibu/guru).

## Pemeran tetap — gaya avatar blok (Roblox), BAWAAN semua episode
Semua tokoh memakai `gayaTokoh:"balok"` dan kulit kuning klasik `#f5cd30`. **Akmal selalu tokoh utama.**

| id | Nama | Jenis | Penampilan (kunci NASKAH) | Sifat |
|---|---|---|---|---|
| akmal | **Akmal** (UTAMA) | anak | baju biru `#1e6fd9`, celana `#2f3b52`, sepatu `#2a2a2e`, `topi:{warna:"#e63946", teks:"Akmal", warnaTeks:"#ffffff"}` | berani (katanya), penasaran, lucu |
| sari | Sari | anak | `rambut:"tudung"`, tudung `#ff7eb3`, baju & rok `#ffd166`, sepatu `#e0457b` | pintar, teliti, suka menggoda Akmal |
| wak | Wak Salim | dewasa | `rambut:"peci"`, `kumis`, `kacamata`, baju `#3e9d6b`, celana `#5a4636` | bijak, suka bercanda |
| bimo | Bimo | anak, skala 1.1 | `rambut:"pendek"`, baju `#ff8a1f` | penakut tapi baik hati |
| lala | Lala | anak, skala .88 | `rambut:"kuncir"`, pita `#ff5c8a`, baju `#9b5de5`, rok `#ffffff` | adik kecil yang polos |
| bu_ani | Bu Ani | dewasa | `rambut:"tudung"`, tudung & baju `#2ec4b6` | guru yang sabar |

Ciri gaya blok: kepala silinder bersudut bulat, badan/lengan/kaki kotak, mata oval hitam dengan kilau,
senyum lebar. Tulisan nama di topi sebaiknya ≤ 8 huruf. Tanpa logo/nama merek Roblox.
(Gaya kartun kepala bulat `gayaTokoh:"bulat"` tetap tersedia, hanya bila pengguna meminta.)

## Pencahayaan & warna (sudah diatur mesin)
- **Siang**: matahari putih hangat dari kanan-atas, langit biru jernih — bawaan untuk cerita ceria.
- **Pagi**: cahaya keemasan rendah dari kiri, cakrawala peach — untuk adegan berangkat sekolah/sahur.
- **Sore**: jingga, bayangan panjang — untuk adegan haru/penutup.
- Lampu belakang (rim) memisahkan tokoh dari latar; tone-mapping ACES menjaga warna tetap "film".

## Komposisi
- Tokoh utama di sepertiga frame; arah pandang diberi ruang ("lead room").
- Latar rumah/pohon menjadi bingkai; hindari benda menutupi wajah.
- Format 9:16: tokoh lebih ke tengah, satu–dua tokoh per shot, teks di sepertiga bawah.
