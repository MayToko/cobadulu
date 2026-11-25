// =====================================================================
//  KENAPA-ADA SHORTS — toon 3D engine (Three.js) — browser side
//  Meniru gaya referensi: karakter kepala bulat + badan kapsul, outline
//  tebal ungu-tua, toon shading 3 tingkat, cahaya matahari hangat keras,
//  bayangan jendela, grading oranye-coklat, vignette berat, grain, debu.
// =====================================================================
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

// MODE: "3d" (default, PBR + wajah 3D + AO + DOF + teks/ikon/partikel 3D) atau "toon" (tampilan referensi lama)
let STYLE3D = true, OUTLINE3D = 0;

const W = window.RENDER_W || 720, H = window.RENDER_H || 1280;   // render 3D
const OW = 1080, OH = 1920;                                       // output
const INK = 0x1c1022;            // warna garis outline (ungu-hitam)
const INK_CSS = '#1c1022';
const SKIN = '#f2e4c4';          // krem kepala

// ---------------------------------------------------------------- renderer
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
const rt = new THREE.WebGLRenderTarget(W, H, { samples: 4, type: THREE.UnsignedByteType });
rt.texture.colorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, W / H, 0.05, 200);

// ---------------------------------------------------------------- materials
const grad = (() => {
  const d = new Uint8Array([150, 150, 150, 255, 205, 205, 205, 255, 240, 240, 240, 255, 255, 255, 255, 255]);
  const t = new THREE.DataTexture(d, 4, 1, THREE.RGBAFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t;
})();
const matCache = {};
function toon(color, extra = {}) {
  const k = color + JSON.stringify(extra);
  if (!extra.map && matCache[k]) return matCache[k];
  const m = STYLE3D
    ? new THREE.MeshStandardMaterial({ color: new THREE.Color(color), roughness: 0.6, metalness: 0.0, envMapIntensity: 0.55, ...extra })
    : new THREE.MeshToonMaterial({ color: new THREE.Color(color), gradientMap: grad, ...extra });
  if (!extra.map) matCache[k] = m;
  return m;
}
const outlineMat = (th) => {
  const m = new THREE.ShaderMaterial({
    uniforms: { th: { value: th } },
    vertexShader: `uniform float th; void main(){ vec3 p = position + normal*th; gl_Position = projectionMatrix*modelViewMatrix*vec4(p,1.0);} `,
    fragmentShader: `void main(){ gl_FragColor = vec4(${Math.pow(((INK >> 16) & 255) / 255,2.2)},${Math.pow(((INK >> 8) & 255) / 255,2.2)},${Math.pow((INK & 255) / 255,2.2)},1.0);} `,
    side: THREE.BackSide,
  });
  return m;
};
const OUT = { s: outlineMat(0.011), m: outlineMat(0.018), l: outlineMat(0.026) };

// mesh + outline (normal-extrusion, untuk bentuk bulat)
function mk(geo, color, { out = 'm', shadow = true, recv = true, mat } = {}) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(geo, mat || toon(color));
  m.castShadow = shadow; m.receiveShadow = recv;
  g.add(m);
  if (out && (!STYLE3D || OUTLINE3D)) { const o = new THREE.Mesh(geo, OUT[out]); g.add(o); }
  g.userData.mesh = m;
  return g;
}
// kotak + outline (scale-based, rapi di sudut)
function box(w, h, d, color, { out = 0.018, mat, shadow = true, recv = true } = {}) {
  const g = new THREE.Group();
  const geo = new THREE.BoxGeometry(w, h, d);
  const m = new THREE.Mesh(geo, mat || toon(color)); m.castShadow = shadow; m.receiveShadow = recv; g.add(m);
  if (out && (!STYLE3D || OUTLINE3D)) {
    const o = new THREE.Mesh(new THREE.BoxGeometry(w + out * 2, h + out * 2, d + out * 2),
      new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide }));
    g.add(o);
  }
  g.userData.mesh = m;
  return g;
}
function cyl(rt_, rb, h, color, opt = {}) { return mk(new THREE.CylinderGeometry(rt_, rb, h, 40), color, opt); }
function sph(r, color, opt = {}) { return mk(new THREE.SphereGeometry(r, 40, 28), color, opt); }

// ---------------------------------------------------------------- canvas textures
function canvasTex(w, h, draw, { repeat, nearest } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d'); draw(x, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}
function rnd(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
// papan kayu: garis papan horizontal + paku + serat
function woodTex(base = '#8a3f1e', { planks = 6, vertical = false, seed = 7, nails = true } = {}) {
  return canvasTex(512, 512, (x, w, h) => {
    const r = rnd(seed);
    x.fillStyle = base; x.fillRect(0, 0, w, h);
    const ph = h / planks;
    for (let i = 0; i < planks; i++) {
      const c = new THREE.Color(base); c.offsetHSL(0, 0, (r() - 0.5) * 0.06);
      x.fillStyle = '#' + c.getHexString(); x.fillRect(0, i * ph, w, ph);
      x.strokeStyle = 'rgba(40,12,5,0.35)'; x.lineWidth = 1.5;
      for (let k = 0; k < 3; k++) { const yy = i * ph + r() * ph; x.beginPath(); x.moveTo(r() * w * 0.5, yy); x.lineTo(w * (0.5 + r() * 0.5), yy + (r() - 0.5) * 4); x.stroke(); }
      x.fillStyle = INK_CSS; x.fillRect(0, i * ph - 2, w, 4);
      const jx = r() * w; x.fillRect(jx, i * ph, 4, ph);
      if (nails) { x.beginPath(); x.arc(jx + 18, i * ph + ph / 2, 5, 0, 7); x.fill(); x.beginPath(); x.arc(jx - 14, i * ph + ph / 2, 5, 0, 7); x.fill(); }
    }
    if (vertical) { const d = x.getImageData(0, 0, w, h); x.putImageData(d, 0, 0); }
  });
}
function brickTex(base = '#d9c7a0') {
  return canvasTex(512, 512, (x, w, h) => {
    x.fillStyle = base; x.fillRect(0, 0, w, h);
    const r = rnd(3); const bh = 42, bw = 128;
    for (let row = 0; row * bh < h; row++) {
      const off = row % 2 ? bw / 2 : 0;
      for (let col = -1; col * bw < w; col++) {
        const c = new THREE.Color(base); c.offsetHSL(0, 0, (r() - 0.5) * 0.07);
        x.fillStyle = '#' + c.getHexString(); x.fillRect(col * bw + off, row * bh, bw, bh);
        x.strokeStyle = 'rgba(60,40,20,0.45)'; x.lineWidth = 3; x.strokeRect(col * bw + off, row * bh, bw, bh);
      }
    }
  });
}
function grassTex() {
  return canvasTex(512, 512, (x, w, h) => {
    x.fillStyle = '#4f8a2a'; x.fillRect(0, 0, w, h);
    const r = rnd(11); x.strokeStyle = 'rgba(30,70,15,0.7)'; x.lineWidth = 3;
    for (let i = 0; i < 160; i++) { const px = r() * w, py = r() * h; x.beginPath(); x.moveTo(px - 6, py - 8); x.lineTo(px, py); x.lineTo(px + 6, py - 8); x.stroke(); }
  });
}
function textTex(lines, { bg = '#f3c64a', fg = '#c0281e', w = 512, h = 256, border = true, font = '900 70px Poppins' } = {}) {
  return canvasTex(w, h, (x) => {
    x.fillStyle = bg; x.fillRect(0, 0, w, h);
    if (border) { x.strokeStyle = INK_CSS; x.lineWidth = 14; x.strokeRect(7, 7, w - 14, h - 14); }
    x.fillStyle = fg; x.font = font; x.textAlign = 'center'; x.textBaseline = 'middle';
    lines.forEach((l, i) => x.fillText(l, w / 2, h / 2 + (i - (lines.length - 1) / 2) * parseInt(font.match(/(\d+)px/)[1]) * 1.1));
  });
}

// ---------------------------------------------------------------- faces
// Wajah digambar 2D di patch bola depan kepala — ekspresi seperti referensi.
function drawFace(x, expr, s) {
  const S = 512; x.clearRect(0, 0, S, S);
  x.strokeStyle = INK_CSS; x.fillStyle = INK_CSS; x.lineCap = 'round'; x.lineJoin = 'round';
  const L = 196, R = 316, EY = 250, MY = 345;
  const dotEye = (cx, cy, rx = 17, ry = 24) => { x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, 7); x.fill(); };
  const brow = (cx, cy, ang, len = 46) => { x.lineWidth = 11; x.beginPath(); x.moveTo(cx - len / 2 * Math.cos(ang), cy - len / 2 * Math.sin(ang)); x.lineTo(cx + len / 2 * Math.cos(ang), cy + len / 2 * Math.sin(ang)); x.stroke(); };
  const sweat = () => { x.fillStyle = '#5fb3e6'; x.strokeStyle = INK_CSS; x.lineWidth = 5; x.beginPath(); x.moveTo(380, 160); x.quadraticCurveTo(410, 215, 392, 228); x.quadraticCurveTo(360, 232, 368, 205); x.closePath(); x.fill(); x.stroke(); x.fillStyle = INK_CSS; };
  const squig = (y, w = 110) => { x.lineWidth = 9; x.beginPath(); for (let i = 0; i <= 6; i++) { const px = 256 - w / 2 + i * w / 6; const py = y + (i % 2 ? -12 : 12); i ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke(); };
  switch (expr) {
    case 'smile': dotEye(L, EY); dotEye(R, EY); x.lineWidth = 10; x.beginPath(); x.arc(256, MY - 40, 52, 0.25 * Math.PI, 0.75 * Math.PI); x.stroke(); break;
    case 'happy': // ^^ + mulut terbuka
      x.lineWidth = 11; [L, R].forEach(cx => { x.beginPath(); x.arc(cx, EY + 12, 30, 1.15 * Math.PI, 1.85 * Math.PI); x.stroke(); });
      x.beginPath(); x.moveTo(200, MY - 20); x.quadraticCurveTo(256, MY + 70, 312, MY - 20); x.closePath(); x.fillStyle = '#5a1020'; x.fill(); x.stroke();
      x.fillStyle = '#e45a6a'; x.beginPath(); x.ellipse(256, MY + 18, 26, 12, 0, 0, 7); x.fill(); x.fillStyle = INK_CSS; break;
    case 'content': // ^^ senyum tipis
      x.lineWidth = 11; [L, R].forEach(cx => { x.beginPath(); x.arc(cx, EY + 12, 30, 1.15 * Math.PI, 1.85 * Math.PI); x.stroke(); });
      x.lineWidth = 10; x.beginPath(); x.arc(256, MY - 40, 46, 0.28 * Math.PI, 0.72 * Math.PI); x.stroke(); break;
    case 'worried': dotEye(L, EY + 10, 15, 21); dotEye(R, EY + 10, 15, 21); brow(L, EY - 50, -0.35); brow(R, EY - 50, 0.35); squig(MY + 5); if (s && s.sweat !== false) sweat(); break;
    case 'nervous': dotEye(L, EY + 10, 15, 21); dotEye(R, EY + 10, 15, 21); squig(MY + 5, 90); sweat(); break;
    case 'annoyed': // kelopak setengah, mulut cemberut
      x.lineWidth = 12; [L, R].forEach(cx => { x.beginPath(); x.moveTo(cx - 40, EY - 4); x.lineTo(cx + 40, EY - 4); x.stroke(); x.beginPath(); x.ellipse(cx, EY + 8, 30, 13, 0, 0, Math.PI); x.fill(); });
      brow(L, EY - 50, 0.12); brow(R, EY - 50, -0.12);
      x.lineWidth = 10; x.beginPath(); x.arc(256, MY + 40, 40, 1.25 * Math.PI, 1.75 * Math.PI); x.stroke(); break;
    case 'flat': // datar, bosan
      x.lineWidth = 12; [L, R].forEach(cx => { x.beginPath(); x.moveTo(cx - 40, EY - 4); x.lineTo(cx + 40, EY - 4); x.stroke(); x.beginPath(); x.ellipse(cx, EY + 8, 30, 13, 0, 0, Math.PI); x.fill(); });
      x.lineWidth = 10; x.beginPath(); x.moveTo(226, MY); x.lineTo(286, MY); x.stroke(); break;
    case 'shock':
      [L - 6, R + 6].forEach(cx => { x.fillStyle = '#fff'; x.lineWidth = 9; x.beginPath(); x.arc(cx, EY - 6, 46, 0, 7); x.fill(); x.stroke(); x.fillStyle = INK_CSS; x.beginPath(); x.arc(cx + 6, EY - 2, 18, 0, 7); x.fill(); });
      x.fillStyle = '#6a0f1c'; x.lineWidth = 9; x.beginPath(); x.ellipse(256, MY + 25, 30, 42, 0, 0, 7); x.fill(); x.stroke(); x.fillStyle = INK_CSS; break;
    case 'dizzy':
      x.lineWidth = 8; [L, R].forEach(cx => { x.beginPath(); for (let a = 0; a < 14; a += 0.2) { const rr = 3 + a * 2.6; x.lineTo(cx + Math.cos(a) * rr, EY + Math.sin(a) * rr); } x.stroke(); });
      squig(MY + 15); break;
    case 'sleepy': x.lineWidth = 11; [L, R].forEach(cx => { x.beginPath(); x.arc(cx, EY - 6, 28, 0.15 * Math.PI, 0.85 * Math.PI); x.stroke(); }); x.beginPath(); x.ellipse(256, MY + 10, 14, 18, 0, 0, 7); x.stroke(); break;
    case 'blink': x.lineWidth = 10; [L, R].forEach(cx => { x.beginPath(); x.moveTo(cx - 22, EY); x.lineTo(cx + 22, EY); x.stroke(); }); x.lineWidth = 10; x.beginPath(); x.moveTo(230, MY); x.lineTo(282, MY); x.stroke(); break;
    case 'mouthOnly': x.lineWidth = 13; x.beginPath(); x.moveTo(222, MY + 40); x.lineTo(290, MY + 40); x.stroke(); break;
    case 'mouthSmile': x.lineWidth = 12; x.beginPath(); x.arc(256, MY - 5, 52, 0.25 * Math.PI, 0.75 * Math.PI); x.stroke(); break;
    case 'mouthOpen': x.fillStyle = '#5a1020'; x.lineWidth = 10; x.beginPath(); x.moveTo(205, MY + 20); x.quadraticCurveTo(256, MY + 100, 307, MY + 20); x.closePath(); x.fill(); x.stroke(); x.fillStyle = INK_CSS; break;
    case 'talk': dotEye(L, EY); dotEye(R, EY); x.fillStyle = '#5a1020'; x.lineWidth = 9; x.beginPath(); x.ellipse(256, MY + 5, 28, 20, 0, 0, 7); x.fill(); x.stroke(); x.fillStyle = INK_CSS; break;
    default: // neutral
      dotEye(L, EY); dotEye(R, EY); x.lineWidth = 10; x.beginPath(); x.moveTo(232, MY); x.lineTo(280, MY); x.stroke();
  }
}

// ---------------------------------------------------------------- characters
// spec: {body, hair:'bowl'|'cover'|'hijab'|'peci'|'caping'|'grey'|'cap', hairColor, hijab, collar, bag, glasses, scale}
const chars = {};
function makeChar(id, spec) {
  const root = new THREE.Group(); root.name = id;
  const S = spec.scale || 1;
  const rig = new THREE.Group(); root.add(rig); rig.scale.setScalar(S);
  const bodyCol = spec.body || '#8a5a2b';
  const limbCol = spec.limb || '#1f2550';
  // kaki
  const legs = [];
  for (const sx of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(sx * 0.11, 0.62, 0);
    const leg = cyl(0.026, 0.026, 0.6, limbCol, { out: 's' }); leg.position.y = -0.3; hip.add(leg);
    const foot = sph(0.05, limbCol, { out: 's' }); foot.position.set(0, -0.6, 0.02); foot.scale.set(1, 0.75, 1.3); hip.add(foot);
    rig.add(hip); legs.push(hip);
  }
  // badan telur/kapsul
  const prof = []; for (let i = 0; i <= 24; i++) { const a = i / 24 * Math.PI; const r = Math.sin(a) * (0.30 + 0.04 * Math.cos(a) * -1); prof.push(new THREE.Vector2(Math.max(r, 0.0001), -Math.cos(a) * 0.48)); }
  const body = mk(new THREE.LatheGeometry(prof, 48), bodyCol, { out: 'm' }); body.position.y = 1.02; rig.add(body);
  // kancing
  if (spec.buttons !== false) for (let i = 0; i < 4; i++) {
    const yy = 1.2 - i * 0.14; const zz = Math.sqrt(Math.max(0.0001, 0.30 ** 2 * (1 - ((yy - 1.02) / 0.48) ** 2))) + 0.005;
    const b = sph(0.026, '#f0dca0', { out: 's', shadow: false }); b.position.set(0, yy, zz); rig.add(b);
  }
  // kerah / syal
  if (spec.collar) { const c = mk(new THREE.TorusGeometry(0.2, 0.075, 16, 40), spec.collar, { out: 'm' }); c.rotation.x = Math.PI / 2; c.position.y = 1.45; c.scale.set(1.15, 1.15, 1); rig.add(c); }
  // tas selempang
  if (spec.bag) {
    const strap = cyl(0.012, 0.012, 0.95, '#3a2010', { out: 's' }); strap.position.set(0, 1.08, 0.27); strap.rotation.z = 0.75; rig.add(strap);
    const pouch = sph(0.15, spec.bag === true ? '#6b3a17' : spec.bag, { out: 'm' }); pouch.scale.set(1, 0.85, 0.45); pouch.position.set(0.26, 0.82, 0.24); rig.add(pouch);
  }
  // lengan
  const arms = [];
  for (const sx of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(sx * 0.27, 1.3, 0.0);
    const arm = cyl(0.022, 0.022, 0.5, limbCol, { out: 's' }); arm.position.y = -0.25; sh.add(arm);
    const hand = sph(0.045, limbCol, { out: 's' }); hand.position.y = -0.5; sh.add(hand);
    sh.rotation.z = sx * 0.18; rig.add(sh); arms.push(sh);
  }
  // kepala
  const head = new THREE.Group(); head.position.y = 1.78; rig.add(head);
  const HR = 0.36;
  const skull = mk(new THREE.SphereGeometry(HR, 72, 54), SKIN, { out: 'l' }); head.add(skull);
  // wajah (patch bola)
  const fc = document.createElement('canvas'); fc.width = fc.height = 512;
  const ftex = new THREE.CanvasTexture(fc); ftex.colorSpace = THREE.SRGBColorSpace;
  const faceGeo = new THREE.SphereGeometry(HR * 1.012, 48, 36, Math.PI / 2 - 0.95, 1.9, Math.PI / 2 - 0.95, 1.9);
  const face = new THREE.Mesh(faceGeo, new THREE.MeshToonMaterial({ map: ftex, alphaTest: 0.4, gradientMap: grad }));
  face.renderOrder = 2; head.add(face);
  // rambut / penutup kepala
  const hc = spec.hairColor || '#1b1838';
  const hair = spec.hair || 'bowl';
  if (hair === 'bowl' || hair === 'cover') {
    const th = hair === 'cover' ? 1.58 : 1.25; // cover = poni menutup mata
    const cap = mk(new THREE.SphereGeometry(HR * 1.06, 40, 24, 0, Math.PI * 2, 0, th), hc, { out: 'l' });
    cap.rotation.x = hair === 'cover' ? 0.2 : 0.18; head.add(cap);
    if (hair === 'cover') { const rim = mk(new THREE.TorusGeometry(HR * 0.98, 0.03, 10, 48, Math.PI * 2), '#2c2a55', { out: false }); rim.rotation.x = Math.PI / 2 - 0.32 + 0.0; rim.position.set(0, -0.017, 0.0); rim.scale.set(1.0, 1.0, 1); }
  } else if (hair === 'peci') {
    const p = cyl(HR * 0.86, HR * 0.9, 0.2, '#1a1626', { out: 'm' }); p.position.y = HR * 0.74; p.rotation.x = -0.12; head.add(p);
  } else if (hair === 'cap') { // topi
    const cap = mk(new THREE.SphereGeometry(HR * 1.07, 40, 24, 0, Math.PI * 2, 0, 1.2), hc, { out: 'l' }); cap.rotation.x = 0.15; head.add(cap);
    const brim = cyl(0.22, 0.22, 0.02, hc, { out: 's' }); brim.scale.set(1, 1, 0.8); brim.position.set(0, HR * 0.38, HR * 0.85); brim.rotation.x = 0.25; head.add(brim);
  } else if (hair === 'caping') {
    const c = mk(new THREE.ConeGeometry(0.62, 0.32, 48, 1, true), '#e8c25a', { out: 'm' }); c.position.y = HR * 0.82; head.add(c);
    c.userData.mesh.material = toon('#e8c25a', { side: THREE.DoubleSide });
  } else if (hair === 'grey') {
    const cap = mk(new THREE.SphereGeometry(HR * 1.045, 40, 24, 0, Math.PI * 2, 0, 1.0), '#9a9aa4', { out: 'l' }); cap.rotation.x = 0.1; head.add(cap);
  } else if (hair === 'hijab') {
    const hj = spec.hijab || '#12aac2';
    const hood = mk(new THREE.SphereGeometry(HR * 1.15, 48, 32), hj, { out: 'l' }); hood.position.set(0, 0.0, -0.08); head.add(hood);
    const ring = mk(new THREE.TorusGeometry(0.325, 0.07, 18, 64), hj, { out: 'm' }); ring.position.set(0, 0.0, 0.175); head.add(ring);
    skull.position.z = 0.03; face.position.z = 0.03;
    const drape = mk(new THREE.CylinderGeometry(0.3, 0.42, 0.34, 40, 1, true), spec.collar2 || '#3b4fb0', { out: 'm' }); drape.position.y = 1.47; rig.add(drape);
    drape.userData.mesh.material = toon(spec.collar2 || '#3b4fb0', { side: THREE.DoubleSide });
  } else if (hair === 'bob') { // rambut bob wanita (Bu Sari)
    const cap = mk(new THREE.SphereGeometry(HR * 1.08, 40, 24, 0, Math.PI * 2, 0, 1.75), hc, { out: 'l' }); cap.rotation.x = -0.35; cap.position.z = -0.02; head.add(cap);
    const fr = mk(new THREE.SphereGeometry(HR * 1.075, 40, 16, Math.PI / 2 - 0.9, 1.8, 0, 0.82), hc, { out: false }); head.add(fr);
  }
  if (spec.glasses) {
    for (const sx of [-1, 1]) { const g = mk(new THREE.TorusGeometry(0.07, 0.012, 8, 30), INK_CSS, { out: false, shadow: false }); g.position.set(sx * 0.065, 0.03, HR * 0.95); head.add(g); }
  }
  if (spec.bodyScale) body.scale.set(...spec.bodyScale);
  const ch = { id, root, rig, head, legs, arms, face, ftex, fc, spec, expr: null, body, base: { y: 0 } };
  if (STYLE3D) { face.visible = false; buildFace3D(ch, head, HR, spec, hair === 'hijab' ? 0.03 : 0); }
  else ch.setExpr = (e) => { if (ch.expr === e) return; ch.expr = e; drawFace(fc.getContext('2d'), e, spec); ftex.needsUpdate = true; };
  ch.setExpr(spec.expr || 'neutral');
  root.traverse(o => { if (o.isMesh && o.material.isMeshToonMaterial) o.castShadow = true; });
  chars[id] = ch; return ch;
}

// ---------------------------------------------------------------- wajah 3D (mode 3d)
// Fitur wajah = mesh 3D yang menempel di permukaan bola kepala (bukan tekstur):
// mata hitam mengilap + titik pantul, kelopak, alis kapsul, mulut torus/setengah-bola, keringat 3D.
const F3 = {};
function f3mat() {
  if (F3.ink) return F3;
  F3.ink = new THREE.MeshStandardMaterial({ color: '#1a1220', roughness: 0.18, metalness: 0.0, envMapIntensity: 1.2 });
  F3.white = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.25, envMapIntensity: 0.8 });
  F3.hi = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  F3.mouth = new THREE.MeshStandardMaterial({ color: '#5a1022', roughness: 0.45 });
  F3.tongue = new THREE.MeshStandardMaterial({ color: '#e0606e', roughness: 0.5 });
  F3.sweat = new THREE.MeshPhysicalMaterial({ color: '#7cc8f0', roughness: 0.05, transmission: 0.0, clearcoat: 1.0, envMapIntensity: 1.5 });
  return F3;
}
const _Z = new THREE.Vector3(0, 0, 1);
function buildFace3D(ch, head, HR, spec, dz) {
  const M = f3mat(); const root = new THREE.Group(); root.position.z = dz; head.add(root);
  const cover = spec.hair === 'cover';
  const place = (o, x, y, lift = 0.003, rotZ = 0) => {
    const z = Math.sqrt(Math.max(0.0001, HR * HR - x * x - y * y)); const n = new THREE.Vector3(x, y, z).normalize();
    o.position.copy(n).multiplyScalar(HR + lift); o.quaternion.setFromUnitVectors(_Z, n); if (rotZ) o.rotateZ(rotZ); root.add(o); return o; };
  const mesh = (geo, mat) => { const m = new THREE.Mesh(geo, mat); m.castShadow = false; return m; };
  const EX = 0.082, EY = 0.012, BY = 0.085, MY = cover ? -0.165 : -0.115;
  const P = {};
  // mata titik (ellipsoid mengilap) + pantulan
  for (const [k, sx] of [['L', -1], ['R', 1]]) {
    const eye = new THREE.Group(); const e = mesh(new THREE.SphereGeometry(0.036, 24, 16), M.ink); e.scale.set(0.72, 1, 0.42); eye.add(e);
    const h = mesh(new THREE.SphereGeometry(0.0085, 10, 8), M.hi); h.position.set(0.008, 0.014, 0.014); eye.add(h);
    P['eye' + k] = place(eye, sx * EX, EY, 0.002);
    // mata ^^ (senang): busur torus
    const hp = mesh(new THREE.TorusGeometry(0.03, 0.0075, 10, 24, Math.PI * 0.8), M.ink); hp.rotation.z = Math.PI * 0.1;
    const hg = new THREE.Group(); hg.add(hp); P['hap' + k] = place(hg, sx * EX, EY - 0.008, 0.004);
    // mata kaget: bola putih + pupil
    const sg = new THREE.Group(); const sw = mesh(new THREE.SphereGeometry(0.05, 24, 16), M.white); sw.scale.set(1, 1, 0.55); sg.add(sw);
    const pu = mesh(new THREE.SphereGeometry(0.02, 16, 12), M.ink); pu.position.set(0.006, 0.002, 0.026); pu.scale.set(1, 1, 0.5); sg.add(pu);
    P['shk' + k] = place(sg, sx * (EX + 0.006), EY + 0.005, 0.004);
    // mata spiral (pusing)
    const pts = []; for (let a = 0; a < 14; a += 0.35) { const r = 0.004 + a * 0.0028; pts.push(new THREE.Vector3(Math.cos(a) * r * sx, Math.sin(a) * r, 0)); }
    const sp = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, 0.005, 6), M.ink); const spg = new THREE.Group(); spg.add(sp); P['spi' + k] = place(spg, sx * EX, EY, 0.004);
    // kelopak setengah (annoyed/flat): mata dipipihkan + garis kelopak
    const lid = mesh(new THREE.CapsuleGeometry(0.007, 0.07, 4, 8), M.ink); lid.rotation.z = Math.PI / 2; const lg = new THREE.Group(); lg.add(lid); P['lid' + k] = place(lg, sx * EX, EY + 0.012, 0.005);
    // alis
    const br = mesh(new THREE.CapsuleGeometry(0.008, 0.052, 4, 8), M.ink); br.rotation.z = Math.PI / 2; const bg = new THREE.Group(); bg.add(br); P['brw' + k] = place(bg, sx * EX, BY, 0.005);
  }
  // mulut
  const ml = mesh(new THREE.CapsuleGeometry(0.0085, 0.05, 4, 8), M.ink); ml.rotation.z = Math.PI / 2; const mlg = new THREE.Group(); mlg.add(ml); P.mLine = place(mlg, 0, MY, 0.004);
  const smi = mesh(new THREE.TorusGeometry(0.045, 0.0085, 10, 28, Math.PI * 0.62), M.ink); smi.rotation.z = Math.PI + Math.PI * 0.19; const smg = new THREE.Group(); smg.add(smi); P.mSmile = place(smg, 0, MY + 0.035, 0.004);
  const fr = mesh(new THREE.TorusGeometry(0.035, 0.008, 10, 24, Math.PI * 0.6), M.ink); fr.rotation.z = Math.PI * 0.2; const frg = new THREE.Group(); frg.add(fr); P.mFrown = place(frg, 0, MY - 0.03, 0.004);
  // mulut tertawa "D": setengah elips diekstrusi + lidah
  const hs = new THREE.Shape(); hs.moveTo(-0.058, 0); hs.lineTo(0.058, 0); hs.absellipse(0, 0, 0.058, 0.05, 0, Math.PI, true);
  const od = new THREE.Group(); const odm = mesh(new THREE.ExtrudeGeometry(hs, { depth: 0.006, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2, curveSegments: 20 }), M.mouth); od.add(odm);
  const tg = mesh(new THREE.SphereGeometry(0.024, 16, 10), M.tongue); tg.scale.set(1.25, 0.55, 0.3); tg.position.set(0, -0.032, 0.008); od.add(tg); P.mOpen = place(od, 0, MY + 0.03, 0.0);
  const mo = mesh(new THREE.SphereGeometry(0.03, 20, 14), M.mouth); mo.scale.set(0.8, 1.15, 0.35); const mog = new THREE.Group(); mog.add(mo); P.mO = place(mog, 0, MY - 0.005, 0.0);
  const zz = []; for (let i = 0; i <= 6; i++) zz.push(new THREE.Vector3(-0.05 + i * 0.0167, (i % 2 ? 0.011 : -0.011), 0));
  const sq = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(zz, false, 'catmullrom', 0.1), 40, 0.007, 6), M.ink); const sqg = new THREE.Group(); sqg.add(sq); P.mSquig = place(sqg, 0, MY, 0.004);
  // keringat 3D
  const dr = new THREE.Group(); const db = mesh(new THREE.SphereGeometry(0.03, 16, 12), M.sweat); dr.add(db); const dc = mesh(new THREE.ConeGeometry(0.026, 0.05, 16), M.sweat); dc.position.y = 0.032; dr.add(dc);
  P.sweat = place(dr, 0.25, 0.17, spec.hair === 'hijab' ? 0.11 : 0.03);
  const all = Object.values(P);
  const EXPR = {
    neutral: ['eyeL', 'eyeR', 'mLine'], smile: ['eyeL', 'eyeR', 'mSmile'], happy: ['hapL', 'hapR', 'mOpen'], content: ['hapL', 'hapR', 'mSmile'],
    worried: ['eyeL', 'eyeR', 'brwL', 'brwR', 'mSquig', 'sweat'], nervous: ['eyeL', 'eyeR', 'mSquig', 'sweat'],
    annoyed: ['eyeL', 'eyeR', 'lidL', 'lidR', 'brwL', 'brwR', 'mFrown'], flat: ['eyeL', 'eyeR', 'lidL', 'lidR', 'mLine'],
    shock: ['shkL', 'shkR', 'mO'], dizzy: ['spiL', 'spiR', 'mSquig'], sleepy: ['lidL', 'lidR', 'mO'], blink: ['lidL', 'lidR', 'mLine'],
    mouthOnly: ['mLine'], mouthSmile: ['mSmile'], mouthOpen: ['mOpen'], talk: ['eyeL', 'eyeR', 'mO'],
  };
  ch.setExpr = (e) => {
    if (ch.expr === e) return; ch.expr = e; const on = new Set(EXPR[e] || EXPR.neutral);
    if (cover) ['eyeL', 'eyeR', 'hapL', 'hapR', 'shkL', 'shkR', 'spiL', 'spiR', 'lidL', 'lidR', 'brwL', 'brwR'].forEach(k => on.delete(k));
    for (const k in P) P[k].visible = on.has(k);
    // pose per ekspresi
    const half = e === 'annoyed' || e === 'flat';
    for (const k of ['eyeL', 'eyeR']) { const g = P[k].children[0]; g.scale.set(0.72, half ? 0.42 : (e === 'worried' || e === 'nervous') ? 0.85 : 1, 0.42); g.position.y = half ? -0.01 : 0; }
    const ang = e === 'worried' ? -0.35 : e === 'annoyed' ? 0.28 : 0;   // khawatir: ujung dalam naik · kesal: ujung dalam turun
    P.brwL.children[0].rotation.z = Math.PI / 2 - ang; P.brwR.children[0].rotation.z = Math.PI / 2 + ang;
  };
  ch.face3 = P;
}

// ---------------------------------------------------------------- props
const props = {};
function prop(id, obj) { obj.name = id; props[id] = obj; return obj; }
const P = {
  coinJar() { const g = new THREE.Group(); const b = cyl(0.17, 0.17, 0.26, '#1f6e8c'); b.position.y = 0.13; g.add(b); const l = cyl(0.18, 0.18, 0.05, '#f2b630'); l.position.y = 0.285; g.add(l); return g; },
  candyJar() { const g = new THREE.Group();
    const t = canvasTex(256, 128, (x, w, h) => { x.fillStyle = '#b9a98a'; x.fillRect(0, 0, w, h); const cs = ['#d63a2f', '#2f8a3a', '#e3b52a', '#c04a7a']; const r = rnd(5); for (let i = 0; i < 9; i++) { x.fillStyle = cs[i % 4]; x.beginPath(); x.arc(r() * w, 20 + r() * (h - 40), 14, 0, 7); x.fill(); x.strokeStyle = INK_CSS; x.lineWidth = 3; x.stroke(); } });
    const b = mk(new THREE.CylinderGeometry(0.15, 0.15, 0.3, 40), null, { mat: toon('#ffffff', { map: t }) }); b.position.y = 0.15; g.add(b);
    const l = cyl(0.16, 0.16, 0.04, '#c4352a'); l.position.y = 0.32; g.add(l);
    for (let i = 0; i < 7; i++) { const s = sph(0.045, ['#e04a3a', '#3fa04a', '#f0c53a', '#e86fa0'][i % 4], { out: 's' }); s.position.set(Math.cos(i) * 0.08, 0.36, Math.sin(i * 1.7) * 0.06); g.add(s); }
    return g; },
  coins(n = 40, seed = 2) { const g = new THREE.Group(); const r = rnd(seed); for (let i = 0; i < n; i++) { const c = cyl(0.03, 0.03, 0.008, '#e9d6a6', { out: 's', shadow: true }); c.position.set((r() - 0.5) * 0.22, 0.005 + r() * 0.05, (r() - 0.5) * 0.14); c.rotation.set((r() - 0.5) * 0.6, 0, (r() - 0.5) * 0.6); g.add(c); } return g; },
  coin() { const c = cyl(0.05, 0.05, 0.012, '#e7c45a', { out: 's' }); return c; },
  note(color = '#5d84b0') { const g = new THREE.Group(); const b = box(0.32, 0.006, 0.15, color, { out: 0.006 }); g.add(b); const b2 = box(0.12, 0.007, 0.12, '#9fc0d8', { out: 0.004 }); b2.position.x = 0.07; g.add(b2); return g; },
  noteRed() { const g = new THREE.Group(); const b = box(0.3, 0.008, 0.14, '#f3e2c4', { out: 0.006 }); g.add(b); const b2 = box(0.09, 0.009, 0.14, '#d8342a', { out: 0.004 }); b2.position.x = -0.1; g.add(b2); return g; },
  candy() { const g = new THREE.Group(); const b = sph(0.05, '#f0b030', { out: 's' }); b.scale.set(1.4, 1, 1); g.add(b); for (const s of [-1, 1]) { const w = mk(new THREE.ConeGeometry(0.04, 0.06, 12), '#f0b030', { out: 's' }); w.rotation.z = s * Math.PI / 2; w.position.x = s * 0.09; g.add(w); } return g; },
  glass(fill = '#f08a1c') { const g = new THREE.Group(); const b = cyl(0.075, 0.06, 0.22, fill); b.position.y = 0.11; g.add(b); const top = cyl(0.078, 0.078, 0.05, '#f6e6c6', { out: 's' }); top.position.y = 0.2; g.add(top); return g; },
  cardbox(c = '#f2a531', w = 0.6, h = 0.4, d = 0.45) { const g = new THREE.Group(); const b = box(w, h, d, c); b.position.y = h / 2; g.add(b); const t = box(w * 1.002, 0.03, 0.05, '#c98a2a', { out: 0.004 }); t.position.y = h; g.add(t); return g; },
  calendar() { const g = new THREE.Group(); const p = box(0.5, 0.62, 0.01, '#f5e3c8', { out: 0.01 }); g.add(p); const r = box(0.5, 0.12, 0.012, '#d8342a', { out: 0.006 }); r.position.y = 0.25; g.add(r); return g; },
  sign(lines, opt = {}) { const w = opt.gw || 1.4, h = opt.gh || 0.7; const t = textTex(lines, opt); const g = new THREE.Group(); const b = box(w, h, 0.04, '#ffffff', { mat: toon('#ffffff', { map: t }) }); g.add(b); return g; },
  lamp() { const g = new THREE.Group(); const cord = cyl(0.006, 0.006, 1.2, '#222', { out: false }); cord.position.y = 0.6; g.add(cord);
    const shade = mk(new THREE.ConeGeometry(0.28, 0.16, 32, 1, true), '#2f8a4a', { out: 'm' }); shade.userData.mesh.material = toon('#2f8a4a', { side: THREE.DoubleSide }); g.add(shade);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 20, 14), new THREE.MeshBasicMaterial({ color: '#fff1c4' })); bulb.position.y = -0.07; g.add(bulb); return g; },
  bottle(c) { const g = new THREE.Group(); const b = cyl(0.06, 0.06, 0.22, c); b.position.y = 0.11; g.add(b); const n = cyl(0.025, 0.04, 0.08, c, { out: 's' }); n.position.y = 0.26; g.add(n); return g; },
  shelf(w = 2.6, rows = 3, seed = 4) { const g = new THREE.Group(); const r = rnd(seed); const cols = ['#c0392b', '#2e6f9e', '#d4a23a', '#3f8f4f', '#7b3f8c', '#e07a2f', '#e9e1c8', '#244a7a'];
    for (let i = 0; i < rows; i++) { const y = 0.5 + i * 0.55; const b = box(w, 0.04, 0.32, '#6e3418'); b.position.y = y; g.add(b);
      let x = -w / 2 + 0.1; while (x < w / 2 - 0.12) { const c = cols[Math.floor(r() * cols.length)]; let o; const k = r();
        if (k < 0.45) { o = P.bottle(c); x += 0.08; o.position.set(x, y + 0.02, 0); x += 0.1; }
        else { const bw = 0.12 + r() * 0.12, bh = 0.25 + r() * 0.2; o = box(bw, bh, 0.2, c, { out: 0.01 }); x += bw / 2; o.position.set(x, y + 0.02 + bh / 2, 0); x += bw / 2 + 0.03; }
        g.add(o); } }
    for (const sx of [-1, 1]) { const s = box(0.05, rows * 0.55 + 0.4, 0.32, '#5a2a12'); s.position.set(sx * w / 2, (rows * 0.55 + 0.4) / 2 + 0.2, 0); g.add(s); }
    return g; },
  counter(w = 2.2, h = 1.05, d = 0.9, base = '#a4532a') { const g = new THREE.Group(); const t = woodTex(base, { planks: 5, seed: 9 });
    const b = box(w, h, d, base, { mat: toon('#ffffff', { map: t }) }); b.position.y = h / 2; g.add(b);
    const tt = woodTex(base, { planks: 5, seed: 21 }); const top = box(w + 0.1, 0.06, d + 0.1, base, { mat: toon('#ffffff', { map: tt }) }); top.position.y = h + 0.03; g.add(top); g.userData.top = h + 0.06; return g; },
  table(w = 1.2, h = 0.8, d = 0.8, c = '#c9741f') { const g = new THREE.Group(); const top = box(w, 0.05, d, c); top.position.y = h; g.add(top);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const l = box(0.05, h, 0.05, '#7a4216', { out: 0.01 }); l.position.set(sx * (w / 2 - 0.06), h / 2, sz * (d / 2 - 0.06)); g.add(l); } g.userData.top = h + 0.025; return g; },
  stool(c = '#c63a2a') { const g = new THREE.Group(); const s = cyl(0.2, 0.2, 0.06, c); s.position.y = 0.5; g.add(s); const l = cyl(0.03, 0.05, 0.5, '#444', { out: 's' }); l.position.y = 0.25; g.add(l); return g; },
  fan() { const g = new THREE.Group(); const b = cyl(0.25, 0.28, 0.05, '#2f6b45'); g.add(b); const p = cyl(0.025, 0.025, 1.3, '#cfc7b0', { out: 's' }); p.position.y = 0.65; g.add(p);
    const ring = mk(new THREE.TorusGeometry(0.32, 0.02, 8, 40), '#2f6b45', { out: 's' }); ring.position.y = 1.4; g.add(ring); return g; },
  newspaper() { const t = canvasTex(256, 192, (x, w, h) => { x.fillStyle = '#f3e7cc'; x.fillRect(0, 0, w, h); x.fillStyle = '#222'; x.fillRect(16, 14, w - 32, 26); x.fillStyle = '#a89a86'; for (let i = 0; i < 6; i++) { x.fillRect(16, 56 + i * 20, w / 2 - 28, 7); x.fillRect(w / 2 + 12, 56 + i * 20, w / 2 - 28, 7); } });
    return box(0.6, 0.42, 0.01, '#fff', { mat: toon('#ffffff', { map: t }), out: 0.008 }); },
  bucket(c = '#7f9bb0') { const g = new THREE.Group(); const b = mk(new THREE.CylinderGeometry(0.17, 0.13, 0.3, 32, 1, true), c, { out: 'm' }); b.userData.mesh.material = toon(c, { side: THREE.DoubleSide }); b.position.y = 0.15; g.add(b); const bot = cyl(0.13, 0.13, 0.01, c, { out: false }); g.add(bot); const h = mk(new THREE.TorusGeometry(0.17, 0.012, 8, 30, Math.PI), '#8a5a2a', { out: 's' }); h.position.y = 0.3; g.add(h); return g; },
  umbrellaOpen(c = '#2f6fc0') { const g = new THREE.Group();
    const can = mk(new THREE.SphereGeometry(0.55, 32, 12, 0, Math.PI * 2, 0, 1.15), c, { out: 'm' }); can.userData.mesh.material = toon(c, { side: THREE.DoubleSide }); can.position.y = 0.55; can.scale.y = 0.75; g.add(can);
    const stick = cyl(0.012, 0.012, 1.0, '#3a2a20', { out: 's' }); stick.position.y = 0.3; g.add(stick);
    const tip = sph(0.025, '#3a2a20', { out: 's' }); tip.position.y = 0.98; g.add(tip);
    const hk = mk(new THREE.TorusGeometry(0.05, 0.012, 8, 20, Math.PI), '#3a2a20', { out: 's' }); hk.position.set(0.05, -0.2, 0); hk.rotation.z = Math.PI; g.add(hk); return g; },
  umbrellaClosed(c = '#2f6fc0') { const g = new THREE.Group();
    const b = mk(new THREE.ConeGeometry(0.07, 0.7, 16), c, { out: 's' }); b.rotation.x = Math.PI; b.position.y = 0.45; g.add(b);
    const st = cyl(0.01, 0.01, 0.25, '#3a2a20', { out: 's' }); st.position.y = 0.92; g.add(st);
    const hk = mk(new THREE.TorusGeometry(0.05, 0.013, 8, 20, Math.PI), '#3a2a20', { out: 's' }); hk.position.set(0.05, 1.05, 0); g.add(hk); return g; },
  umbrellaRack(n = 5, colors = ['#2f6fc0', '#d0402f', '#3f9a4a', '#e3b52a', '#7a3f9c']) { const g = new THREE.Group();
    const bar = cyl(0.02, 0.02, 1.4, '#5a2a12', { out: 's' }); bar.rotation.z = Math.PI / 2; bar.position.y = 1.15; g.add(bar);
    for (const sx of [-1, 1]) { const p = box(0.06, 1.2, 0.06, '#5a2a12'); p.position.set(sx * 0.72, 0.6, 0); g.add(p); }
    g.userData.items = [];
    for (let i = 0; i < n; i++) { const u = P.umbrellaClosed(colors[i % colors.length]); u.position.set(-0.55 + i * 1.1 / Math.max(1, n - 1), 0.07, 0); g.add(u); g.userData.items.push(u); }
    return g; },
  longBag(c = '#3d5a3a') { const g = new THREE.Group(); const b = cyl(0.09, 0.09, 1.0, c); b.rotation.z = 0.25; g.add(b); const cap = cyl(0.095, 0.095, 0.06, '#2a3a28', { out: 's' }); cap.position.set(-0.12, 0.48, 0); cap.rotation.z = 0.25; g.add(cap); return g; },
  dusPayung(c = '#2f6fc0') { const g = new THREE.Group(); const w = 0.8, h = 0.35, d = 0.5;
    const bot = box(w, 0.02, d, '#d9973a', { out: 0.01 }); bot.position.y = 0.01; g.add(bot);
    for (const [x, z, ww, dd] of [[0, d / 2, w, 0.02], [0, -d / 2, w, 0.02], [w / 2, 0, 0.02, d], [-w / 2, 0, 0.02, d]]) { const sd = box(ww, h, dd, '#e8a540', { out: 0.01 }); sd.position.set(x, h / 2, z); g.add(sd); }
    for (const [x, sgn] of [[0, 1], [0, -1]]) { const f = box(w, 0.015, 0.22, '#e8a540', { out: 0.008 }); f.position.set(0, h + 0.07, sgn * (d / 2 + 0.07)); f.rotation.x = sgn * 1.1; g.add(f); }
    for (let i = 0; i < 6; i++) { const u = P.umbrellaClosed(c); u.scale.setScalar(0.66); u.rotation.z = Math.PI / 2; u.position.set(0.4, 0.1 + (i % 2) * 0.08, -0.19 + i * 0.075); g.add(u); }
    return g; },
  phone(c = '#222a38') { const g = new THREE.Group(); const b = box(0.09, 0.012, 0.17, c, { out: 0.006 }); g.add(b); const sc = box(0.075, 0.013, 0.15, '#6fc3e8', { out: 0 }); sc.position.y = 0.001; g.add(sc); return g; },
  powerbank(c = '#2b2f3a') { const g = new THREE.Group(); const b = box(0.11, 0.035, 0.19, c, { out: 0.007 }); b.position.y = 0.018; g.add(b); for (let i = 0; i < 4; i++) { const l = box(0.012, 0.01, 0.012, i < 3 ? '#5fd35a' : '#555', { out: 0 }); l.position.set(-0.03 + i * 0.02, 0.037, 0.07); g.add(l); } return g; },
  pbPile(n = 20, seed = 4) { const g = new THREE.Group(); const r = rnd(seed); const cs = ['#2b2f3a', '#c0392b', '#2e6f9e', '#e8e3d0', '#3f8f4f']; for (let i = 0; i < n; i++) { const p = P.powerbank(cs[i % cs.length]); p.position.set((i % 5 - 2) * 0.13 + (r() - 0.5) * 0.03, Math.floor(i / 5) * 0.04, (r() - 0.5) * 0.05); p.rotation.y = (r() - 0.5) * 0.3; g.add(p); } return g; },
  cable(len = 0.8, c = '#f1ede2') { const g = new THREE.Group(); const k = cyl(0.008, 0.008, len, c, { out: 's' }); k.rotation.z = Math.PI / 2; g.add(k); return g; },
  termos(c = '#c0392b') { const g = new THREE.Group(); const b = cyl(0.13, 0.13, 0.42, c); b.position.y = 0.21; g.add(b); const t = cyl(0.09, 0.11, 0.08, '#e8e3d0'); t.position.y = 0.46; g.add(t); const sp = cyl(0.02, 0.02, 0.1, '#e8e3d0', { out: 's' }); sp.rotation.z = Math.PI / 2; sp.position.set(0.15, 0.3, 0); g.add(sp); return g; },
  socket() { const g = new THREE.Group(); const b = box(0.16, 0.22, 0.04, '#efe6d2', { out: 0.008 }); g.add(b); for (const sx of [-1, 1]) { const h = cyl(0.012, 0.012, 0.05, '#222', { out: false }); h.rotation.x = Math.PI / 2; h.position.set(sx * 0.03, 0.02, 0.01); g.add(h); } return g; },
  lakban() { const b = box(0.3, 0.12, 0.01, '#c9a35a', { out: 0.006 }); b.rotation.z = 0.5; return b; },
  gorengan() { const g = new THREE.Group(); const pl = cyl(0.16, 0.12, 0.03, '#e8e3d0'); g.add(pl); for (let i = 0; i < 3; i++) { const f = sph(0.06, '#d9922a', { out: 's' }); f.scale.set(1.4, 0.6, 1); f.position.set(-0.06 + i * 0.06, 0.04, (i % 2) * 0.03); g.add(f); } return g; },
  envelope() { const g = new THREE.Group(); const b = box(0.28, 0.01, 0.16, '#f1e4c6', { out: 0.006 }); g.add(b); const f = box(0.2, 0.011, 0.06, '#d8c9a4', { out: 0.004 }); f.position.z = -0.04; g.add(f); return g; },
  bill() { const t = canvasTex(256, 360, (x, w, h) => { x.fillStyle = '#f5efe0'; x.fillRect(0, 0, w, h); x.fillStyle = '#2e6f9e'; x.fillRect(0, 0, w, 50); x.fillStyle = '#fff'; x.font = '800 30px Poppins'; x.fillText('LISTRIK', 60, 36); x.fillStyle = '#9a9080'; for (let i = 0; i < 6; i++) x.fillRect(20, 80 + i * 30, 150 + (i % 3) * 25, 8); x.fillStyle = '#c0392b'; x.font = '800 40px Poppins'; x.fillText('Rp500.000', 22, 320); });
    return box(0.26, 0.005, 0.36, '#fff', { mat: toon('#ffffff', { map: t }), out: 0.006 }); },
  coffee() { const g = new THREE.Group(); const b = cyl(0.06, 0.05, 0.12, '#f1ede2'); b.position.y = 0.06; g.add(b); const c = cyl(0.055, 0.055, 0.01, '#4a2a14', { out: false }); c.position.y = 0.115; g.add(c); return g; },
  crown(c = '#f2c230', s = 1) { const g = new THREE.Group(); const b = mk(new THREE.CylinderGeometry(0.2 * s, 0.22 * s, 0.12 * s, 24, 1, true), c, { out: 's' }); b.userData.mesh.material = toon(c, { side: THREE.DoubleSide }); g.add(b);
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; const sp = mk(new THREE.ConeGeometry(0.045 * s, 0.13 * s, 8), c, { out: 's' }); sp.position.set(Math.sin(a) * 0.2 * s, 0.11 * s, Math.cos(a) * 0.2 * s); g.add(sp); const j = sph(0.022 * s, i % 2 ? '#d0302a' : '#2e6fd0', { out: false }); j.position.set(Math.sin(a) * 0.212 * s, 0.0, Math.cos(a) * 0.212 * s); g.add(j); }
    return g; },
  chefHat() { const g = new THREE.Group(); const b = cyl(0.2, 0.2, 0.18, '#f4f0e6'); g.add(b); [[-0.1, 0], [0.1, 0], [0, 0.08], [0, -0.08]].forEach(([x, z]) => { const p = sph(0.15, '#f4f0e6', { out: 'm' }); p.position.set(x, 0.18, z); g.add(p); }); return g; },
  vial(c = '#5fd35a') { const g = new THREE.Group(); const b = sph(0.045, c, { out: 's' }); b.position.y = 0.045; g.add(b); const n = cyl(0.015, 0.018, 0.06, c, { out: 's' }); n.position.y = 0.11; g.add(n); const k = cyl(0.02, 0.02, 0.025, '#8a5a2a', { out: 's' }); k.position.y = 0.15; g.add(k); return g; },
  soup() { const g = new THREE.Group(); const b = mk(new THREE.SphereGeometry(0.16, 32, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), '#e8e3d0', { out: 'm' }); b.userData.mesh.material = toon('#e8e3d0', { side: THREE.DoubleSide }); b.position.y = 0.15; g.add(b); const s2 = cyl(0.15, 0.15, 0.01, '#d9822a', { out: false }); s2.position.y = 0.13; g.add(s2); return g; },
  teacup() { const g = new THREE.Group(); const b = cyl(0.06, 0.045, 0.08, '#f1ede2'); b.position.y = 0.04; g.add(b); const t = cyl(0.055, 0.055, 0.005, '#8a4a1a', { out: false }); t.position.y = 0.078; g.add(t); const pl = cyl(0.1, 0.1, 0.01, '#f1ede2', { out: 's' }); g.add(pl); return g; },
  cake() { const g = new THREE.Group(); const b = cyl(0.16, 0.16, 0.12, '#e8b0c0'); b.position.y = 0.06; g.add(b); const t = cyl(0.165, 0.165, 0.03, '#f4f0e6'); t.position.y = 0.13; g.add(t); const c = sph(0.03, '#d0302a', { out: 's' }); c.position.y = 0.17; g.add(c); return g; },
  pot() { const g = new THREE.Group(); const b = mk(new THREE.CylinderGeometry(0.3, 0.26, 0.4, 32, 1, true), '#3a3a44', { out: 'm' }); b.userData.mesh.material = toon('#3a3a44', { side: THREE.DoubleSide }); b.position.y = 0.2; g.add(b); const s2 = cyl(0.28, 0.28, 0.01, '#d9822a', { out: false }); s2.position.y = 0.34; g.add(s2); return g; },
  chest() { const g = new THREE.Group(); const b = box(0.7, 0.4, 0.45, '#7a3a1a'); b.position.y = 0.2; g.add(b); const band = box(0.72, 0.06, 0.47, '#f2c230', { out: 0.006 }); band.position.y = 0.3; g.add(band);
    const gold = P.coinsGold(30); gold.position.y = 0.4; g.add(gold); return g; },
  coinsGold(n = 30) { const g = new THREE.Group(); const r = rnd(9); for (let i = 0; i < n; i++) { const c = cyl(0.045, 0.045, 0.01, '#f2c230', { out: 's' }); c.position.set((r() - 0.5) * 0.55, r() * 0.08, (r() - 0.5) * 0.32); c.rotation.set((r() - 0.5) * 0.7, 0, (r() - 0.5) * 0.7); g.add(c); } return g; },
  jahe() { const g = new THREE.Group(); for (let i = 0; i < 3; i++) { const b = sph(0.05, '#c9a060', { out: 's' }); b.scale.set(1.5, 0.8, 0.9); b.position.set(i * 0.07, 0.03 + (i % 2) * 0.02, (i % 2) * 0.03); b.rotation.z = i * 0.6; g.add(b); } return g; },
  hood(c = '#3a2a4a') { const h = mk(new THREE.SphereGeometry(0.44, 40, 24, 0, Math.PI * 2, 0, 2.2), c, { out: 'l' }); h.userData.mesh.material = toon(c, { side: THREE.DoubleSide }); h.rotation.x = 0.55; return h; },
  kresek() { const g = new THREE.Group(); const b = mk(new THREE.SphereGeometry(0.42, 32, 20, 0, Math.PI * 2, 0, 1.7), '#f1ede2', { out: 'm' }); b.userData.mesh.material = toon('#f1ede2', { side: THREE.DoubleSide }); b.scale.set(1, 0.95, 1); g.add(b);
    for (const sx of [-1, 1]) { const e = mk(new THREE.TorusGeometry(0.07, 0.018, 8, 20), '#f1ede2', { out: 's' }); e.position.set(sx * 0.2, 0.42, 0); e.rotation.z = -sx * 0.4; g.add(e); } return g; },
  helmet(c = '#2a4fa0') { const g = new THREE.Group(); const h = mk(new THREE.SphereGeometry(0.4, 32, 20, 0, Math.PI * 2, 0, 1.5), c, { out: 'm' }); g.add(h); const v = mk(new THREE.SphereGeometry(0.405, 32, 10, Math.PI / 2 - 0.8, 1.6, 0.9, 0.5), '#d9e6ee', { out: false }); g.add(v); return g; },
  tree(s = 1) { const g = new THREE.Group(); const t = cyl(0.1 * s, 0.14 * s, 1.4 * s, '#6b3a1a'); t.position.y = 0.7 * s; g.add(t);
    [[0, 1.9, 0, 0.75], [0.45, 1.6, 0.1, 0.55], [-0.45, 1.65, 0, 0.55], [0.1, 2.3, 0, 0.5]].forEach(([x, y, z, r]) => { const b = mk(new THREE.IcosahedronGeometry(r * s, 1), '#3e7d2c', { out: 'm' }); b.position.set(x * s, y * s, z * s); g.add(b); }); return g; },
};

// ---------------------------------------------------------------- sets
const sets = {};
let sun, hemi, fill, lampLight;
function lights() {
  hemi = new THREE.HemisphereLight(0xfff2e2, 0x5a3a28, 0.9); scene.add(hemi);
  fill = new THREE.AmbientLight(0x8a6a58, 0.6); scene.add(fill);
  sun = new THREE.DirectionalLight(0xffeedb, 3.2);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.02;
  const c = sun.shadow.camera; c.left = -9; c.right = 9; c.top = 9; c.bottom = -9; c.near = 0.5; c.far = 40;
  scene.add(sun); scene.add(sun.target);
  lampLight = new THREE.PointLight(0xffc070, 0, 6, 1.6); scene.add(lampLight);
}
function windowFrame(w = 2.4, h = 1.8, cols = 3, rows = 2) { // bingkai jendela → bayangan kisi di dinding
  const g = new THREE.Group(); const t = 0.09;
  for (let i = 0; i <= cols; i++) { const b = box(t, h, t, '#5a2a12', { out: 0 }); b.position.x = -w / 2 + i * w / cols; g.add(b); }
  for (let j = 0; j <= rows; j++) { const b = box(w, t, t, '#5a2a12', { out: 0 }); b.position.y = -h / 2 + j * h / rows; g.add(b); }
  return g;
}
function buildWarung() { // interior warung kayu (referensi 1 & 2)
  const g = new THREE.Group(); g.name = 'warung';
  const floorT = woodTex('#9a5426', { planks: 8, seed: 31, nails: true }); floorT.wrapS = floorT.wrapT = THREE.RepeatWrapping; floorT.repeat.set(3, 3);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), toon('#ffffff', { map: floorT })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; g.add(floor);
  const wallT = woodTex('#7e4a24', { planks: 10, seed: 41, nails: false }); wallT.wrapS = wallT.wrapT = THREE.RepeatWrapping; wallT.repeat.set(2, 1.4);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(14, 6), toon('#ffffff', { map: wallT })); back.position.set(0, 3, -3); back.receiveShadow = true; g.add(back);
  const left = new THREE.Mesh(new THREE.PlaneGeometry(14, 6), toon('#ffffff', { map: wallT })); left.position.set(-5, 3, 2); left.rotation.y = Math.PI / 2; left.receiveShadow = true; g.add(left);
  const right = left.clone(); right.position.set(5, 3, 2); right.rotation.y = -Math.PI / 2; g.add(right);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), toon('#3a1a0c')); ceil.position.y = 4.2; ceil.rotation.x = Math.PI / 2; g.add(ceil);
  // tiang & balok
  for (const x of [-2.6, 0.2, 2.9]) { const p = box(0.18, 4.2, 0.18, '#4e2410'); p.position.set(x, 2.1, -2.85); g.add(p); }
  const beam = box(10, 0.16, 0.16, '#4e2410'); beam.position.set(0, 2.45, -2.85); g.add(beam);
  // rak barang di dinding belakang
  const sh = P.shelf(4.6, 4, 6); sh.position.set(-0.3, 0.9, -2.75); g.add(sh);
  const lamp = P.lamp(); lamp.position.set(0.3, 3.3, -1.2); g.add(lamp);
  const cal = P.calendar(); cal.position.set(2.2, 2.0, -2.94); g.add(cal);
  // jendela di kanan → cahaya sore masuk
  const wf = windowFrame(2.2, 1.6, 3, 2); wf.position.set(4.95, 2.4, 0.3); wf.rotation.y = -Math.PI / 2; g.add(wf);
  // etalase / meja kasir
  const counter = P.counter(2.4, 1.05, 0.95); counter.position.set(0, 0, 0); g.add(counter);
  g.userData = { interior: true, lampPos: [0.3, 3.0, -1.0], sun: [9, 6.5, 2.2], sunTarget: [-1, 0.6, -1], sunI: 3.0, hemi: 1.15, amb: 0.8, lamp: 0.0, bg: '#2a1206', counterTop: counter.userData.top };
  return g;
}
function buildStreet() { // gang pasar dengan deret warung & BANK di ujung (referensi 1)
  const g = new THREE.Group(); g.name = 'street';
  const groundT = canvasTex(512, 512, (x, w, h) => { x.fillStyle = '#b08a4a'; x.fillRect(0, 0, w, h); const r = rnd(8); for (let i = 0; i < 2500; i++) { x.fillStyle = `rgba(${90 + r() * 60},${60 + r() * 40},${20 + r() * 20},0.5)`; x.fillRect(r() * w, r() * h, 3, 3); } }, { repeat: [2, 8] });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(6, 40), toon('#ffffff', { map: groundT })); ground.rotation.x = -Math.PI / 2; ground.position.z = -14; ground.receiveShadow = true; g.add(ground);
  const sideT = brickTex('#cbb68a');
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 7; i++) {
      const z = -i * 4.2; const st = new THREE.Group();
      const wallB = box(0.3, 3.4, 4.0, '#d9c7a0', { mat: toon('#ffffff', { map: sideT }) }); wallB.position.set(sx * 3.4, 1.7, z); st.add(wallB);
      const sh = P.shelf(2.6, 3, 10 + i + (sx > 0 ? 20 : 0)); sh.rotation.y = -sx * Math.PI / 2; sh.position.set(sx * 3.15, 0.2, z); st.add(sh);
      const cnt = box(0.7, 0.9, 3.4, '#7a3a1a', { mat: toon('#ffffff', { map: woodTex('#7a3a1a', { planks: 4, seed: i }) }) }); cnt.position.set(sx * 2.55, 0.45, z); st.add(cnt);
      // atap/terpal garis
      const at = canvasTex(256, 128, (x, w, h) => { const cs = [['#f0f0e8', '#e47b2a'], ['#f0f0e8', '#2f7fbf'], ['#f0f0e8', '#3a9a4a'], ['#f0f0e8', '#d24a3a']][(i + (sx > 0 ? 1 : 0)) % 4]; for (let k = 0; k < 8; k++) { x.fillStyle = cs[k % 2]; x.fillRect(k * w / 8, 0, w / 8, h); } });
      const aw = box(1.3, 0.05, 3.8, '#fff', { mat: toon('#ffffff', { map: at }), out: 0.012 }); aw.position.set(sx * 2.45, 2.55, z); aw.rotation.z = sx * 0.38; st.add(aw);
      const sg = P.sign(['WARUNG'], { bg: '#f1e4c6', fg: '#b3261e', w: 512, h: 128, font: '800 70px Poppins' }); sg.scale.set(0.9, 0.36, 1); sg.rotation.y = -sx * Math.PI / 2; sg.position.set(sx * 3.2, 2.95, z); st.add(sg);
      g.add(st);
    }
  }
  // gedung bank di ujung
  const bank = box(7, 4.2, 0.6, '#ddd0ae', { mat: toon('#ffffff', { map: brickTex('#e2d6b6') }) }); bank.position.set(0, 2.1, -29); g.add(bank);
  const bs = P.sign(['BANK'], { bg: '#2c6fb0', fg: '#ffffff', w: 512, h: 128, font: '800 80px Poppins' }); bs.scale.set(1.6, 0.6, 1); bs.position.set(0, 3.4, -28.65); g.add(bs);
  const door = box(1.6, 1.0, 0.1, '#3a2418'); door.position.set(0, 2.0, -28.66); g.add(door);
  const skyM = new THREE.MeshBasicMaterial({ color: '#9ec7dc' }); const sky = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), skyM); sky.position.set(0, 10, -32); sky.name = 'sky'; g.add(sky);
  g.userData = { sun: [6, 9, 4], sunTarget: [0, 0, -8], sunI: 3.2, hemi: 1.0, amb: 0.45, lamp: 0, bg: '#9ec7dc' };
  return g;
}
function buildBank() { // loket bank (dinding bata krem, lubang loket gelap)
  const g = new THREE.Group(); g.name = 'bank';
  const floorT = canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#b8955a'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(70,40,10,0.4)'; x.lineWidth = 3; for (let i = 0; i <= 4; i++) { x.beginPath(); x.moveTo(i * 64, 0); x.lineTo(i * 64, h); x.moveTo(0, i * 64); x.lineTo(w, i * 64); x.stroke(); } }, { repeat: [6, 6] });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), toon('#ffffff', { map: floorT })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; g.add(floor);
  const wt = brickTex('#e6d8b4'); wt.wrapS = wt.wrapT = THREE.RepeatWrapping; wt.repeat.set(3, 2);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(14, 6), toon('#ffffff', { map: wt })); wall.position.set(0, 3, -1); wall.receiveShadow = true; g.add(wall);
  const hole = box(1.7, 1.3, 0.05, '#2a1a10', { out: 0.02 }); hole.position.set(0, 1.85, -0.95); g.add(hole);
  const sill = box(2.0, 0.08, 0.5, '#6e3418'); sill.position.set(0, 1.2, -0.75); g.add(sill);
  const post = box(0.06, 2.4, 0.06, '#8a8a90'); post.position.set(-1.05, 1.2, -0.7); g.add(post);
  const wf = windowFrame(2.4, 1.8, 2, 2); wf.position.set(4.5, 2.5, 3); wf.rotation.y = -Math.PI / 3; g.add(wf);
  g.userData = { interior: true, lampPos: [0, 3.2, 0.5], sun: [7, 6, 6], sunTarget: [0, 1, -1], sunI: 3.0, hemi: 0.9, amb: 0.5, lamp: 0, bg: '#2a1206', sillTop: 1.24 };
  return g;
}

function buildHalte() { // halte bis di pinggir jalan saat hujan sore
  const g = new THREE.Group(); g.name = 'halte';
  const roadT = canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#4a3a34'; x.fillRect(0, 0, w, h); x.fillStyle = '#e8d9a0'; x.fillRect(w / 2 - 6, 0, 12, h / 2); }, { repeat: [1, 6] });
  const road = new THREE.Mesh(new THREE.PlaneGeometry(8, 40), toon('#ffffff', { map: roadT })); road.rotation.x = -Math.PI / 2; road.position.set(0, 0, -10); road.receiveShadow = true; g.add(road);
  const walk = box(4, 0.15, 40, '#b8a07a', { out: 0.01 }); walk.position.set(-6, 0.075, -10); g.add(walk);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(40, 8), toon('#ffffff', { map: brickTex('#c9a878') })); back.position.set(-8, 4, -10); back.rotation.y = Math.PI / 2; g.add(back);
  // halte
  const roofC = '#2f7fbf'; const roof = box(3.2, 0.1, 1.6, roofC); roof.position.set(-5.2, 2.6, 0); roof.rotation.z = 0.08; g.add(roof);
  for (const z of [-0.7, 0.7]) { const p = box(0.08, 2.6, 0.08, '#9a9aa4'); p.position.set(-6.5, 1.3, z); g.add(p); const p2 = box(0.08, 2.4, 0.08, '#9a9aa4'); p2.position.set(-3.9, 1.2, z); g.add(p2); }
  const bench = box(2.0, 0.08, 0.4, '#c9741f'); bench.position.set(-6.0, 0.6, 0); g.add(bench);
  const hs = P.sign(['HALTE'], { bg: '#2f7fbf', fg: '#ffffff', w: 512, h: 128, font: '800 80px Poppins', border: true }); hs.scale.set(0.9, 0.36, 1); hs.position.set(-5.2, 2.95, 0.6); g.add(hs);
  for (let i = 0; i < 4; i++) { const t = P.tree(0.9); t.position.set(-7.4, 0, -6 - i * 6); g.add(t); }
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), new THREE.MeshBasicMaterial({ color: '#8a7d78' })); sky.position.set(0, 10, -30); sky.name = 'sky'; g.add(sky);
  g.userData = { sun: [6, 9, 5], sunTarget: [-5, 0, 0], sunI: 1.4, hemi: 1.0, amb: 0.7, lamp: 0, bg: '#8a7d78' };
  return g;
}

function buildIstana() { // ruang makan/tahta istana: dinding batu krem, karpet merah, tiang, jendela tinggi
  const g = new THREE.Group(); g.name = 'istana';
  const ft = canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#b89a6a'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(60,40,15,0.5)'; x.lineWidth = 4; for (let i = 0; i <= 2; i++) { x.beginPath(); x.moveTo(i * 128, 0); x.lineTo(i * 128, h); x.moveTo(0, i * 128); x.lineTo(w, i * 128); x.stroke(); } }, { repeat: [7, 7] });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), toon('#ffffff', { map: ft })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; g.add(floor);
  const carpet = box(1.6, 0.02, 12, '#a8222a', { out: 0.01 }); carpet.position.set(0, 0.01, 1); g.add(carpet);
  const wt = brickTex('#d8c49a'); wt.wrapS = wt.wrapT = THREE.RepeatWrapping; wt.repeat.set(3, 1.6);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(16, 8), toon('#ffffff', { map: wt })); back.position.set(0, 4, -4); back.receiveShadow = true; g.add(back);
  for (const sx of [-1, 1]) { const side = new THREE.Mesh(new THREE.PlaneGeometry(16, 8), toon('#ffffff', { map: wt })); side.position.set(sx * 6, 4, 2); side.rotation.y = -sx * Math.PI / 2; side.receiveShadow = true; g.add(side); }
  for (const x of [-3.4, -1.7, 1.7, 3.4]) { const p = cyl(0.22, 0.25, 5, '#e8dcc0', { out: 'm' }); p.position.set(x, 2.5, -3.5); g.add(p); }
  const banner = box(1.0, 2.2, 0.03, '#a8222a', { out: 0.012 }); banner.position.set(-2.55, 3.3, -3.95); g.add(banner); const banner2 = banner.clone(); banner2.position.x = 2.55; g.add(banner2);
  // tahta
  const th = new THREE.Group(); const seat = box(1.0, 0.5, 0.8, '#d4a020'); seat.position.y = 0.25; th.add(seat); const backr = box(1.0, 1.6, 0.15, '#d4a020'); backr.position.set(0, 1.0, -0.35); th.add(backr); const cush = box(0.8, 1.2, 0.05, '#a8222a', { out: 0.008 }); cush.position.set(0, 1.0, -0.26); th.add(cush);
  th.position.set(0, 0, -3.1); g.add(th);
  // meja makan panjang
  const tbl = P.table(3.2, 0.85, 1.0, '#8a4a1e'); tbl.position.set(0, 0, 0); g.add(tbl);
  const cloth = box(3.25, 0.02, 0.6, '#f1e4c6', { out: 0.006 }); cloth.position.set(0, 0.885, 0); g.add(cloth);
  for (const x of [-1.2, 1.2]) { const c = P.bottle('#f2c230'); c.position.set(x, 0.9, -0.2); g.add(c); }
  const wf = windowFrame(1.8, 2.4, 2, 3); wf.position.set(5.95, 3.0, 0.5); wf.rotation.y = -Math.PI / 2; g.add(wf);
  g.userData = { interior: true, lampPos: [0, 3.6, 0.5], sun: [10, 7, 2.5], sunTarget: [-1, 0.6, -0.5], sunI: 3.0, hemi: 1.1, amb: 0.75, lamp: 0, bg: '#2a1206', tableTop: 0.895 };
  return g;
}
function buildTaman() { // taman istana: rumput, pagar tanaman, pohon, tembok istana
  const g = new THREE.Group(); g.name = 'taman';
  const gt = grassTex(); gt.wrapS = gt.wrapT = THREE.RepeatWrapping; gt.repeat.set(8, 8);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), toon('#ffffff', { map: gt })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; g.add(ground);
  const wall = box(30, 4, 0.6, '#d8c49a', { mat: toon('#ffffff', { map: brickTex('#d8c49a') }) }); wall.position.set(0, 2, -6); g.add(wall);
  for (let i = -3; i <= 3; i++) { const t = P.tree(1.1); t.position.set(i * 2.6, 0, -4.6 + (i % 2) * 0.4); g.add(t); }
  for (const sx of [-1, 1]) { const hedge = box(0.6, 0.7, 8, '#3e7d2c'); hedge.position.set(sx * 2.4, 0.35, 0); g.add(hedge); }
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), new THREE.MeshBasicMaterial({ color: '#f0c890' })); sky.position.set(0, 10, -12); sky.name = 'sky'; g.add(sky);
  g.userData = { sun: [6, 8, 6], sunTarget: [0, 0, 0], sunI: 3.0, hemi: 1.0, amb: 0.5, lamp: 0, bg: '#f0c890' };
  return g;
}

function paintTex(base = '#d9b98a', trim = '#8a5a30') { // dinding cat + lis kayu bawah
  return canvasTex(512, 512, (x, w, h) => { x.fillStyle = base; x.fillRect(0, 0, w, h); const r = rnd(12);
    for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(0,0,0,${r() * 0.04})`; x.fillRect(r() * w, r() * h, 3, 3); }
    x.fillStyle = trim; x.fillRect(0, h * 0.78, w, h * 0.22); x.fillStyle = INK_CSS; x.fillRect(0, h * 0.78 - 3, w, 6);
    x.strokeStyle = 'rgba(30,10,0,0.5)'; x.lineWidth = 3; for (let i = 0; i < 8; i++) { x.beginPath(); x.moveTo(i * w / 8, h * 0.78); x.lineTo(i * w / 8, h); x.stroke(); } });
}
function house(wallC = '#e6d3a8', roofC = '#b5462a', w = 3, d = 3, h = 2.2) { // rumah kampung: dinding + atap limas + pintu + jendela
  const g = new THREE.Group(); const b = box(w, h, d, wallC); b.position.y = h / 2; g.add(b);
  const roof = mk(new THREE.ConeGeometry(Math.max(w, d) * 0.82, 1.3, 4), roofC, { out: 'm' }); roof.rotation.y = Math.PI / 4; roof.position.y = h + 0.65; roof.scale.set(w / Math.max(w, d), 1, d / Math.max(w, d)); g.add(roof);
  const door = box(0.7, 1.4, 0.05, '#6b3a1a'); door.position.set(-w * 0.2, 0.7, d / 2 + 0.02); g.add(door);
  const win = box(0.7, 0.6, 0.05, '#3a2a40'); win.position.set(w * 0.22, 1.35, d / 2 + 0.02); g.add(win);
  const frame = box(0.8, 0.07, 0.07, '#f1ede2', { out: 0.006 }); frame.position.set(w * 0.22, 1.35, d / 2 + 0.05); g.add(frame);
  return g;
}
function palm(s = 1) { const g = new THREE.Group(); const t = cyl(0.07 * s, 0.1 * s, 3.2 * s, '#8a6a3a'); t.position.y = 1.6 * s; t.rotation.z = 0.12; g.add(t);
  for (let i = 0; i < 6; i++) { const lf = mk(new THREE.ConeGeometry(0.16 * s, 1.5 * s, 6), '#3e8a2c', { out: 's' }); lf.position.set(0.2 * s, 3.2 * s, 0); lf.rotation.set(0, i * Math.PI / 3, 1.9); const piv = new THREE.Group(); piv.add(lf); piv.rotation.y = i * Math.PI / 3; piv.position.x = 0.15 * s; g.add(piv); }
  return g; }
function buildRumah() { // ruang tamu rumah: dinding cat, sofa, TV, jendela bergorden, karpet, foto, jam
  const g = new THREE.Group(); g.name = 'rumah';
  const ft = woodTex('#b07a48', { planks: 8, seed: 61, nails: false }); ft.wrapS = ft.wrapT = THREE.RepeatWrapping; ft.repeat.set(3, 3);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), toon('#ffffff', { map: ft })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; g.add(floor);
  const wt = paintTex('#d9b98a', '#8a5a30'); wt.wrapS = wt.wrapT = THREE.RepeatWrapping; wt.repeat.set(2.5, 1);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(14, 4.2), toon('#ffffff', { map: wt })); back.position.set(0, 2.1, -3); back.receiveShadow = true; g.add(back);
  for (const sx of [-1, 1]) { const sw = new THREE.Mesh(new THREE.PlaneGeometry(14, 4.2), toon('#ffffff', { map: wt })); sw.position.set(sx * 4.5, 2.1, 2); sw.rotation.y = -sx * Math.PI / 2; sw.receiveShadow = true; g.add(sw); }
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), toon('#4a3020')); ceil.position.y = 4.2; ceil.rotation.x = Math.PI / 2; g.add(ceil);
  const rug = box(3.2, 0.015, 2.2, '#8a2a3a', { out: 0.01 }); rug.position.set(0, 0.008, 0.6); g.add(rug);
  const rug2 = box(2.6, 0.017, 1.6, '#c9a04a', { out: 0 }); rug2.position.set(0, 0.01, 0.6); g.add(rug2);
  // sofa
  const sofa = new THREE.Group(); const sb = box(2.4, 0.45, 0.9, '#3a6a8a'); sb.position.y = 0.3; sofa.add(sb); const sbk = box(2.4, 0.7, 0.25, '#3a6a8a'); sbk.position.set(0, 0.75, -0.35); sofa.add(sbk);
  for (const sx of [-1, 1]) { const arm = box(0.25, 0.6, 0.9, '#2f5a76'); arm.position.set(sx * 1.2, 0.45, 0); sofa.add(arm); }
  sofa.position.set(0, 0, -2.3); g.add(sofa);
  const ct = P.table(1.2, 0.45, 0.6, '#7a4a24'); ct.position.set(0, 0, -0.9); g.add(ct);
  // TV + lemari
  const cab = box(1.6, 0.6, 0.5, '#6e3e1c'); cab.position.set(-3.6, 0.3, 0.8); cab.rotation.y = Math.PI / 2; g.add(cab);
  const tv = box(1.2, 0.75, 0.08, '#1a1a22'); tv.position.set(-3.6, 1.0, 0.8); tv.rotation.y = Math.PI / 2; g.add(tv);
  // jendela bergorden
  const wf = windowFrame(1.6, 1.4, 2, 2); wf.position.set(4.45, 2.0, 0.2); wf.rotation.y = -Math.PI / 2; g.add(wf);
  for (const sz of [-1, 1]) { const cu = box(0.06, 1.9, 0.5, '#c0392b'); cu.position.set(4.4, 2.0, 0.2 + sz * 1.05); g.add(cu); }
  const clock = cyl(0.25, 0.25, 0.04, '#f1ede2'); clock.rotation.x = Math.PI / 2; clock.position.set(1.8, 2.8, -2.97); g.add(clock);
  const hand = box(0.02, 0.18, 0.01, '#222', { out: 0 }); hand.position.set(1.8, 2.87, -2.94); g.add(hand);
  for (const [x, c] of [[-1.4, '#e2b04a'], [-0.6, '#7ab0d0']]) { const fr = box(0.55, 0.42, 0.03, '#5a3218', { out: 0.01 }); fr.position.set(x, 2.5, -2.97); g.add(fr); const ph = box(0.45, 0.32, 0.035, c, { out: 0 }); ph.position.set(x, 2.5, -2.96); g.add(ph); }
  const pot = cyl(0.2, 0.15, 0.4, '#b5462a'); pot.position.set(3.6, 0.2, -2.4); g.add(pot); const pl = mk(new THREE.IcosahedronGeometry(0.45, 1), '#3e8a2c', { out: 'm' }); pl.position.set(3.6, 0.8, -2.4); g.add(pl);
  const lamp = P.lamp(); lamp.position.set(0, 3.5, -0.5); g.add(lamp);
  g.userData = { interior: true, lampPos: [0, 3.2, -0.3], sun: [9, 4.5, 0.5], sunTarget: [-1, 0.5, -0.5], sunI: 3.0, hemi: 1.1, amb: 0.8, lamp: 0, bg: '#2a1206' };
  return g;
}
function buildKampung() { // jalan desa: tanah, rumah-rumah atap genteng, pagar bambu, kelapa, sawah, gunung
  const g = new THREE.Group(); g.name = 'kampung';
  const gt = grassTex(); gt.wrapS = gt.wrapT = THREE.RepeatWrapping; gt.repeat.set(10, 10);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), toon('#ffffff', { map: gt })); ground.rotation.x = -Math.PI / 2; ground.position.z = -15; ground.receiveShadow = true; g.add(ground);
  const rt2 = canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#b08a52'; x.fillRect(0, 0, w, h); const r = rnd(4); for (let i = 0; i < 1500; i++) { x.fillStyle = `rgba(${80 + r() * 50},${55 + r() * 30},${25 + r() * 20},0.5)`; x.fillRect(r() * w, r() * h, 3, 3); } }, { repeat: [1, 10] });
  const road = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 60), toon('#ffffff', { map: rt2 })); road.rotation.x = -Math.PI / 2; road.position.set(0, 0.01, -15); road.receiveShadow = true; g.add(road);
  const cols = [['#e6d3a8', '#b5462a'], ['#cfe0c0', '#8a3a24'], ['#f0d6c0', '#a8502a'], ['#d8d0f0', '#7a3a2a']];
  for (let i = 0; i < 5; i++) { const [wc, rc] = cols[i % 4]; const h1 = house(wc, rc); h1.position.set(-4.6, 0, -2 - i * 6); h1.rotation.y = Math.PI / 2; g.add(h1); }
  // sawah di kanan
  const st = canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#6aa83a'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(40,90,20,0.8)'; x.lineWidth = 3; for (let i = 0; i < 16; i++) { x.beginPath(); x.moveTo(0, i * 16); x.lineTo(w, i * 16); x.stroke(); } }, { repeat: [4, 8] });
  const sawah = new THREE.Mesh(new THREE.PlaneGeometry(18, 40), toon('#ffffff', { map: st })); sawah.rotation.x = -Math.PI / 2; sawah.position.set(11.5, 0.02, -14); sawah.receiveShadow = true; g.add(sawah);
  for (let z = 2; z > -34; z -= 1.2) { const pole = cyl(0.03, 0.03, 0.9, '#d9b04a', { out: 's' }); pole.position.set(2.3, 0.45, z); g.add(pole); }
  for (const y of [0.35, 0.75]) { const rail = cyl(0.022, 0.022, 36, '#d9b04a', { out: 's' }); rail.rotation.x = Math.PI / 2; rail.position.set(2.3, y, -16); g.add(rail); }
  for (let i = 0; i < 6; i++) { const pm = palm(1 + (i % 2) * 0.2); pm.position.set(i % 2 ? 4.5 : -2.6, 0, -4 - i * 5.5); g.add(pm); }
  for (const [x, z, s2] of [[-14, -42, 9], [2, -46, 12], [18, -44, 10]]) { const m = mk(new THREE.ConeGeometry(s2, s2 * 0.8, 6), '#5a8a8a', { out: 'l', shadow: false }); m.position.set(x, s2 * 0.4, z); g.add(m); }
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(140, 60), new THREE.MeshBasicMaterial({ color: '#f0c08a', fog: false })); sky.position.set(0, 18, -50); sky.name = 'sky'; g.add(sky);
  g.userData = { sun: [7, 8, 5], sunTarget: [0, 0, -4], sunI: 3.1, hemi: 1.0, amb: 0.5, lamp: 0, bg: '#f0c08a', lampPos: [-2.2, 3.0, -1] };
  return g;
}
function buildPasar() { // pasar/lorong kios beratap terpal dengan lampu gantung (cantik untuk malam)
  const g = new THREE.Group(); g.name = 'pasar';
  const ft = canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#8a7a6a'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(40,30,20,0.4)'; x.lineWidth = 3; for (let i = 0; i <= 4; i++) { x.beginPath(); x.moveTo(i * 64, 0); x.lineTo(i * 64, h); x.moveTo(0, i * 64); x.lineTo(w, i * 64); x.stroke(); } }, { repeat: [4, 20] });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 50), toon('#ffffff', { map: ft })); floor.rotation.x = -Math.PI / 2; floor.position.z = -15; floor.receiveShadow = true; g.add(floor);
  const fruitC = ['#e04a3a', '#f0b030', '#3fa04a', '#e86fa0', '#f07a2a'];
  for (const sx of [-1, 1]) for (let i = 0; i < 6; i++) {
    const z = -i * 3.4; const st = new THREE.Group();
    const tbl = box(1.2, 0.8, 2.8, '#8a4a1e'); tbl.position.set(sx * 2.0, 0.4, z); st.add(tbl);
    const r = rnd(i * 7 + (sx > 0 ? 3 : 1));
    for (let k = 0; k < 14; k++) { const f = sph(0.09, fruitC[Math.floor(r() * 5)], { out: 's' }); f.position.set(sx * 2.0 + (r() - 0.5) * 0.9, 0.88, z + (r() - 0.5) * 2.4); st.add(f); }
    const tc = [['#d63a2f', '#f1e4c6'], ['#2f7fbf', '#f1e4c6'], ['#3a9a4a', '#f1e4c6']][(i + (sx > 0 ? 1 : 0)) % 3];
    const tt = canvasTex(256, 128, (x, w, h) => { for (let k = 0; k < 8; k++) { x.fillStyle = tc[k % 2]; x.fillRect(k * w / 8, 0, w / 8, h); } });
    const tarp = box(1.8, 0.05, 3.2, '#fff', { mat: toon('#ffffff', { map: tt }), out: 0.012 }); tarp.position.set(sx * 2.1, 2.5, z); tarp.rotation.z = sx * 0.3; st.add(tarp);
    for (const pz of [-1.4, 1.4]) { const pole = cyl(0.035, 0.035, 2.5, '#5a3a20', { out: 's' }); pole.position.set(sx * 1.35, 1.25, z + pz); st.add(pole); }
    g.add(st);
  }
  // untaian lampu di atas lorong
  for (let i = 0; i < 26; i++) { const z = 1.5 - i * 0.75; const y = 3.0 - Math.abs(Math.sin(i * 0.9)) * 0.25;
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), new THREE.MeshBasicMaterial({ color: ['#ffd27a', '#ff9a6a', '#fff0b0'][i % 3] })); b.position.set(Math.sin(i * 1.7) * 0.4, y, z); g.add(b); }
  const wire = cyl(0.008, 0.008, 20, '#222', { out: false }); wire.rotation.x = Math.PI / 2; wire.position.set(0, 3.05, -8); g.add(wire);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(14, 8), toon('#ffffff', { map: brickTex('#b89a7a') })); back.position.set(0, 4, -22); g.add(back);
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), new THREE.MeshBasicMaterial({ color: '#f0b07a', fog: false })); sky.position.set(0, 14, -30); sky.name = 'sky'; g.add(sky);
  g.userData = { sun: [6, 9, 4], sunTarget: [0, 0, -5], sunI: 3.0, hemi: 1.0, amb: 0.55, lamp: 0, bg: '#f0b07a', lampPos: [0, 2.8, 0.5] };
  return g;
}

function buildDapur() { // dapur istana: dinding batu, tungku menyala, panci besar, meja kerja, rak toples, wajan gantung
  const g = new THREE.Group(); g.name = 'dapur';
  const ft = canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#8a6a4a'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(40,25,10,0.5)'; x.lineWidth = 4; for (let i = 0; i <= 4; i++) { x.beginPath(); x.moveTo(i * 64, 0); x.lineTo(i * 64, h); x.moveTo(0, i * 64); x.lineTo(w, i * 64); x.stroke(); } }, { repeat: [6, 6] });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), toon('#ffffff', { map: ft })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; g.add(floor);
  const wt = brickTex('#a89070'); wt.wrapS = wt.wrapT = THREE.RepeatWrapping; wt.repeat.set(3, 1.5);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(14, 6), toon('#ffffff', { map: wt })); back.position.set(0, 3, -3); back.receiveShadow = true; g.add(back);
  for (const sx of [-1, 1]) { const sw = new THREE.Mesh(new THREE.PlaneGeometry(14, 6), toon('#ffffff', { map: wt })); sw.position.set(sx * 4.6, 3, 2); sw.rotation.y = -sx * Math.PI / 2; sw.receiveShadow = true; g.add(sw); }
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), toon('#3a2414')); ceil.position.y = 4.2; ceil.rotation.x = Math.PI / 2; g.add(ceil);
  for (const x of [-2.5, 0, 2.5]) { const bm = box(0.2, 0.2, 7, '#4e2a12'); bm.position.set(x, 4.0, 0); g.add(bm); }
  // tungku bata dengan api
  const hearth = new THREE.Group(); const hb = box(1.8, 1.0, 1.0, '#8a4a2a', { mat: toon('#ffffff', { map: brickTex('#a8563a') }) }); hb.position.y = 0.5; hearth.add(hb);
  const hole = box(0.9, 0.5, 0.05, '#1a0a04', { out: 0.01 }); hole.position.set(0, 0.4, 0.51); hearth.add(hole);
  for (let i = 0; i < 5; i++) { const fl = new THREE.Mesh(new THREE.ConeGeometry(0.08 + (i % 2) * 0.04, 0.3 + (i % 3) * 0.08, 8), new THREE.MeshBasicMaterial({ color: i % 2 ? '#ffb030' : '#ff6a1a' })); fl.position.set(-0.3 + i * 0.15, 0.32, 0.45); hearth.add(fl); }
  const chim = box(1.2, 3.0, 0.4, '#7a5a40', { mat: toon('#ffffff', { map: brickTex('#9a7a5a') }) }); chim.position.set(0, 2.7, -0.32); hearth.add(chim);
  const bigpot = P.pot(); bigpot.position.set(0, 1.0, 0.05); hearth.add(bigpot);
  hearth.position.set(-2.2, 0, -2.4); g.add(hearth);
  // meja kerja (setara etalase warung: permukaan y=1.0)
  const wtb = woodTex('#a4632a', { planks: 4, seed: 71 }); const table = box(2.4, 0.08, 1.0, '#a4632a', { mat: toon('#ffffff', { map: wtb }) }); table.position.set(0, 0.96, 0); g.add(table);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const lg = box(0.08, 0.92, 0.08, '#6a3a18', { out: 0.01 }); lg.position.set(sx * 1.1, 0.46, sz * 0.42); g.add(lg); }
  const veg = [['#e04a3a', 0.09], ['#f07a2a', 0.07], ['#3fa04a', 0.1], ['#d9c060', 0.08]]; veg.forEach(([c, r], i) => { const v = sph(r, c, { out: 's' }); v.position.set(0.6 + (i % 2) * 0.2, 1.0 + r, -0.25 + Math.floor(i / 2) * 0.2); g.add(v); });
  const board = box(0.5, 0.03, 0.32, '#d9b07a', { out: 0.006 }); board.position.set(0.7, 1.015, 0.15); g.add(board);
  // rak toples & wajan gantung
  const sh = P.shelf(2.6, 3, 33); sh.position.set(1.6, 0.6, -2.75); g.add(sh);
  for (let i = 0; i < 4; i++) { const pan = cyl(0.17 + i * 0.02, 0.15 + i * 0.02, 0.06, '#3a3a44'); pan.rotation.x = Math.PI / 2 - 0.1; pan.position.set(-0.9 + i * 0.5, 2.6, -2.9); g.add(pan); const hk = cyl(0.01, 0.01, 0.3, '#222', { out: false }); hk.position.set(-0.9 + i * 0.5, 2.9, -2.92); g.add(hk); }
  const wf = windowFrame(1.6, 1.4, 2, 2); wf.position.set(4.55, 2.4, 0.3); wf.rotation.y = -Math.PI / 2; g.add(wf);
  const door = box(1.0, 2.1, 0.08, '#5a3218'); door.position.set(-4.55, 1.05, 1.2); door.rotation.y = Math.PI / 2; g.add(door);
  g.userData = { interior: true, lampAlways: 1.3, lampPos: [-2.0, 1.4, -1.4], sun: [9, 5.5, 1.5], sunTarget: [-1, 0.6, -1], sunI: 3.0, hemi: 1.05, amb: 0.75, lamp: 0, bg: '#2a1206', tableTop: 1.0 };
  return g;
}

// ---------------------------------------------------------------- overlay 2D (caption, callout, debu)
const out = document.createElement('canvas'); out.width = OW; out.height = OH; document.body.appendChild(out);
const ox = out.getContext('2d');
const dust = (() => { const r = rnd(99); return Array.from({ length: 38 }, () => ({ x: r() * OW, y: r() * OH, s: 1.5 + r() * 3, vx: (r() - 0.5) * 12, vy: -4 - r() * 10, ph: r() * 6 })); })();
function drawDust(t, k = 1) {
  for (const d of dust) {
    const x = (d.x + d.vx * t + Math.sin(t * 0.7 + d.ph) * 14 + OW * 10) % OW, y = (d.y + d.vy * t + OH * 10) % OH;
    const a = (0.25 + 0.35 * Math.abs(Math.sin(t * 0.9 + d.ph))) * k;
    ox.fillStyle = `rgba(255,236,200,${a})`; ox.fillRect(x, y, d.s, d.s);
  }
}
const CAP_Y = 1352;
const rainDrops = (() => { const r = rnd(77); return Array.from({ length: 140 }, () => ({ x: r() * OW, y: r() * OH, l: 40 + r() * 60, v: 1800 + r() * 900 })); })();
function drawRain(t, k = 1) {
  ox.save(); ox.strokeStyle = `rgba(220,225,235,${0.35 * k})`; ox.lineWidth = 2.2;
  for (const d of rainDrops) { const y = (d.y + d.v * t) % (OH + 200) - 100, x = (d.x - 0.18 * d.v * t % OW + OW * 4) % OW; ox.beginPath(); ox.moveTo(x, y); ox.lineTo(x - d.l * 0.18, y + d.l); ox.stroke(); }
  ox.restore();
}
function drawCaption(text, color, alpha, scale) {
  if (!text || alpha <= 0) return;
  ox.save(); ox.globalAlpha = alpha; ox.translate(OW / 2, CAP_Y); ox.scale(scale, scale);
  ox.font = '700 78px Poppins'; ox.textAlign = 'center'; ox.textBaseline = 'middle';
  ox.shadowColor = 'rgba(10,4,2,0.85)'; ox.shadowBlur = 18; ox.shadowOffsetY = 4;
  ox.fillStyle = color === 'y' ? '#f4c430' : '#ffffff';
  ox.fillText(text, 0, 0); ox.shadowBlur = 6; ox.fillText(text, 0, 0);
  ox.restore();
}
function project(v3) { const v = v3.clone().project(camera); return { x: (v.x * 0.5 + 0.5) * OW, y: (-v.y * 0.5 + 0.5) * OH, z: v.z }; }
function drawCallout(c, t) { // "50 RB" kuning + panah dua arah di bawahnya
  const p = c.at ? project(new THREE.Vector3(...c.at)) : { x: c.x, y: c.y };
  const k = Math.min(1, t / 0.18); const sc = 0.6 + 0.4 * (1 - Math.pow(1 - k, 3)) + (c.grow ? Math.min(0.25, t * 0.12) : 0);
  ox.save(); ox.translate(p.x, p.y); ox.scale(sc, sc); ox.globalAlpha = k;
  ox.font = `800 ${c.size || 84}px Poppins`; ox.textAlign = 'center'; ox.textBaseline = 'middle';
  ox.lineWidth = 10; ox.strokeStyle = '#2a1404'; ox.lineJoin = 'round'; ox.strokeText(c.text, 0, 0);
  ox.fillStyle = c.color || '#f4c430'; ox.fillText(c.text, 0, 0);
  if (c.arrow !== false) { const aw = (c.size || 84) * 1.35; ox.strokeStyle = c.color || '#f4c430'; ox.lineWidth = 3; ox.beginPath(); ox.moveTo(-aw, 62); ox.lineTo(aw, 62); ox.moveTo(-aw + 12, 54); ox.lineTo(-aw, 62); ox.lineTo(-aw + 12, 70); ox.moveTo(aw - 12, 54); ox.lineTo(aw, 62); ox.lineTo(aw - 12, 70); ox.stroke(); }
  ox.restore();
}
function drawMath(m, t) { // rumus kecil pojok kanan atas: "100 PERMEN × Rp200 → 20 RB"
  ox.save(); ox.textAlign = 'right'; ox.font = '800 34px Poppins'; ox.fillStyle = '#ffffff'; ox.shadowColor = 'rgba(0,0,0,0.8)'; ox.shadowBlur = 8;
  const x = OW - 60; let y = 150;
  m.lines.forEach((l, i) => { if (t > (m.at?.[i] ?? i * 0.35)) { ox.fillText(l, x, y); } y += 48; });
  if (m.result && t > (m.resultAt ?? m.lines.length * 0.35)) { ox.fillStyle = 'rgba(255,255,255,0.8)'; ox.fillRect(x - 210, y - 22, 210, 3); ox.font = '800 52px Poppins'; ox.fillStyle = m.resultColor || '#5fd35a'; ox.fillText(m.result, x - 20, y + 30); }
  ox.restore();
}
function drawIcon(ic, t) { // ikon 2D kecil: tetes keringat, Z, hati, "!" — melayang dekat kepala
  const p = ic.at ? project(new THREE.Vector3(...ic.at)) : { x: ic.x, y: ic.y };
  const bob = Math.sin(t * 4) * 6; ox.save(); ox.translate(p.x, p.y + bob); const k = Math.min(1, t / 0.2); ox.scale(k * (ic.size || 1), k * (ic.size || 1));
  ox.lineWidth = 6; ox.strokeStyle = INK_CSS;
  if (ic.type === 'drop') { ox.fillStyle = '#5fb3e6'; ox.beginPath(); ox.moveTo(0, -36); ox.quadraticCurveTo(26, 6, 0, 18); ox.quadraticCurveTo(-26, 6, 0, -36); ox.fill(); ox.stroke(); }
  if (ic.type === 'z') { ox.font = '900 80px Poppins'; ox.fillStyle = '#eee'; ox.strokeText('Z', 0, 0); ox.fillText('Z', 0, 0); }
  if (ic.type === 'heart') { ox.fillStyle = '#e8a0b0'; ox.beginPath(); ox.moveTo(0, 30); ox.bezierCurveTo(-50, -5, -25, -45, 0, -20); ox.bezierCurveTo(25, -45, 50, -5, 0, 30); ox.fill(); ox.stroke(); }
  if (ic.type === 'bang') { ox.font = '900 96px Poppins'; ox.fillStyle = '#f4c430'; ox.strokeText('!', 0, 0); ox.fillText('!', 0, 0); }
  if (ic.type === 'q') { ox.font = '900 96px Poppins'; ox.fillStyle = '#ffffff'; ox.strokeText('?', 0, 0); ox.fillText('?', 0, 0); }
  ox.restore();
}

// ---------------------------------------------------------------- post-process (grading)
const postScene = new THREE.Scene(); const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const postMat = new THREE.ShaderMaterial({
  uniforms: { tDiffuse: { value: rt.texture }, time: { value: 0 }, res: { value: new THREE.Vector2(W, H) }, vig: { value: 1.0 }, warm: { value: 1.0 }, exposure: { value: 1.0 }, aces: { value: 0.0 }, sat: { value: 1.0 }, tint: { value: new THREE.Vector3(1, 1, 1) }, lift: { value: new THREE.Vector3(0, 0, 0) } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float time, vig, warm, exposure, aces, sat; uniform vec3 tint, lift; uniform vec2 res; varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
    vec3 lin2srgb(vec3 c){ return pow(c, vec3(1.0/2.2)); }
    vec3 acesF(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14), 0.0, 1.0); }
    void main(){
      vec2 px = 1.0/res;
      // sedikit lembut (seperti upscale referensi)
      vec3 c = texture2D(tDiffuse, vUv).rgb*0.6 + (texture2D(tDiffuse, vUv+vec2(px.x,0.)).rgb + texture2D(tDiffuse, vUv-vec2(px.x,0.)).rgb + texture2D(tDiffuse, vUv+vec2(0.,px.y)).rgb + texture2D(tDiffuse, vUv-vec2(0.,px.y)).rgb)*0.1;
      if (aces > 0.5) c = acesF(max(c,0.0) * exposure * 0.95); else c = max(c,0.0) * pow(exposure, 2.2);
      c = lin2srgb(c);                                   // RT linear -> sRGB (3D: ACES filmis)
      // grading hangat: biru ditekan, merah/oranye diangkat, hitam diremukkan ke coklat
      float l = dot(c, vec3(0.299,0.587,0.114));
      vec3 warmTint = vec3(1.03, 0.98, 0.90);
      c = mix(c, c*warmTint, warm);
      c.b = mix(c.b, c.b*c.b*1.15 + 0.0, 0.25*warm*(1.0-l));   // biru di bayangan ditekan
      c *= tint;                                         // warna suasana (malam biru, sedih pucat, dst.)
      l = dot(c, vec3(0.299,0.587,0.114));
      c = mix(vec3(l), c, sat);                          // saturasi suasana
      c += lift*(1.0-l);                                 // angkat bayangan ke warna suasana
      c = clamp((c-0.03)/0.97, 0.0, 1.0);               // crush black
      c = c*c*(3.0-2.0*c)*0.4 + c*0.6;                  // kurva S
      c += vec3(0.03,0.01,0.0)*(1.0-l)*warm;            // bayangan coklat-kemerahan
      // vignette elips berat
      vec2 q = (vUv-0.5)*vec2(1.0, 1.25);
      float v = smoothstep(0.95, 0.3, length(q)*1.2);
      c *= mix(1.0, mix(0.38, 1.0, v), vig);
      // grain
      float g = hash(vUv*res + fract(time*7.3)*100.0) - 0.5;
      c += g*0.045;
      gl_FragColor = vec4(clamp(c,0.0,1.0), 1.0);
    }`,
  depthTest: false, depthWrite: false,
});
postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMat));

// ---------------------------------------------------------------- suasana (mood)
// BASE = waktu/cuaca (mengatur cahaya & langit). MOD = emosi (mengubah grading). Gabung: "malam+tegang".
// Nilai *I dan exp/sat/vig adalah pengali terhadap nilai set; sore = tampilan referensi.
const MOOD_BASE = {
  sore:  { sunC: '#ffeedb', sunI: 1.0, el: null, hemiS: '#fff2e2', hemiG: '#5a3a28', hemiI: 1.0, ambC: '#8a6a58', ambI: 1.0, exp: 1.0, warm: 1.0, sat: 1.0, tint: [1, 1, 1], lift: [0, 0, 0], vig: 1.0, sky: null, fog: null, lamp: 0, dust: 1 },
  pagi:  { sunC: '#fff4e0', sunI: 0.85, el: 16, hemiS: '#f2f4ff', hemiG: '#6a5040', hemiI: 1.15, ambC: '#9a8a80', ambI: 1.0, exp: 1.06, warm: 0.5, sat: 0.95, tint: [1.0, 1.0, 1.04], lift: [0.01, 0.015, 0.03], vig: 0.8, sky: '#bfd9ea', fog: { c: '#e9e3d6', n: 22, f: 90 }, lamp: 0, dust: 1.2 },
  siang: { sunC: '#fffaf0', sunI: 1.1, el: 58, hemiS: '#f6f8ff', hemiG: '#6a5a40', hemiI: 1.25, ambC: '#a09080', ambI: 1.1, exp: 1.08, warm: 0.45, sat: 1.06, tint: [1, 1, 1], lift: [0, 0, 0], vig: 0.7, sky: '#8fc4e8', fog: null, lamp: 0, dust: 0.6 },
  malam: { sunC: '#a8b8ff', sunI: 0.45, el: 40, hemiS: '#7a86c0', hemiG: '#2a1c22', hemiI: 0.75, ambC: '#5a5070', ambI: 0.9, exp: 1.02, warm: 0.45, sat: 0.9, tint: [0.92, 0.94, 1.08], lift: [0.0, 0.005, 0.025], vig: 1.25, sky: '#151a38', fog: { c: '#151a38', n: 10, f: 42 }, lamp: 3.4, dust: 0.5 },
  hujan: { sunC: '#dfe6ee', sunI: 0.35, el: 50, hemiS: '#c8d0dc', hemiG: '#3a3a40', hemiI: 1.0, ambC: '#6a6a78', ambI: 1.0, exp: 0.86, warm: 0.35, sat: 0.75, tint: [0.95, 0.98, 1.05], lift: [0.0, 0.01, 0.02], vig: 1.15, sky: '#7a818d', fog: { c: '#7a818d', n: 7, f: 30 }, lamp: 1.2, rain: 1, dust: 0 },
  mendung: { sunC: '#e6e2da', sunI: 0.45, el: 45, hemiS: '#d6d6dc', hemiG: '#4a4038', hemiI: 1.05, ambC: '#7a7470', ambI: 1.0, exp: 0.92, warm: 0.45, sat: 0.8, tint: [0.98, 0.98, 1.02], lift: [0, 0, 0.01], vig: 1.1, sky: '#a4a6ad', fog: { c: '#a4a6ad', n: 12, f: 45 }, lamp: 0, dust: 0.4 },
};
const MOOD_MOD = {
  tegang:  { exp: 0.88, sat: 1.1, vig: 1.3, warmA: 0.1, tint: [1.06, 0.96, 0.92], sunI: 1.1 },
  sedih:   { exp: 0.9, sat: 0.6, vig: 1.25, warmA: -0.3, tint: [0.96, 0.98, 1.04], sunI: 0.8 },
  ceria:   { exp: 1.08, sat: 1.18, vig: 0.75, warmA: 0.05, tint: [1.02, 1.01, 0.98], sunI: 1.1, hemiI: 1.1 },
  misteri: { exp: 0.9, sat: 0.85, vig: 1.35, warmA: -0.15, tint: [0.95, 0.95, 1.06], sunI: 0.8, fogK: 0.7 },
  mewah:   { exp: 1.04, sat: 1.18, vig: 1.0, warmA: 0.15, tint: [1.06, 1.0, 0.86], sparkle: 1 },
  lega:    { exp: 1.04, sat: 1.0, vig: 0.85, warmA: 0.0, tint: [1.0, 1.0, 1.0], sunI: 1.05 },
};
function resolveMood(str) {
  const parts = (str || 'sore').split('+').map(x => x.trim());
  const base = { ...(MOOD_BASE[parts.find(x => MOOD_BASE[x])] || MOOD_BASE.sore) };
  base.tint = [...base.tint];
  for (const m of parts) { const d = MOOD_MOD[m]; if (!d) continue;
    base.exp *= d.exp ?? 1; base.sat *= d.sat ?? 1; base.vig *= d.vig ?? 1; base.warm = Math.max(0, base.warm + (d.warmA ?? 0));
    base.sunI *= d.sunI ?? 1; base.hemiI *= d.hemiI ?? 1; if (d.tint) base.tint = base.tint.map((v, i) => v * d.tint[i]);
    if (d.fogK && base.fog) base.fog = { ...base.fog, n: base.fog.n * d.fogK, f: base.fog.f * d.fogK };
    if (d.fogK && !base.fog) base.fog = { c: '#1a1630', n: 6, f: 24 };
    if (d.sparkle) base.sparkle = 1; }
  return base;
}
const _v = new THREE.Vector3();
function applyMood(s, setObj, tg) {
  const u = setObj.userData, m = resolveMood(s.mood);
  // matahari: arah horizontal dari set, ketinggian dari suasana (interior dibatasi agar cahaya tetap masuk jendela)
  if (s.sun) sun.position.set(...s.sun);
  else if (m.el == null) sun.position.set(...u.sun);
  else { const t0 = new THREE.Vector3(...u.sunTarget); _v.set(...u.sun).sub(t0); const dist = _v.length(); _v.y = 0; _v.normalize();
    const el = (u.interior ? Math.min(m.el, 30) : m.el) * Math.PI / 180; sun.position.copy(t0).addScaledVector(_v, Math.cos(el) * dist); sun.position.y = t0.y + Math.sin(el) * dist; }
  sun.color.set(s.sunColor || m.sunC); sun.intensity = s.sunI ?? u.sunI * m.sunI;
  hemi.color.set(m.hemiS); hemi.groundColor.set(m.hemiG); hemi.intensity = u.hemi * m.hemiI * (STYLE3D ? 0.5 : 1); fill.color.set(m.ambC); fill.intensity = u.amb * m.ambI * (STYLE3D ? 0.35 : 1);
  if (STYLE3D) sun.intensity *= 1.15;
  // langit / latar
  const sky = setObj.getObjectByName('sky'); const skyC = s.sky || m.sky;
  if (sky) { if (!sky.userData.c0) sky.userData.c0 = '#' + sky.material.color.getHexString(); sky.material.color.set(skyC || sky.userData.c0); }
  scene.background = new THREE.Color(u.interior ? (m.sky && m.lamp ? '#0c0a14' : u.bg) : (skyC || u.bg));
  scene.fog = m.fog && !s.noFog ? new THREE.Fog(m.fog.c, m.fog.n, m.fog.f) : null;
  // lampu praktis (malam/hujan): menyala di posisi lampu set atau di atas subjek
  const li = s.lamp ?? Math.max(m.lamp, u.lampAlways || 0);   // set dgn api/lampu selalu menyala (dapur) lampLight.intensity = li * 2.6; lampLight.decay = 1.0; if (li) { const lp = s.lampAt || u.lampPos || [tg[0], 2.9, tg[2] + 0.8]; lampLight.position.set(...lp); lampLight.distance = 10; lampLight.color.set(s.lampColor || '#ffc27a'); }
  // grading
  const U = postMat.uniforms;
  U.exposure.value = s.exposure ?? m.exp; U.warm.value = s.warm ?? m.warm; U.vig.value = s.vig ?? m.vig; U.sat.value = (s.sat ?? m.sat) * (STYLE3D ? 1.12 : 1);
  U.tint.value.set(...(s.tint || m.tint)); U.lift.value.set(...m.lift);
  return m;
}
const sparkles = (() => { const r = rnd(55); return Array.from({ length: 26 }, () => ({ x: r() * OW, y: r() * OH * 0.8, ph: r() * 6, s: 6 + r() * 10 })); })();
function drawSparkle(t) { ox.save(); for (const p of sparkles) { const a = Math.max(0, Math.sin(t * 3 + p.ph)); if (a < 0.2) continue; ox.globalAlpha = a * 0.8; ox.fillStyle = '#ffe9a0'; ox.translate(p.x, p.y); ox.rotate(Math.PI / 4); ox.fillRect(-p.s * a / 2, -1.5, p.s * a, 3); ox.fillRect(-1.5, -p.s * a / 2, 3, p.s * a); ox.setTransform(1, 0, 0, 1, 0, 0); } ox.restore(); }

// ---------------------------------------------------------------- mode 3D: pipeline render
let STORY_OPTS = {};
let composer = null, gtao = null, bokeh = null, rimLight = null, font3d = null;
const overlayScene = new THREE.Scene();
function setup3D() {
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  sun.shadow.radius = 4; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004;
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.3;
  rimLight = new THREE.DirectionalLight(0xcfe0ff, 1.1); scene.add(rimLight); scene.add(rimLight.target);
  const RS = STORY_OPTS.scale ?? 0.82; const W3 = Math.round(W * RS / 2) * 2, H3 = Math.round(H * RS / 2) * 2;   // resolusi internal 3D (di-upscale ke 1080×1920)
  renderer.setSize(W3, H3); postMat.uniforms.res.value.set(W3, H3);
  const crt = new THREE.WebGLRenderTarget(W3, H3, { samples: 2, type: THREE.HalfFloatType });
  composer = new EffectComposer(renderer, crt); composer.setPixelRatio(1); composer.setSize(W3, H3);
  composer.addPass(new RenderPass(scene, camera));
  gtao = new GTAOPass(scene, camera, W3, H3); gtao.blendIntensity = 0.9;
  gtao.updateGtaoMaterial({ radius: 0.35, distanceExponent: 1.4, thickness: 1.0, scale: 1.0, samples: 8 });
  gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 4, rings: 2, samples: 4 });
  if (STORY_OPTS.ao !== false) composer.addPass(gtao);
  bokeh = new BokehPass(scene, camera, { focus: 3.0, aperture: 0.0018, maxblur: 0.006 }); if (STORY_OPTS.dof !== false) composer.addPass(bokeh);
  postMat.uniforms.aces.value = 1.0; composer.addPass(new ShaderPass(postMat));
  // cahaya untuk teks/ikon 3D (overlay, selalu di depan)
  overlayScene.add(new THREE.HemisphereLight(0xfff4e0, 0x5a3a28, 1.4)); const od = new THREE.DirectionalLight(0xffffff, 2.2); od.position.set(2, 4, 5); overlayScene.add(od);
  const pm2 = new THREE.PMREMGenerator(renderer); overlayScene.environment = pm2.fromScene(new RoomEnvironment(), 0.04).texture;
}
// ---- partikel 3D: debu melayang (Points) & hujan (garis jatuh) di sekitar kamera
const DUST_N = 420, RAIN_N = 900;
let dustPts = null, rainLines = null, sparkPts = null;
function makeParticles() {
  const r = rnd(321);
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(DUST_N * 3), 3));
  dg.userData.base = Array.from({ length: DUST_N }, () => [r() * 6 - 3, r() * 3.2, r() * 6 - 3, (r() - 0.5) * 0.15, 0.03 + r() * 0.08, (r() - 0.5) * 0.15, r() * 6]);
  dustPts = new THREE.Points(dg, new THREE.PointsMaterial({ color: '#ffe8c4', size: 0.022, transparent: true, opacity: 0.75, depthWrite: false, sizeAttenuation: true }));
  dustPts.frustumCulled = false; scene.add(dustPts);
  const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(RAIN_N * 6), 3));
  rg.userData.base = Array.from({ length: RAIN_N }, () => [r() * 9 - 4.5, r() * 6, r() * 9 - 4.5, 7 + r() * 4]);
  rainLines = new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ color: '#d8e2f0', transparent: true, opacity: 0.55, depthWrite: false }));
  rainLines.frustumCulled = false; scene.add(rainLines);
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(60 * 3), 3));
  sg.userData.base = Array.from({ length: 60 }, () => [r() * 3 - 1.5, r() * 2.2, r() * 3 - 1.5, r() * 6]);
  sparkPts = new THREE.Points(sg, new THREE.PointsMaterial({ color: '#ffe18a', size: 0.05, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending }));
  sparkPts.frustumCulled = false; overlayScene.add(sparkPts);
}
const wrap = (v, a, b) => a + ((((v - a) % (b - a)) + (b - a)) % (b - a));
function updateParticles(T, tg, dust, rain, sparkle) {
  dustPts.visible = dust > 0 && !rain; rainLines.visible = !!rain; sparkPts.visible = !!sparkle;
  const c = new THREE.Vector3(...tg);
  if (dustPts.visible) { const a = dustPts.geometry.attributes.position.array; dustPts.material.opacity = 0.55 * Math.min(1.4, dust);
    dustPts.geometry.userData.base.forEach(([x, y, z, vx, vy, vz, ph], i) => { a[i * 3] = c.x + wrap(x + vx * T + Math.sin(T * 0.6 + ph) * 0.08, -3, 3); a[i * 3 + 1] = wrap(y + vy * T, 0.05, 3.2); a[i * 3 + 2] = c.z + wrap(z + vz * T, -3, 3); });
    dustPts.geometry.attributes.position.needsUpdate = true; }
  if (rain) { const a = rainLines.geometry.attributes.position.array; rainLines.material.opacity = 0.45 * Math.min(1.5, rain);
    rainLines.geometry.userData.base.forEach(([x, y, z, v], i) => { const yy = wrap(y - v * T, 0, 6), xx = c.x + wrap(x - 0.04 * v * T, -4.5, 4.5), zz = c.z + z;
      a[i * 6] = xx; a[i * 6 + 1] = yy; a[i * 6 + 2] = zz; a[i * 6 + 3] = xx + 0.04; a[i * 6 + 4] = yy + 0.28; a[i * 6 + 5] = zz; });
    rainLines.geometry.attributes.position.needsUpdate = true; }
  if (sparkle) { const a = sparkPts.geometry.attributes.position.array;
    sparkPts.geometry.userData.base.forEach(([x, y, z, ph], i) => { a[i * 3] = c.x + x; a[i * 3 + 1] = 0.6 + y + Math.sin(T * 1.5 + ph) * 0.05; a[i * 3 + 2] = c.z + z; });
    sparkPts.material.opacity = 0.6 + 0.4 * Math.sin(T * 5); sparkPts.geometry.attributes.position.needsUpdate = true; }
}
// ---- teks & ikon 3D (callout angka, !, ?, Z, hati, keringat) — di overlayScene
const o3cache = {};
function text3D(str, color, depth = 0.22) {
  const k = 't|' + str + '|' + color; if (o3cache[k]) return o3cache[k];
  const g = new THREE.Group();
  const geo = new TextGeometry(str, { font: font3d, size: 1, depth, curveSegments: 6, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.035, bevelSegments: 3 });
  geo.computeBoundingBox(); const bb = geo.boundingBox; geo.translate(-(bb.max.x + bb.min.x) / 2, -(bb.max.y + bb.min.y) / 2, -depth / 2);
  const front = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 0.32, metalness: 0.25, envMapIntensity: 1.0 })); g.add(front);
  const back = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: '#2a1404', roughness: 0.6 })); back.scale.set(1.04, 1.06, 1); back.position.set(0.03, -0.05, -0.08); g.add(back);
  g.userData.w = bb.max.x - bb.min.x; o3cache[k] = g; overlayScene.add(g); return g;
}
function arrow3D(color) {
  const k = 'a|' + color; if (o3cache[k]) return o3cache[k];
  const g = new THREE.Group(); const m = new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.2 });
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2, 12), m); bar.rotation.z = Math.PI / 2; g.add(bar);
  for (const sx of [-1, 1]) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.2, 14), m); c.rotation.z = -sx * Math.PI / 2; c.position.x = sx * 1.05; g.add(c); }
  o3cache[k] = g; overlayScene.add(g); return g;
}
function icon3D(type) {
  const k = 'i|' + type; if (o3cache[k]) return o3cache[k];
  let g = new THREE.Group();
  if (type === 'drop') { const m = new THREE.MeshPhysicalMaterial({ color: '#7cc8f0', roughness: 0.05, clearcoat: 1 }); const b = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 16), m); g.add(b); const c = new THREE.Mesh(new THREE.ConeGeometry(0.44, 0.8, 24), m); c.position.y = 0.52; g.add(c); }
  else if (type === 'heart') { const sh = new THREE.Shape(); sh.moveTo(0, -0.6); sh.bezierCurveTo(-1.1, 0.1, -0.5, 0.9, 0, 0.35); sh.bezierCurveTo(0.5, 0.9, 1.1, 0.1, 0, -0.6);
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.08, bevelSegments: 4 }); geo.center(); g.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: '#f06a8a', roughness: 0.3 }))); }
  else { const map = { bang: ['!', '#f4c430'], q: ['?', '#ffffff'], z: ['Z', '#e8e8f0'] }[type] || ['!', '#f4c430']; const t = text3D(map[0], map[1]); delete o3cache['t|' + map[0] + '|' + map[1]]; g = t; }
  o3cache[k] = g; overlayScene.add(g); return g;
}
const _ndc = new THREE.Vector3();
function anchor3D(at, x, y, dDefault = 2.2) {   // posisi dunia: titik 3D, atau koordinat layar (px 1080x1920) di kedalaman dDefault
  if (at) { const v = new THREE.Vector3(...at); return { pos: v, d: camera.position.distanceTo(v) }; }
  _ndc.set(x / OW * 2 - 1, -(y / OH * 2 - 1), 0.5).unproject(camera); const dir = _ndc.sub(camera.position).normalize();
  return { pos: camera.position.clone().addScaledVector(dir, dDefault), d: dDefault };
}
const pxToWorld = (px, d) => px / OH * 2 * d * Math.tan(camera.fov * Math.PI / 360);
function draw3DOverlays(s, lt) {
  for (const k in o3cache) o3cache[k].visible = false;
  (s.callouts || []).forEach((c, i) => { const t = lt - (c.t || 0); if (t < 0 && c.t !== -1) return; const tt = c.t === -1 ? 9 : t;
    const g = text3D(c.text, c.color || '#f4c430'); const { pos, d } = anchor3D(c.at, c.x, c.y);
    const k = Math.min(1, tt / 0.3); const pop = 1 + 0.18 * Math.sin(k * Math.PI); const sc = pxToWorld((c.size || 84) * 0.95, d) * (0.4 + 0.6 * ease.o(k)) * pop;
    g.visible = true; g.position.copy(pos); g.quaternion.copy(camera.quaternion); g.rotateY((1 - ease.o(k)) * 0.9 + Math.sin(tt * 1.8 + i) * 0.12); g.rotateX(-0.08); g.scale.setScalar(sc);
    if (c.arrow !== false && !/^[!?]$/.test(c.text)) { const a = arrow3D(c.color || '#f4c430'); a.visible = true; a.position.copy(pos).addScaledVector(new THREE.Vector3(0, -1, 0).applyQuaternion(camera.quaternion), sc * 0.85);
      a.quaternion.copy(camera.quaternion); a.scale.set(sc * g.userData.w * 0.55, sc, sc); } });
  (s.icons || []).forEach((ic, i) => { const t = lt - (ic.t || 0); if (t < 0 && ic.t !== -1) return; const tt = ic.t === -1 ? 9 : t;
    const g = icon3D(ic.type); const { pos, d } = anchor3D(ic.at, ic.x, ic.y); const k = ease.o(Math.min(1, tt / 0.25));
    g.visible = true; g.position.copy(pos).add(new THREE.Vector3(0, Math.sin(tt * 4) * 0.03, 0)); g.quaternion.copy(camera.quaternion); g.rotateY(Math.sin(tt * 2.5 + i) * 0.5);
    g.scale.setScalar(pxToWorld(80 * (ic.size || 1), d) * k); });
}

// ---------------------------------------------------------------- timeline
let STORY = null; let curSet = null;
const ease = { io: (t) => 0.5 - 0.5 * Math.cos(Math.PI * t), o: (t) => 1 - Math.pow(1 - t, 3), i: (t) => t * t * t, l: (t) => t };
const lerp3 = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);

function useSet(name) {
  if (curSet === name) return; curSet = name;
  for (const k in sets) sets[k].visible = k === name;
  const u = sets[name].userData;
  sun.position.set(...u.sun); sun.target.position.set(...u.sunTarget); sun.intensity = u.sunI;
  hemi.intensity = u.hemi; fill.intensity = u.amb; scene.background = new THREE.Color(u.bg);
  if (u.sunColor) sun.color.set(u.sunColor); else sun.color.set(0xffeedb);
}

function applyActor(ch, a, lt, dur) {
  const r = ch.root; r.visible = a.show !== false;
  let pos = a.pos || [0, 0, 0];
  let walking = false;
  if (a.to) { const k = Math.min(1, Math.max(0, (lt - (a.toStart || 0)) / (a.toDur || dur))); walking = k > 0 && k < 1; pos = lerp3(a.pos, a.to, a.toEase ? ease[a.toEase](k) : k); }
  r.position.set(...pos); r.rotation.y = (a.rot || 0) * Math.PI / 180;
  // ekspresi (bisa berubah di tengah shot: exprAt: [[t,'expr'],...])
  let e = a.expr || ch.spec.expr || 'neutral'; if (a.exprAt) for (const [tt, ee] of a.exprAt) if (lt >= tt) e = ee;
  // kedip otomatis untuk mata titik
  if ((e === 'neutral' || e === 'smile') && !a.noBlink) { const bt = (lt + (ch.id.length * 0.37)) % 3.1; if (bt > 2.95) e = e === 'neutral' ? 'blink' : 'content'; }
  ch.setExpr(e);
  // animasi
  const t = lt + ch.id.length;
  const rig = ch.rig; rig.position.set(0, 0, 0); rig.rotation.set(0, 0, 0); ch.head.rotation.set(0, 0, 0);
  const breath = Math.sin(t * 2.4) * 0.012; rig.scale.set(ch.spec.scale || 1, (ch.spec.scale || 1) * (1 + breath), ch.spec.scale || 1);
  ch.legs.forEach(l => l.rotation.set(0, 0, 0)); ch.arms.forEach((s, i) => s.rotation.set(0, 0, (i ? 1 : -1) * 0.18));
  const anim = a.anim || 'idle';
  if (walking || anim === 'walk') { const p = t * 9; ch.legs[0].rotation.x = Math.sin(p) * 0.5; ch.legs[1].rotation.x = -Math.sin(p) * 0.5; rig.position.y = Math.abs(Math.sin(p)) * 0.04; ch.arms[0].rotation.x = -Math.sin(p) * 0.4; ch.arms[1].rotation.x = Math.sin(p) * 0.4; }
  if (anim === 'nod') ch.head.rotation.x = Math.max(0, Math.sin(lt * 7)) * 0.18;
  if (anim === 'shake') ch.head.rotation.y = Math.sin(lt * 12) * 0.2;
  if (anim === 'laugh') { rig.position.y = Math.abs(Math.sin(lt * 14)) * 0.03; ch.head.rotation.z = Math.sin(lt * 7) * 0.06; }
  if (anim === 'jump') { rig.position.y = Math.max(0, Math.sin(Math.min(lt, 0.5) * Math.PI / 0.5)) * 0.3; }
  if (anim === 'tremble') { rig.position.x = Math.sin(lt * 60) * 0.008; }
  if (anim === 'lean') rig.rotation.x = 0.12;
  if (anim === 'pushup') { const k = Math.max(0, Math.sin(lt * 6)); rig.rotation.x = 1.3; rig.position.set(0, 0.42 + k * 0.12, -0.6); ch.arms.forEach(a2 => { a2.rotation.x = -1.3; }); }
  if (anim === 'run') { const p2 = lt * 14; ch.legs[0].rotation.x = Math.sin(p2) * 0.9; ch.legs[1].rotation.x = -Math.sin(p2) * 0.9; rig.position.y = Math.abs(Math.sin(p2)) * 0.08; ch.arms[0].rotation.x = -Math.sin(p2) * 0.8; ch.arms[1].rotation.x = Math.sin(p2) * 0.8; rig.rotation.x = 0.12; }
  if (anim === 'sit') { ch.legs.forEach(l => l.rotation.x = -1.45); ch.arms.forEach(a2 => a2.rotation.x = -0.5); }
  if (anim === 'turn') r.rotation.y = ((a.rot || 0) + ((a.rot2 ?? 0) - (a.rot || 0)) * ease.io(Math.min(1, lt / 0.5))) * Math.PI / 180;
  if (a.headTilt) ch.head.rotation.z = a.headTilt;
  if (a.headTurn) ch.head.rotation.y = a.headTurn;
  // lengan: armR / armL = [x,z] radian; "give" = mengulurkan tangan ke depan
  if (a.armR) ch.arms[1].rotation.set(a.armR[0], 0, a.armR[1]);
  if (a.armL) ch.arms[0].rotation.set(a.armL[0], 0, a.armL[1]);
  if (a.give) { const k = ease.o(Math.min(1, lt / 0.4)); ch.arms[1].rotation.x = -1.3 * k; }
  if (a.wave) { ch.arms[1].rotation.z = 2.4 + Math.sin(lt * 10) * 0.35; }
}

function applyProp(o, s, lt, dur) {
  o.visible = s.show !== false;
  let pos = s.pos || [0, 0, 0];
  if (s.to) { const k = Math.min(1, Math.max(0, (lt - (s.toStart || 0)) / (s.toDur || dur))); pos = lerp3(s.pos, s.to, ease[s.toEase || 'io'](k)); }
  o.position.set(...pos);
  o.rotation.set(...(s.rot || [0, 0, 0]).map(d => d * Math.PI / 180));
  if (s.spin) o.rotation.y += lt * s.spin;
  const sc = s.scale ?? 1; if (s.grow) { const k = ease.o(Math.min(1, lt / s.grow)); o.scale.setScalar(sc * Math.max(0.001, k)); } else o.scale.setScalar(sc);
}

function shotAt(T) { let acc = 0, i = 0; for (const s of STORY.shots) { if (T < acc + s.dur) return [s, T - acc, i]; acc += s.dur; i++; } const l = STORY.shots[STORY.shots.length - 1]; return [l, l.dur, i - 1]; }
function capAt(T) { for (const c of STORY.captions) if (T >= c.s && T < c.e) return c; return null; }

window.renderAt = function (T) {
  const [s, lt, si] = shotAt(T);
  useSet(s.set);
  // aktor
  for (const id in chars) { const a = s.actors?.[id]; if (!a) { chars[id].root.visible = false; continue; } applyActor(chars[id], a, lt, s.dur); }
  for (const id in props) { const p = s.props?.[id]; if (!p) { props[id].visible = false; continue; } applyProp(props[id], p, lt, s.dur); }
  // kamera: dolly pelan p→p2, target t→t2 (gaya referensi: push-in lambat terus-menerus)
  const c = s.cam; const k = ease[c.ease || 'l'](Math.min(1, lt / s.dur));
  const p = c.p2 ? lerp3(c.p, c.p2, k) : c.p; const tg = c.t2 ? lerp3(c.t, c.t2, k) : c.t;
  const shake = c.shake ? Math.sin(lt * 40) * c.shake * Math.max(0, 1 - lt / 0.35) : 0;
  let pp = p;
  const arcDeg = c.arc ?? (STYLE3D ? (si % 2 ? 1 : -1) * 4 : 0);   // busur pelan → parallax 3D
  if (arcDeg) { const a = arcDeg * Math.PI / 180 * (k - 0.5), dx = p[0] - tg[0], dz = p[2] - tg[2]; pp = [tg[0] + dx * Math.cos(a) + dz * Math.sin(a), p[1], tg[2] - dx * Math.sin(a) + dz * Math.cos(a)]; }
  camera.position.set(pp[0] + shake, pp[1] + shake * 0.6, pp[2]); camera.lookAt(...tg);
  camera.fov = c.fov2 ? c.fov + (c.fov2 - c.fov) * k : (c.fov || 35); camera.updateProjectionMatrix();
  if (c.roll) camera.rotation.z += c.roll;
  // suasana → cahaya, langit, kabut, lampu, grading
  const md = applyMood(s, sets[s.set], tg);
  postMat.uniforms.time.value = T;
  if (STYLE3D) {
    // rim light dari belakang subjek (memisahkan karakter dari latar → kesan volume)
    const back = new THREE.Vector3(...tg).sub(camera.position).setY(0).normalize();
    rimLight.position.set(tg[0] + back.x * 4, tg[1] + 3, tg[2] + back.z * 4); rimLight.target.position.set(...tg); rimLight.intensity = 1.1 * (md.sunI ?? 1);
    updateParticles(T, tg, s.dust ?? md.dust, s.rain ?? (sets[s.set].userData.interior ? 0 : md.rain), md.sparkle || s.sparkle);
    bokeh.uniforms.focus.value = camera.position.distanceTo(new THREE.Vector3(...tg)); bokeh.uniforms.aperture.value = s.dof ?? 0.0018;
    composer.render();
    draw3DOverlays(s, lt);
    renderer.autoClear = false; renderer.clearDepth(); renderer.render(overlayScene, camera); renderer.autoClear = true;
  } else {
    renderer.setRenderTarget(rt); renderer.render(scene, camera);
    renderer.setRenderTarget(null); renderer.render(postScene, postCam);
  }
  // komposit 2D
  ox.imageSmoothingQuality = 'high'; ox.drawImage(renderer.domElement, 0, 0, OW, OH);
  if (!STYLE3D) {   // mode toon: efek 2D lama
    const rain = s.rain ?? (sets[s.set].userData.interior ? 0 : md.rain);   // hujan otomatis hanya di eksterior
    if (rain) drawRain(T, rain); else drawDust(T, s.dust ?? md.dust);
    if (md.sparkle || s.sparkle) drawSparkle(T);
    (s.icons || []).forEach(ic => { if (lt >= (ic.t || 0)) drawIcon(ic, lt - (ic.t || 0)); });
    (s.callouts || []).forEach(co => { if (lt >= (co.t || 0)) drawCallout(co, lt - (co.t || 0)); });
  }
  if (s.math) drawMath(s.math, lt);
  const cap = capAt(T);
  if (cap) { const a = Math.min(1, (T - cap.s) / 0.12, (cap.e - T) / 0.1); const sc = 1; drawCaption(cap.text, cap.c, Math.max(0, a), sc); }
  // fade dari/ke hitam di awal & akhir
  const fin = Math.min(1, T / 0.25), fout = Math.min(1, (STORY.total - T) / 0.6);
  const f = Math.min(fin, fout); if (f < 1) { ox.fillStyle = `rgba(0,0,0,${1 - f})`; ox.fillRect(0, 0, OW, OH); }
  return true;
};
window.frameJPEG = () => out.toDataURL('image/jpeg', 0.93);

window.loadStory = async function (story) {
  await document.fonts.load('700 78px Poppins'); await document.fonts.load('800 84px Poppins'); await document.fonts.load('900 80px Poppins');
  STYLE3D = (story.style || '3d') !== 'toon'; OUTLINE3D = story.outline ?? 0; STORY_OPTS = { ao: story.ao, dof: story.dof, scale: story.scale };
  if (STYLE3D) font3d = new FontLoader().parse(await (await fetch('/assets/poppins_800.typeface.json')).json());
  lights();
  if (STYLE3D) { setup3D(); makeParticles(); }
  sets.warung = buildWarung(); sets.street = buildStreet(); sets.bank = buildBank(); sets.halte = buildHalte(); sets.istana = buildIstana(); sets.taman = buildTaman(); sets.rumah = buildRumah(); sets.dapur = buildDapur(); sets.kampung = buildKampung(); sets.pasar = buildPasar();
  sets.bank.position.set(0, 0, 60); sets.street.position.set(60, 0, 0);
  for (const k in sets) scene.add(sets[k]);
  // offset world agar set terpisah: shot memakai koordinat lokal set → kita geser kamera/aktor via parent
  STORY = story;
  for (const [id, spec] of Object.entries(story.cast)) { const ch = makeChar(id, spec); scene.add(ch.root); }
  for (const [id, def] of Object.entries(story.props || {})) { const o = prop(id, P[def.type](...(def.args || []))); scene.add(o); }
  STORY.total = STORY.shots.reduce((a, s) => a + s.dur, 0);
  // posisi set: semua set di origin, hanya satu yang terlihat (lebih sederhana untuk penulisan shot)
  for (const k in sets) sets[k].position.set(0, 0, 0);
  return STORY.total;
};
