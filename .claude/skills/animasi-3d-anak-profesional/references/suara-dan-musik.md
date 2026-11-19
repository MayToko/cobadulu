# Suara, Musik & Efek

## Pilihan pengisi suara
1. **ElevenLabs (bila konektor tersedia)** — kualitas terbaik.
   - `creative_list_voices` → pilih suara anak/ceria untuk tokoh anak, suara hangat dewasa untuk tokoh dewasa.
     Jika tak ada yang cocok, `creative_design_voice` dengan deskripsi (mis. "suara anak laki-laki 7 tahun,
     ceria, logat Indonesia") lalu `creative_save_designed_voice`.
   - Buat satu file per baris dialog (`creative_generate_speech`), satu kali per baris (jangan ulangi panggilan
     untuk "mencoba lagi" — setiap panggilan memotong kredit). **Konfirmasi ke pengguna** sebelum membuat banyak baris.
   - Simpan sebagai `suara/01.mp3`, `suara/02.mp3`, … di folder episode.
2. **Rekaman sendiri** — pengguna merekam tiap baris di HP (mp3/m4a/wav), kirim, beri nama urut.
3. **Tanpa suara** — subtitle saja + musik; cocok untuk draf atau konten bacaan anak.

Tokoh berbeda harus punya suara berbeda yang konsisten sepanjang episode/serial; catat `voice_id` per tokoh.

## Sinkronisasi
```bash
for f in suara/*.mp3; do printf "%s " "$f"; ffprobe -v error -show_entries format=duration -of csv=p=0 "$f"; done
```
Set `durasi` aksi bicara = durasi file + 0,2 dtk, `audio:"suara/NN.mp3"`. Pastikan durasi adegan
≥ `t` + durasi bicara + 0,4 dtk. Lip-sync mengikuti teks; makin cocok teks dengan audio, makin pas.

## Musik
- Gunakan musik bebas royalti/berlisensi yang dimiliki pengguna (jangan lagu tema serial lain).
- `render.cjs --musik musik.mp3 --volume-musik 0.2` → di-loop, fade-in/out, dan otomatis mengecil saat ada dialog (sidechain ducking).
- Karakter musik: ukulele/marimba/perkusi ringan, tempo 100–120 BPM untuk ceria; piano lembut untuk haru.

## Efek suara (SFX)
Mesin belum memutar SFX per aksi. Cara cepat: campur setelah render dengan ffmpeg, mis. bunyi "boing"
saat `lompat` di detik 2,1:
```bash
ffmpeg -i final.mp4 -i boing.wav -filter_complex "[1:a]adelay=2100:all=1[s];[0:a][s]amix=inputs=2:normalize=0[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac final-sfx.mp4
```
(Bila video tanpa audio, gunakan `[1:a]adelay=...,apad[a]` dan `-shortest`.)
