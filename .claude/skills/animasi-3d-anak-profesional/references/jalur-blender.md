# Jalur Mutu Studio: Blender

Gunakan bila pengguna punya PC/laptop dengan GPU dan ingin mutu setara serial TV
(rig wajah, kain, rambut, render path-tracing). Mesin HTML tetap dipakai sebagai **animatic/previz**:
timing, shot, dan dialog dari NASKAH langsung menjadi acuan di Blender.

## Pipeline
1. **Pra-produksi** (skill ini): naskah, desain tokoh, NASKAH → render animatic `--skala 0.5` + suara final.
2. **Modeling tokoh** (Blender 4.x): mulai dari bentuk bulat (Subdivision Surface), kepala ±40% tinggi untuk anak;
   mata = bola + kornea transparan; mulut dengan shape keys (A, E, I, O, U, M, senyum, cemberut).
3. **Rigging**: Rigify (Human meta-rig, kecilkan proporsi), tambah tulang wajah atau shape-key driver untuk alis/kelopak.
4. **Lip-sync**: Rhubarb Lip Sync (gratis) membaca file suara → keyframe visem otomatis ke shape keys.
5. **Animasi**: blocking pose sesuai animatic → spline → polish (12 prinsip). 25 fps.
6. **Latar**: rumah panggung, kelapa, dll. Gunakan aset CC0 (Poly Haven, Quaternius, Kenney) bila perlu.
7. **Shading**: Principled BSDF, kulit dengan Subsurface 0,1–0,2 warna jingga-merah, roughness 0,5;
   baju roughness 0,7–0,8. Hindari tekstur realistis — warna solid + sedikit noise.
8. **Lighting**: Sun 3–5 (hangat) + HDRI langit cerah + rim light; AgX/Filmic view transform.
9. **Render**: EEVEE (cepat, bayangan lembut, AO) atau Cycles 64–128 sampel + denoise; 1920×1080, 25 fps,
   PNG sequence → gabung dengan ffmpeg + audio.
10. **Pasca**: color grading ringan (saturasi +5–10%), judul/subtitle, musik, SFX.

## Estimasi waktu (1 orang)
Tokoh + rig: 2–5 hari per tokoh · Latar: 2–4 hari · Animasi: 3–10 dtk per hari (mutu TV) ·
Render EEVEE 1080p: 2–10 dtk/bingkai di GPU menengah.

## Pembagian tugas yang realistis untuk Claude
Claude dapat menulis naskah, NASKAH/animatic, skrip Python Blender untuk membangun latar sederhana,
mengatur kamera dari daftar shot, batch render, dan ffmpeg. Pemodelan wajah halus dan polish animasi
tetap paling baik dikerjakan animator manusia.
