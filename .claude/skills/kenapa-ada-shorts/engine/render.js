// node render.js <story.json> <out.mp4|stills-dir> [--stills t1,t2,...] [--fps 30] [--from s --to s]
const http = require('http'), fs = require('fs'), path = require('path'), { spawn } = require('child_process');
const { chromium } = require('playwright');
const args = process.argv.slice(2);
const storyPath = path.resolve(args[0]), outPath = path.resolve(args[1]);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const FPS = +opt('fps', 30);
const ROOT = __dirname;
const WORK = path.dirname(storyPath);
const mime = { '.js': 'text/javascript', '.html': 'text/html', '.woff2': 'font/woff2', '.json': 'application/json', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
const srv = http.createServer((q, r) => {
  let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html';
  // /work/... = folder story.json (untuk gambar/aset milik episode, mis. foto produk)
  const base = p.startsWith('/work/') ? WORK : ROOT; if (p.startsWith('/work/')) p = p.slice(5);
  const f = path.join(base, p); if (!f.startsWith(base) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': mime[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
}).listen(0);
(async () => {
  const port = srv.address().port;
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.log('[page]', m.text()); });
  page.on('pageerror', e => console.log('[pageerror]', e.message));
  await page.goto(`http://127.0.0.1:${port}/`);
  await page.waitForFunction(() => window.ENGINE_READY && window.loadStory, null, { timeout: 60000 });
  const story = JSON.parse(fs.readFileSync(storyPath, 'utf8'));
  const total = await page.evaluate(s => window.loadStory(s), story);
  console.log('total', total.toFixed(2), 's');
  const stills = opt('stills');
  if (stills) {
    fs.mkdirSync(outPath, { recursive: true });
    for (const t of stills.split(',').map(Number)) {
      const d = await page.evaluate(t => { window.renderAt(t); return window.frameJPEG(); }, t);
      fs.writeFileSync(path.join(outPath, `still_${t.toFixed(2)}.jpg`), Buffer.from(d.split(',')[1], 'base64'));
    }
  } else {
    const from = +opt('from', 0), to = Math.min(+opt('to', total), total);
    const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', outPath], { stdio: ['pipe', 'inherit', 'inherit'] });
    const n = Math.round((to - from) * FPS); const t0 = Date.now();
    for (let i = 0; i < n; i++) {
      const d = await page.evaluate(t => { window.renderAt(t); return window.frameJPEG(); }, from + i / FPS);
      if (!ff.stdin.write(Buffer.from(d.split(',')[1], 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
      if (i % 60 === 0) console.log(`frame ${i}/${n}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
  }
  await browser.close(); srv.close();
})().catch(e => { console.error(e); process.exit(1); });
