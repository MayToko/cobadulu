#!/usr/bin/env node
/*
  Render episode HTML (dari assets/template-episode.html) menjadi MP4 secara offline,
  bingkai demi bingkai (deterministik, tanpa patah-patah), lalu gabungkan suara & musik.

  Pemakaian:
    node render.cjs <episode.html> [opsi]

  Opsi:
    --out <file.mp4>        File keluaran (bawaan: <nama-episode>.mp4 di folder episode)
    --skala <angka>         1 = 1080p penuh, 0.5 = draf cepat (bawaan 1)
    --fps <angka>           Timpa fps naskah
    --dari <detik>          Mulai render dari detik ini (draf sebagian; tanpa audio)
    --sampai <detik>        Berhenti di detik ini
    --musik <file>          Musik latar (di-loop, otomatis "ducking" saat ada dialog)
    --volume-musik <0-1>    Volume musik (bawaan 0.22)
    --foto <t1,t2,...>      Hanya simpan foto PNG di detik-detik itu (untuk QC), tanpa video
    --crf <angka>           Kualitas x264 (bawaan 18; lebih kecil = lebih bagus)

  Suara dialog: isi "audio":"suara/01.mp3" pada aksi bicara di naskah (path relatif ke file HTML).
*/
const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

function arg(nama, bawaan) {
  const i = process.argv.indexOf('--' + nama);
  return i > -1 ? process.argv[i + 1] : bawaan;
}
const fileHtml = process.argv[2];
if (!fileHtml || fileHtml.startsWith('--')) {
  console.error('Pemakaian: node render.cjs <episode.html> [--out video.mp4] [--skala 0.5] [--musik m.mp3] [--foto 1,4,8]');
  process.exit(1);
}
const htmlAbs = path.resolve(fileHtml);
const dirEpisode = path.dirname(htmlAbs);
const skala = parseFloat(arg('skala', '1'));
const crf = arg('crf', '18');
const fotoArg = arg('foto', null);

function cariThree() {
  const cache = path.join(__dirname, '.cache');
  const lokasi = p => path.join(p, 'node_modules', 'three', 'build', 'three.module.js');
  for (const p of [cache, process.cwd(), dirEpisode]) if (fs.existsSync(lokasi(p))) return lokasi(p);
  console.log('• Mengunduh three@0.160.0 (sekali saja) ke', cache);
  fs.mkdirSync(cache, { recursive: true });
  execSync(`npm install three@0.160.0 --prefix "${cache}" --no-audit --no-fund --silent`, { stdio: 'inherit' });
  return lokasi(cache);
}

function muatPlaywright() {
  try { return require('playwright'); } catch (_) {}
  try { return require(require.resolve('playwright', { paths: [process.cwd()] })); } catch (_) {}
  console.error('Playwright tidak ditemukan. Pasang: npm i -D playwright && npx playwright install chromium');
  process.exit(1);
}

(async () => {
  const threePath = cariThree();
  const { chromium } = muatPlaywright();
  const browser = await chromium.launch({
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-web-security']
  });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  page.on('console', m => { if (['error', 'warning'].includes(m.type()) && !/GPU stall|GL Driver/.test(m.text())) console.log('  [halaman]', m.text()); });
  page.on('pageerror', e => console.error('  [galat halaman]', e.message));
  await page.route('**/*', route => {
    const url = route.request().url();
    if (url.startsWith('file:')) return route.continue();
    if (/three@[\d.]+\/build\/three\.module(\.min)?\.js/.test(url))
      return route.fulfill({ path: threePath, contentType: 'application/javascript', headers: { 'Access-Control-Allow-Origin': '*' } });
    return route.abort();
  });
  await page.goto('file://' + htmlAbs + '?render=1&skala=' + skala);
  await page.waitForFunction('window.__siap === true', null, { timeout: 120000 });
  const info = await page.evaluate(() => ({ durasi: __studio.durasi, fps: __studio.fps, ukuran: __studio.ukuran, judul: __studio.judul, linimasa: __studio.linimasa }));
  const fps = parseFloat(arg('fps', info.fps));
  console.log(`• "${info.judul}" — ${info.durasi.toFixed(2)} dtk, ${info.ukuran[0]}x${info.ukuran[1]}, ${fps} fps`);

  // ---- Mode foto QC ----
  if (fotoArg) {
    const dirFoto = path.resolve(arg('out', path.join(dirEpisode, 'foto-qc')));
    fs.mkdirSync(dirFoto, { recursive: true });
    for (const s of fotoArg.split(',').map(Number)) {
      await page.evaluate(t => __studio.frame(t), s);
      const data = await page.evaluate(() => __studio.ambil('image/png'));
      const f = path.join(dirFoto, `foto-${s.toFixed(2)}s.png`);
      fs.writeFileSync(f, Buffer.from(data.split(',')[1], 'base64'));
      console.log('  ✓', f);
    }
    await browser.close();
    return;
  }

  // ---- Mode video ----
  const dari = parseFloat(arg('dari', '0'));
  const sampai = Math.min(parseFloat(arg('sampai', info.durasi)), info.durasi);
  const sebagian = dari > 0 || sampai < info.durasi;
  const durasiOut = sampai - dari;
  const outFile = path.resolve(arg('out', path.join(dirEpisode, (info.judul || 'animasi').replace(/[^\w\-]+/g, '-') + '.mp4')));

  const ffArgs = ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(fps), '-i', '-'];
  const filter = []; let idx = 1;
  const suara = sebagian ? [] : info.linimasa.filter(l => l.audio).map(l => ({ ...l, file: path.resolve(dirEpisode, l.audio) }))
    .filter(l => { const ada = fs.existsSync(l.file); if (!ada) console.warn('  ! audio tidak ada:', l.file); return ada; });
  for (const s of suara) {
    ffArgs.push('-i', s.file);
    filter.push(`[${idx}:a]aresample=48000,aformat=channel_layouts=stereo,adelay=${Math.round(s.mulai * 1000)}:all=1[v${idx}]`);
    s.label = `[v${idx}]`; idx++;
  }
  const musik = sebagian ? null : arg('musik', null);
  let labelMusik = null;
  if (musik) {
    ffArgs.push('-stream_loop', '-1', '-i', path.resolve(musik));
    const vol = arg('volume-musik', '0.22');
    filter.push(`[${idx}:a]aresample=48000,aformat=channel_layouts=stereo,volume=${vol},atrim=0:${durasiOut},afade=t=in:d=0.8,afade=t=out:st=${Math.max(0, durasiOut - 1.8)}:d=1.8[mus]`);
    labelMusik = '[mus]'; idx++;
  }
  let adaAudio = false;
  if (suara.length) {
    filter.push(`${suara.map(s => s.label).join('')}amix=inputs=${suara.length}:normalize=0:dropout_transition=0,apad=whole_dur=${durasiOut}[vok]`);
    if (labelMusik) {
      filter.push('[vok]asplit=2[vok1][vok2]');
      filter.push(`${labelMusik}[vok2]sidechaincompress=threshold=0.04:ratio=8:attack=30:release=400[musd]`);
      filter.push('[vok1][musd]amix=inputs=2:normalize=0:dropout_transition=0,alimiter=limit=0.95[aout]');
    } else filter.push('[vok]alimiter=limit=0.95[aout]');
    adaAudio = true;
  } else if (labelMusik) { filter.push(`${labelMusik}anull[aout]`); adaAudio = true; }
  if (adaAudio) ffArgs.push('-filter_complex', filter.join(';'), '-map', '0:v', '-map', '[aout]', '-c:a', 'aac', '-b:a', '192k');
  ffArgs.push('-c:v', 'libx264', '-preset', 'medium', '-crf', crf, '-pix_fmt', 'yuv420p', '-t', durasiOut.toFixed(3), '-movflags', '+faststart', outFile);

  const ff = spawn('ffmpeg', ffArgs, { stdio: ['pipe', 'inherit', 'inherit'] });
  const selesaiFF = new Promise((ok, gagal) => ff.on('close', c => c === 0 ? ok() : gagal(new Error('ffmpeg keluar dengan kode ' + c))));
  const total = Math.round(durasiOut * fps), t0 = Date.now();
  console.log(`• Merender ${total} bingkai → ${outFile}`);
  for (let i = 0; i < total; i++) {
    const t = dari + i / fps;
    const data = await page.evaluate(tt => { __studio.frame(tt); return __studio.ambil('image/jpeg', 0.95); }, t);
    const buf = Buffer.from(data.split(',')[1], 'base64');
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 25 === 0 || i === total - 1) {
      const lalu = (Date.now() - t0) / 1000, sisa = lalu / (i + 1) * (total - i - 1);
      process.stdout.write(`\r  bingkai ${i + 1}/${total}  (${(lalu / (i + 1)).toFixed(2)} dtk/bingkai, sisa ±${Math.ceil(sisa)} dtk)   `);
    }
  }
  ff.stdin.end();
  await selesaiFF;
  await browser.close();
  console.log(`\n✓ Selesai: ${outFile}${adaAudio ? '' : ' (tanpa audio)'}`);
})().catch(e => { console.error('\n✗', e.message); process.exit(1); });
