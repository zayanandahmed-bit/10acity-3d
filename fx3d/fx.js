// 10ACITY 3D journey — the page's own sections become panels floating in a 3D world and
// scrolling flies a camera from one to the next. Nothing in the content is altered.
// With reduced motion (or ?classic) the normal page is shown with light hover effects.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js';

const root = document.documentElement;
const params = new URLSearchParams(location.search);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const touch = matchMedia('(hover: none)').matches;

const TEAL = new THREE.Color('#1aafa7');
const MINT = new THREE.Color('#6ee7b7');
const DEEP = new THREE.Color('#0d5f5a');
const X_AXIS = new THREE.Vector3(1, 0, 0);
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const Z_AXIS = new THREE.Vector3(0, 0, 1);
const ONE = new THREE.Vector3(1, 1, 1);

const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const make = (tag, props = {}) => Object.assign(document.createElement(tag), props);

const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
if (!touch) {
  addEventListener('pointermove', (e) => {
    mouse.x = (e.clientX / innerWidth) * 2 - 1;
    mouse.y = (e.clientY / innerHeight) * 2 - 1;
  }, { passive: true });
}

/* =====================================================================
   Hover effects (both modes)
   ===================================================================== */
const TILT_SEL = '.hiw__card, .svc__card, .boxes-section .box, [data-id="11a72051"], [data-id="35beb80f"], .elementor-widget-elementskit-testimonial, [data-id="20ee614f"]';

function initTilt() {
  $$(TILT_SEL).forEach((el) => {
    el.classList.add('fx-tilt');
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    const glare = make('span', { className: 'fx-glare' });
    glare.setAttribute('aria-hidden', 'true');
    el.appendChild(glare);
    if (reduced || touch) return;
    el.addEventListener('pointerenter', () => el.classList.add('fx-hover'));
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const maxDeg = r.width > 600 ? 5 : 12;
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      el.style.setProperty('--ry', ((px - 0.5) * maxDeg * 2).toFixed(2) + 'deg');
      el.style.setProperty('--rx', ((0.5 - py) * maxDeg * 2).toFixed(2) + 'deg');
      el.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
      el.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
    });
    el.addEventListener('pointerleave', () => {
      el.classList.remove('fx-hover');
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    });
  });
}

function initMagnets() {
  if (reduced || touch) return;
  $$('.elementor-button, .metform-btn, button[type="submit"]').forEach((b) => {
    b.classList.add('fx-magnet');
    b.addEventListener('pointermove', (e) => {
      const r = b.getBoundingClientRect();
      b.style.setProperty('--mx', ((e.clientX - r.left - r.width / 2) * 0.3).toFixed(1) + 'px');
      b.style.setProperty('--my', ((e.clientY - r.top - r.height / 2) * 0.4).toFixed(1) + 'px');
      b.classList.add('fx-hover');
    });
    b.addEventListener('pointerleave', () => {
      b.style.setProperty('--mx', '0px');
      b.style.setProperty('--my', '0px');
      b.classList.remove('fx-hover');
    });
  });
}

function initCursor() {
  if (reduced || touch) return;
  const ring = make('div', { className: 'fx-cursor' });
  const dot = make('div', { className: 'fx-dot' });
  document.body.append(ring, dot);
  let x = -100, y = -100, rx = -100, ry = -100;
  addEventListener('pointermove', (e) => {
    x = e.clientX; y = e.clientY;
    document.body.classList.add('fx-has-cursor');
    ring.classList.toggle('fx-big', !!e.target.closest?.('a, button, input, textarea, select, .fx-tilt'));
  }, { passive: true });
  document.addEventListener('pointerleave', () => document.body.classList.remove('fx-has-cursor'));
  (function loop() {
    rx += (x - rx) * 0.2;
    ry += (y - ry) * 0.2;
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
    dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    requestAnimationFrame(loop);
  })();
}

function classic() {
  root.classList.remove('j-on');
  root.classList.add('j-off');
  initTilt();
  initMagnets();
  initCursor();
}

/* =====================================================================
   CSS 3D projection (same maths as three.js CSS3DRenderer)
   ===================================================================== */
const eps = (v) => (Math.abs(v) < 1e-10 ? 0 : v);
function cameraCSS(m) {
  const e = m.elements;
  return `matrix3d(${eps(e[0])},${eps(-e[1])},${eps(e[2])},${eps(e[3])},${eps(e[4])},${eps(-e[5])},${eps(e[6])},${eps(e[7])},${eps(e[8])},${eps(-e[9])},${eps(e[10])},${eps(e[11])},${eps(e[12])},${eps(-e[13])},${eps(e[14])},${eps(e[15])})`;
}
function objectCSS(m) {
  const e = m.elements;
  return `translate(-50%,-50%)matrix3d(${eps(e[0])},${eps(e[1])},${eps(e[2])},${eps(e[3])},${eps(-e[4])},${eps(-e[5])},${eps(-e[6])},${eps(-e[7])},${eps(e[8])},${eps(e[9])},${eps(e[10])},${eps(e[11])},${eps(e[12])},${eps(e[13])},${eps(e[14])},${eps(e[15])})`;
}

/* =====================================================================
   Shared textures
   ===================================================================== */
function glowTexture() {
  const c = make('canvas', { width: 128, height: 128 });
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.18, 'rgba(255,255,255,0.55)');
  grd.addColorStop(0.45, 'rgba(255,255,255,0.12)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}
function starTexture() {
  const c = make('canvas', { width: 64, height: 64 });
  const g = c.getContext('2d');
  g.translate(32, 32);
  g.fillStyle = '#fff';
  g.shadowColor = '#fff';
  g.shadowBlur = 8;
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 9 : 22;
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  g.closePath();
  g.fill();
  return new THREE.CanvasTexture(c);
}

/* =====================================================================
   Journey
   ===================================================================== */
function journey() {
  const headerWrap = document.querySelector('.ekit-template-content-header');
  const contentRoots = [...document.body.children].filter((el) => el !== headerWrap && el.querySelector?.('.e-con.e-parent'));
  if (!contentRoots.length) return false;

  let renderer;
  const canvas = make('canvas', { id: 'fx-canvas' });
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !touch, powerPreference: 'high-performance' });
  } catch (e) {
    return false;
  }

  const mobile = innerWidth < 768;
  const cfg = mobile
    ? { fov: 52, G: 1900, dx: 200, dy: -150, yaw: 7, arc: 90, bank: 3, warp: 6, T: 0.95, D: 0.28, look: 0 }
    : { fov: 50, G: 2700, dx: 520, dy: -220, yaw: 11, arc: 140, bank: 4, warp: 8, T: 1.15, D: 0.32, look: 0.9 };

  root.classList.add('j-on');
  history.scrollRestoration = 'manual';
  scrollTo({ top: 0, behavior: 'instant' });

  /* ---------- loader ---------- */
  const logo = headerWrap?.querySelector('img');
  const loader = make('div', { id: 'j-loader' });
  loader.innerHTML = `<div class="j-load-inner">${logo ? `<img src="${logo.getAttribute('src')}" alt="">` : ''}<div class="j-load-bar"><i></i></div></div>`;
  document.body.append(loader);

  /* ---------- stage ---------- */
  const view = make('div', { id: 'j-view' });
  const cam = make('div', { id: 'j-cam' });
  view.append(cam);
  contentRoots[0].before(view);
  contentRoots.forEach((r) => cam.append(r));
  document.body.prepend(canvas);
  const spacer = make('div', { id: 'j-scroll' });
  document.body.append(spacer);
  // overflow:hidden containers can still be scrolled by focus — keep the stage pinned
  view.addEventListener('scroll', () => { view.scrollTop = 0; view.scrollLeft = 0; });

  const sections = contentRoots.flatMap((r) => $$('.e-con.e-parent', r)).filter((s) => !s.parentElement.closest('.e-con.e-parent'));
  const chain = new Set();
  sections.forEach((s) => { for (let e = s.parentElement; e && e !== cam; e = e.parentElement) chain.add(e); });
  chain.forEach((e) => e.classList.add('j-p3d'));
  sections.forEach((s) => s.classList.add('j-sec'));

  /* ---------- three ---------- */
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.25 : 1.5));
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(cfg.fov, innerWidth / innerHeight, 1, 30000); // drives the DOM
  const glCam = new THREE.PerspectiveCamera(cfg.fov, innerWidth / innerHeight, 1, 30000);  // same, plus mouse parallax
  const glow = glowTexture();
  const uni = {
    uTime: { value: 0 },
    uPx: { value: renderer.getPixelRatio() },
    uH: { value: innerHeight / 2 },
    uVel: { value: new THREE.Vector3() },
    uSpeed: { value: 0 },
    uCalm: { value: 0 },
  };

  /* ---------- measure + layout ---------- */
  let W = 0, vh = 0, F = 0, hud = 0, total = 0;
  let groups = [];
  let segs = [];

  function measure() {
    root.classList.add('j-measure');
    sections.forEach((s) => {
      s.classList.remove('j-sec', 'j-live');
      ['transform', 'width', 'opacity', 'visibility'].forEach((p) => s.style.removeProperty(p));
    });
    chain.forEach((e) => e.classList.remove('j-p3d'));
    const base = cam.getBoundingClientRect();
    const rects = sections.map((s) => {
      const r = s.getBoundingClientRect();
      return { s, top: r.top - base.top, left: r.left - base.left, w: r.width, h: r.height };
    });
    const width = cam.clientWidth;
    chain.forEach((e) => e.classList.add('j-p3d'));
    sections.forEach((s) => s.classList.add('j-sec'));
    root.classList.remove('j-measure');
    return { width, rects };
  }

  function buildGroups(rects) {
    const out = [];
    rects.filter((r) => r.h > 1 && r.w > 1).forEach((r) => {
      const g = out[out.length - 1];
      // overlapping sections (the contact form) and slivers (the copyright bar) share a panel
      if (g && (r.top < g.bottom - 4 || r.h < 140)) {
        g.members.push(r);
        g.bottom = Math.max(g.bottom, r.top + r.h);
      } else {
        out.push({ members: [r], top: r.top, bottom: r.top + r.h });
      }
    });
    out.forEach((g) => g.members.forEach((m) => { m.dy = m.top - g.top; }));
    sections.forEach((s) => {
      if (!out.some((g) => g.members.some((m) => m.s === s))) s.style.visibility = 'hidden';
    });
    return out;
  }

  function projection() {
    vh = view.clientHeight || innerHeight;
    camera.aspect = glCam.aspect = W / vh;
    camera.fov = glCam.fov = cfg.fov;
    camera.updateProjectionMatrix();
    glCam.updateProjectionMatrix();
    F = camera.projectionMatrix.elements[5] * vh / 2;
    cam.style.width = W + 'px';
    cam.style.height = vh + 'px';
    renderer.setSize(W, vh, false);
    uni.uH.value = vh / 2;
    uni.uPx.value = renderer.getPixelRatio();
  }

  function readPose(g, y) {
    return { p: new THREE.Vector3(0, y, F).applyQuaternion(g.q).add(g.pos), q: g.q.clone() };
  }

  const bez = (a, b, c, d, t) => {
    const u = 1 - t;
    return a.clone().multiplyScalar(u * u * u)
      .addScaledVector(b, 3 * u * u * t)
      .addScaledVector(c, 3 * u * t * t)
      .addScaledVector(d, t * t * t);
  };
  function flyPose(i, t) {
    const a = groups[i], b = groups[i + 1];
    const A = readPose(a, a.yBot), B = readPose(b, b.yTop);
    const e = easeInOut(t);
    const k = cfg.G * 0.42;
    const fa = new THREE.Vector3(0, 0, -1).applyQuaternion(A.q);
    const fb = new THREE.Vector3(0, 0, -1).applyQuaternion(B.q);
    const p = bez(A.p, A.p.clone().addScaledVector(fa, k), B.p.clone().addScaledVector(fb, -k), B.p, e);
    p.addScaledVector(new THREE.Vector3(0, 1, 0).applyQuaternion(A.q), Math.sin(Math.PI * e) * cfg.arc);
    const q = new THREE.Quaternion().slerpQuaternions(A.q, B.q, e);
    const sgn = (i + 1) % 2 ? 1 : -1;
    q.multiply(new THREE.Quaternion().setFromAxisAngle(Z_AXIS, THREE.MathUtils.degToRad(-sgn * cfg.bank * Math.sin(Math.PI * e))));
    return { p, q, e };
  }

  function layout(remeasure) {
    if (remeasure || !groups.length) {
      const m = measure();
      W = m.width;
      groups = buildGroups(m.rects);
    }
    projection();
    hud = headerWrap ? headerWrap.offsetHeight : 0;
    const D = cfg.D * vh;
    groups.forEach((g, i) => {
      g.members.forEach((m) => { m.h = m.s.offsetHeight || m.h; });
      g.H = Math.max(...g.members.map((m) => m.dy + m.h));
      const pad = i === 0 ? 0 : hud;
      if (g.H + pad > vh) {
        g.yTop = g.H / 2 - vh / 2 + pad;
        g.yBot = -(g.H / 2 - vh / 2);
      } else {
        g.yTop = g.yBot = pad / 2;
      }
      g.pan = g.yTop - g.yBot;
      g.L = g.pan + D;
      g.D = D;
    });

    // stations: each panel sits ahead of where the camera finished reading the previous one
    groups.forEach((g, i) => {
      if (i === 0) {
        g.q = new THREE.Quaternion();
        g.pos = new THREE.Vector3();
      } else {
        const prev = groups[i - 1];
        const end = readPose(prev, prev.yBot);
        const sgn = i % 2 ? 1 : -1;
        g.q = end.q.clone().multiply(new THREE.Quaternion().setFromAxisAngle(Y_AXIS, THREE.MathUtils.degToRad(-sgn * cfg.yaw)));
        const start = end.p.clone().add(new THREE.Vector3(sgn * cfg.dx, cfg.dy, -cfg.G).applyQuaternion(end.q));
        g.pos = start.add(new THREE.Vector3(0, -g.yTop, -F).applyQuaternion(g.q));
      }
      g.M = new THREE.Matrix4().compose(g.pos, g.q, ONE);
      g.members.forEach((m) => {
        m.lx = m.left + m.w / 2 - W / 2;
        m.ly = g.H / 2 - (m.dy + m.h / 2);
        const mat = new THREE.Matrix4().multiplyMatrices(g.M, new THREE.Matrix4().makeTranslation(m.lx, m.ly, 0));
        m.s.style.width = m.w + 'px';
        m.s.style.transform = objectCSS(mat);
      });
    });

    segs = [];
    let s = 0;
    const T = cfg.T * vh;
    groups.forEach((g, i) => {
      segs.push({ type: 'read', g: i, a: s, b: s + g.L });
      s += g.L;
      if (i < groups.length - 1) {
        segs.push({ type: 'fly', g: i, a: s, b: s + T });
        s += T;
      }
    });
    total = s;
    spacer.style.height = Math.round(total + vh) + 'px';

    groups.forEach((g) => {
      g.op = -1;
      g.as = -1;
      if (!framed) g.members.forEach((m) => { m.s.style.visibility = 'hidden'; });
    });
    collectAssembly();
    buildWorld();
    buildHud();
  }

  function segAt(s) {
    for (const sg of segs) if (s <= sg.b) return sg;
    return segs[segs.length - 1];
  }
  function poseAt(s) {
    const sg = segAt(s);
    if (sg.type === 'read') {
      const g = groups[sg.g];
      const pan = clamp(s - sg.a - g.D / 2, 0, g.pan);
      return { ...readPose(g, g.yTop - pan), e: 0 };
    }
    return flyPose(sg.g, clamp((s - sg.a) / (sg.b - sg.a), 0, 1));
  }

  /* ---------- panel contents assemble in 3D as you arrive ---------- */
  const CARD_SEL = '.hiw__card, .svc__card, .boxes-section .box';
  function collectAssembly() {
    groups.forEach((g) => {
      const list = [];
      g.members.forEach((m) => {
        const cards = $$(CARD_SEL, m.s);
        const widgets = $$('.elementor-widget', m.s).filter((w) =>
          !w.querySelector(CARD_SEL) && !w.closest(CARD_SEL) && !w.parentElement.closest('.elementor-widget') && w.offsetHeight > 0);
        [...widgets, ...cards].forEach((el) => {
          if (getComputedStyle(el).transform !== 'none' && !el.classList.contains('fx-tilt') && !el.classList.contains('j-as')) return;
          let x = 0, y = 0;
          for (let e = el; e && e !== m.s; e = e.offsetParent) { x += e.offsetLeft; y += e.offsetTop; }
          const side = clamp((m.left + x + el.offsetWidth / 2 - W / 2) / (W / 2), -1, 1);
          el.style.setProperty('--sx', side.toFixed(2));
          list.push({ el, y: m.dy + y, x });
        });
      });
      list.sort((a, b) => a.y - b.y || a.x - b.x);
      g.targets = list.slice(0, 48).map((t, i, arr) => {
        t.el.classList.add('j-as');
        t.d = arr.length > 1 ? (i / (arr.length - 1)) * 0.45 : 0;
        t.k = -1;
        return t;
      });
    });
  }
  function applyAssembly(g, a) {
    if (Math.abs(g.as - a) < 0.0015) return;
    g.as = a;
    g.targets.forEach((t) => {
      const k = smooth(t.d, t.d + 0.55, a);
      if (Math.abs(k - t.k) < 0.002) return;
      t.k = k;
      if (k >= 0.999) {
        t.el.classList.remove('j-as-on');
      } else {
        t.el.classList.add('j-as-on');
        t.el.style.setProperty('--k', k.toFixed(3));
      }
    });
  }

  /* ---------- WebGL world ---------- */
  const world = new THREE.Group();
  scene.add(world);
  let decos = [];

  // ground of light that travels with the camera
  const floorSeg = mobile ? 110 : 170;
  const floorGeo = new THREE.PlaneGeometry(18000, 18000, floorSeg, floorSeg);
  floorGeo.rotateX(-Math.PI / 2);
  const floorStep = 18000 / floorSeg;
  const floorMat = new THREE.ShaderMaterial({
    uniforms: { ...uni, uOrigin: { value: new THREE.Vector3() }, uCam: { value: new THREE.Vector3() }, uTeal: { value: TEAL }, uMint: { value: MINT }, uDeep: { value: DEEP } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      uniform float uTime, uPx, uH;
      uniform vec3 uOrigin, uCam;
      varying float vH;
      varying float vA;
      void main() {
        vec3 p = position + uOrigin;
        float t = uTime * 0.4;
        float h = sin(p.x * 0.0017 + t) * 80.0 + sin(p.z * 0.0021 + t * 1.3) * 60.0
                + sin((p.x + p.z) * 0.0009 - t * 0.8) * 130.0 + sin(length(p.xz - uCam.xz) * 0.004 - uTime * 1.6) * 22.0;
        p.y += h;
        vH = h;
        vec4 mv = viewMatrix * vec4(p, 1.0);
        float d = length(p.xz - uCam.xz);
        vA = smoothstep(8800.0, 2500.0, d) * smoothstep(120.0, 900.0, -mv.z);
        gl_PointSize = uPx * (3.0 + max(h, 0.0) * 0.03) * (uH / -mv.z) * 2.2;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uTeal, uMint, uDeep;
      uniform float uSpeed, uCalm;
      varying float vH;
      varying float vA;
      void main() {
        float r = length(gl_PointCoord - 0.5);
        if (r > 0.5) discard;
        vec3 col = mix(uDeep, uTeal, smoothstep(-150.0, 60.0, vH));
        col = mix(col, uMint, smoothstep(90.0, 220.0, vH) * 0.7);
        float a = smoothstep(0.5, 0.0, r) * vA * mix(0.75, 0.32, uCalm) * (1.0 + uSpeed * 0.6);
        gl_FragColor = vec4(col, a);
      }`,
  });
  const floor = new THREE.Points(floorGeo, floorMat);
  floor.frustumCulled = false;
  scene.add(floor);

  function addDeco(gIndex, obj, update) {
    world.add(obj);
    decos.push({ gIndex, obj, update });
  }
  function disposeWorld() {
    world.traverse((o) => {
      o.geometry?.dispose();
      if (o.material && o.material.map !== glow) o.material.dispose?.();
    });
    world.clear();
    decos = [];
  }
  function attach(g) {
    const grp = new THREE.Group();
    grp.matrixAutoUpdate = false;
    grp.matrix.copy(g.M);
    grp.matrixWorldNeedsUpdate = true;
    return grp;
  }
  function localOf(g, el) {
    const m = g.members.find((mm) => mm.s.contains(el));
    if (!m) return null;
    let x = 0, y = 0;
    for (let e = el; e && e !== m.s; e = e.offsetParent) { x += e.offsetLeft; y += e.offsetTop; }
    return new THREE.Vector3(m.left + x + el.offsetWidth / 2 - W / 2, g.H / 2 - (m.dy + y + el.offsetHeight / 2), 0);
  }
  const sprite = (color, scale, opacity) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
    s.scale.setScalar(scale);
    s.userData.base = opacity;
    return s;
  };

  function sampleAlongPath(n, spread, fn) {
    const pos = new Float32Array(n * 3);
    const v = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      const P = poseAt(Math.random() * total - vh * 0.5);
      v.set((Math.random() - 0.5) * spread.x, (Math.random() - 0.5) * spread.y, -Math.random() * spread.z + 500).applyQuaternion(P.q).add(P.p);
      pos.set([v.x, v.y, v.z], i * 3);
      fn?.(i, v);
    }
    return pos;
  }

  function buildWorld() {
    disposeWorld();
    const big = Math.max(W, vh);

    // drifting dust along the whole route
    const dustN = mobile ? 1400 : 3200;
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(sampleAlongPath(dustN, { x: big * 4, y: big * 2.6, z: 4200 }), 3));
    const seeds = new Float32Array(dustN).map(() => Math.random());
    dustGeo.setAttribute('seed', new THREE.BufferAttribute(seeds, 1));
    const dust = new THREE.Points(dustGeo, new THREE.ShaderMaterial({
      uniforms: { ...uni, uTeal: { value: TEAL }, uMint: { value: MINT } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */`
        uniform float uTime, uPx, uH;
        attribute float seed;
        varying float vA;
        varying float vS;
        void main() {
          vec3 p = position;
          p.x += sin(uTime * 0.25 + seed * 40.0) * 30.0;
          p.y += cos(uTime * 0.2 + seed * 25.0) * 24.0;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          vS = seed;
          vA = (0.45 + 0.55 * sin(uTime * (0.8 + seed * 2.0) + seed * 60.0)) * smoothstep(9000.0, 2200.0, -mv.z) * smoothstep(60.0, 420.0, -mv.z);
          gl_PointSize = uPx * (2.0 + seed * 5.0) * (uH / -mv.z) * 2.4;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uTeal, uMint;
        uniform float uCalm;
        varying float vA;
        varying float vS;
        void main() {
          float r = length(gl_PointCoord - 0.5);
          if (r > 0.5) discard;
          gl_FragColor = vec4(mix(uTeal, uMint, vS), smoothstep(0.5, 0.0, r) * vA * mix(0.9, 0.5, uCalm));
        }`,
    }));
    dust.frustumCulled = false;
    addDeco(-1, dust);

    // speed lines that only show while flying
    const lineN = mobile ? 260 : 520;
    const linePos = sampleAlongPath(lineN, { x: big * 2.4, y: big * 1.6, z: 3600 });
    const segPos = new Float32Array(lineN * 6);
    const segEnd = new Float32Array(lineN * 2);
    for (let i = 0; i < lineN; i++) {
      segPos.set([linePos[i * 3], linePos[i * 3 + 1], linePos[i * 3 + 2], linePos[i * 3], linePos[i * 3 + 1], linePos[i * 3 + 2]], i * 6);
      segEnd.set([0, 1], i * 2);
    }
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(segPos, 3));
    lineGeo.setAttribute('aEnd', new THREE.BufferAttribute(segEnd, 1));
    const streaks = new THREE.LineSegments(lineGeo, new THREE.ShaderMaterial({
      uniforms: { ...uni, uMint: { value: MINT } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */`
        uniform vec3 uVel;
        attribute float aEnd;
        varying float vA;
        varying float vEnd;
        void main() {
          vec3 p = position - uVel * aEnd * 0.09;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          vA = smoothstep(7000.0, 1200.0, -mv.z) * smoothstep(20.0, 300.0, -mv.z);
          vEnd = aEnd;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uMint;
        uniform float uSpeed;
        varying float vA;
        varying float vEnd;
        void main() { gl_FragColor = vec4(uMint, vA * uSpeed * (1.0 - vEnd) * 0.85); }`,
    }));
    streaks.frustumCulled = false;
    addDeco(-1, streaks);

    groups.forEach((g, gi) => {
      const sec = (sel) => g.members.some((m) => m.s.querySelector(sel));
      if (gi === 0) heroCore(g, gi);
      if (sec('.hiw__card')) nodes(g, gi, $$('.hiw__card'), 'chain', '.hiw__badge');
      if (sec('.svc__card')) nodes(g, gi, $$('.svc__card'), 'net', '.svc__icon');
      if (sec('.boxes-section .box')) nodes(g, gi, $$('.boxes-section .box'), 'chain', 'span');
      if (sec('.elementor-widget-elementskit-testimonial')) stars(g, gi);
      if (sec('form')) pipeline(g, gi);
      if (sec('.elementskit-accordion, [class*="accordion"]')) shapes(g, gi);
      if (sec('[data-id="20ee614f"]')) portal(g, gi);
    });
    if (groups.length > 1) gates(1);
  }

  /* hero: morphing glass core inside a wire crystal with orbit rings */
  function heroCore(g, gi) {
    const grp = attach(g);
    const core = new THREE.Group();
    const S = mobile ? 58 : 95;
    const coreY = g.H / 2 - (mobile ? 120 : 250);
    core.scale.setScalar(S);
    core.position.set(mobile ? W * 0.18 : W * 0.3, coreY, mobile ? -1100 : -420);
    grp.add(core);
    const coreUni = { ...uni, uFade: { value: 1 }, uTeal: { value: TEAL }, uMint: { value: MINT }, uDeep: { value: DEEP } };
    const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(1.75, mobile ? 24 : 48), new THREE.ShaderMaterial({
      uniforms: coreUni,
      transparent: true,
      vertexShader: /* glsl */`
        uniform float uTime;
        varying vec3 vN; varying vec3 vV; varying float vD;
        vec3 hash(vec3 p){ p = vec3(dot(p,vec3(127.1,311.7,74.7)), dot(p,vec3(269.5,183.3,246.1)), dot(p,vec3(113.5,271.9,124.6))); return -1.0 + 2.0*fract(sin(p)*43758.5453123); }
        float noise(vec3 p){
          vec3 i = floor(p); vec3 f = fract(p); vec3 u = f*f*(3.0-2.0*f);
          return mix(mix(mix(dot(hash(i),f), dot(hash(i+vec3(1,0,0)),f-vec3(1,0,0)),u.x),
                         mix(dot(hash(i+vec3(0,1,0)),f-vec3(0,1,0)), dot(hash(i+vec3(1,1,0)),f-vec3(1,1,0)),u.x),u.y),
                     mix(mix(dot(hash(i+vec3(0,0,1)),f-vec3(0,0,1)), dot(hash(i+vec3(1,0,1)),f-vec3(1,0,1)),u.x),
                         mix(dot(hash(i+vec3(0,1,1)),f-vec3(0,1,1)), dot(hash(i+vec3(1,1,1)),f-vec3(1,1,1)),u.x),u.y),u.z);
        }
        void main() {
          float d = noise(normal * 1.6 + uTime * 0.35) * 0.32 + noise(normal * 4.0 - uTime * 0.5) * 0.06;
          vD = d;
          vec4 mv = modelViewMatrix * vec4(position + normal * d, 1.0);
          vN = normalize(normalMatrix * normal);
          vV = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uTeal, uMint, uDeep;
        uniform float uTime, uFade;
        varying vec3 vN; varying vec3 vV; varying float vD;
        void main() {
          float fres = pow(1.0 - max(dot(vN, vV), 0.0), 2.4);
          vec3 col = mix(uDeep * 0.35, uTeal, fres);
          col += uMint * smoothstep(0.1, 0.32, vD) * 0.55;
          col += vec3(0.9, 1.0, 1.0) * pow(fres, 6.0) * 0.6;
          col += uTeal * smoothstep(0.92, 1.0, sin(vD * 60.0 + uTime) * 0.5 + 0.5) * 0.25;
          gl_FragColor = vec4(col, (0.55 + fres * 0.45) * uFade);
        }`,
    }));
    core.add(orb);
    const add = (o) => { core.add(o); return o; };
    const lineMat = new THREE.LineBasicMaterial({ color: TEAL, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending });
    const crystal = add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(2.75, 1)), lineMat));
    const verts = add(new THREE.Points(new THREE.IcosahedronGeometry(2.75, 1), new THREE.PointsMaterial({ color: MINT, size: 7, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })));
    const rings = [];
    const ringMat = new THREE.MeshBasicMaterial({ color: TEAL, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false });
    [[3.7, 1.1, 0.3], [4.3, -0.6, 0.9], [5.0, 0.4, -0.7]].forEach(([r, rx, rz], i) => {
      const ring = new THREE.Group();
      ring.rotation.set(rx, 0, rz);
      ring.add(new THREE.Mesh(new THREE.TorusGeometry(r, 0.012, 6, 220), ringMat));
      const sat = sprite(MINT, 0.9 + i * 0.25, 0.95);
      sat.position.x = r;
      ring.add(sat);
      ring.userData.speed = 0.35 - i * 0.08;
      add(ring);
      rings.push(ring);
    });
    const halo = add(new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(
      new Float32Array(1100 * 3).map((_, i) => {
        const k = Math.floor(i / 3);
        const r = 3 + ((k * 7919) % 1000) / 1000 * 4.5;
        const th = k * 2.399963;
        const ph = Math.acos(1 - 2 * (((k * 104729) % 1000) / 1000));
        return [r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph) * 0.6, r * Math.sin(ph) * Math.sin(th)][i % 3];
      }), 3)), new THREE.PointsMaterial({ color: TEAL, size: 3, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false })));
    const glowS = sprite(TEAL, 9, 0.35);
    core.add(glowS);
    const mats = [lineMat, verts.material, ringMat, halo.material, glowS.material, ...rings.map((r) => r.children[1].material)];
    mats.forEach((m) => { m.userData.base ??= m.opacity; });
    addDeco(gi, grp, (dt, t, v) => {
      const vis = mobile ? v * 0.6 : v;
      coreUni.uFade.value = vis;
      mats.forEach((m) => { m.opacity = m.userData.base * vis; });
      core.rotation.y = t * 0.15 + mouse.sx * 0.6;
      core.rotation.x = mouse.sy * 0.35 + Math.sin(t * 0.3) * 0.1;
      core.position.y = coreY + Math.sin(t * 0.8) * 18;
      orb.rotation.y = t * 0.1;
      crystal.rotation.set(t * 0.12, -t * 0.18 + mouse.sx * 0.8, 0);
      verts.rotation.copy(crystal.rotation);
      halo.rotation.y = -t * 0.05;
      rings.forEach((r) => { r.rotation.y += dt * r.userData.speed; });
    });
  }

  /* glowing nodes behind cards, wired together with travelling light */
  function nodes(g, gi, els, mode, anchorSel) {
    const grp = attach(g);
    const anchors = els.map((el) => (anchorSel && el.querySelector(anchorSel)) || el);
    const pts = anchors.map((el) => localOf(g, el)).filter(Boolean);
    if (!pts.length) return;
    const z = -170;
    pts.forEach((p) => { p.z = z; });
    const node = pts.map((p) => {
      const size = mobile ? 190 : 280;
      const halo = sprite(TEAL, size, 0.42);
      const core = sprite(MINT, mobile ? 30 : 40, 0.95);
      halo.position.copy(p);
      core.position.copy(p).setZ(z + 20);
      grp.add(halo, core);
      return { halo, core };
    });
    const edges = [];
    if (mode === 'chain') {
      for (let i = 0; i < pts.length - 1; i++) edges.push([i, i + 1]);
    } else {
      const dmin = Math.min(...pts.flatMap((a, i) => pts.slice(i + 1).map((b) => a.distanceTo(b))));
      pts.forEach((a, i) => pts.forEach((b, j) => { if (j > i && a.distanceTo(b) < dmin * 1.35) edges.push([i, j]); }));
    }
    const pos = new Float32Array(edges.length * 6);
    const u = new Float32Array(edges.length * 2);
    const ph = new Float32Array(edges.length * 2);
    edges.forEach(([a, b], k) => {
      pos.set([pts[a].x, pts[a].y, z, pts[b].x, pts[b].y, z], k * 6);
      u.set([0, 1], k * 2);
      const phase = mode === 'chain' ? k / edges.length : (k * 0.37) % 1;
      ph.set([phase, phase], k * 2);
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aU', new THREE.BufferAttribute(u, 1));
    geo.setAttribute('aPh', new THREE.BufferAttribute(ph, 1));
    const lineUni = { ...uni, uVis: { value: 1 }, uChain: { value: mode === 'chain' ? edges.length : 0 }, uTeal: { value: TEAL }, uMint: { value: MINT } };
    grp.add(new THREE.LineSegments(geo, new THREE.ShaderMaterial({
      uniforms: lineUni,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */`
        attribute float aU; attribute float aPh;
        varying float vU; varying float vPh;
        void main() { vU = aU; vPh = aPh; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */`
        uniform float uTime, uVis, uChain;
        uniform vec3 uTeal, uMint;
        varying float vU; varying float vPh;
        void main() {
          // chains carry one pulse end to end; networks carry a pulse per edge
          float u = uChain > 0.0 ? (vPh + vU / uChain) : vU;
          float head = uChain > 0.0 ? fract(uTime * 0.22) : fract(uTime * 0.45 + vPh);
          float d = head - u;
          float pulse = d > 0.0 ? exp(-d * (uChain > 0.0 ? 9.0 : 5.0)) : exp(d * 140.0);
          gl_FragColor = vec4(mix(uTeal, uMint, pulse), (0.22 + pulse * 0.9) * uVis);
        }`,
    })));
    addDeco(gi, grp, (dt, t, vis) => {
      lineUni.uVis.value = vis;
      const head = fract(t * 0.22);
      node.forEach(({ halo, core }, i) => {
        // in a chain each node flares as the pulse reaches it
        const at = mode === 'chain' ? i / Math.max(1, pts.length - 1) : fract(i * 0.37 + t * 0.45);
        const flare = mode === 'chain' ? Math.exp(-Math.pow((head - at) * 7, 2)) : Math.exp(-Math.pow((at - 0.5) * 4, 2)) * 0.5;
        halo.material.opacity = (halo.userData.base + flare * 0.35) * vis;
        core.material.opacity = core.userData.base * vis;
        core.scale.setScalar((mobile ? 30 : 40) * (1 + flare * 0.8));
      });
    });
  }
  const fract = (v) => v - Math.floor(v);

  /* four gates on the way into "How It Works" — one per stage */
  function gates(gi) {
    const R = mobile ? 380 : 640;
    for (let k = 0; k < 4; k++) {
      const P = flyPose(gi - 1, 0.36 + k * 0.16);
      const grp = new THREE.Group();
      grp.position.copy(P.p);
      grp.quaternion.copy(P.q);
      const coreMat = new THREE.MeshBasicMaterial({ color: MINT, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false });
      const glowMat = new THREE.MeshBasicMaterial({ color: TEAL, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false });
      grp.add(new THREE.Mesh(new THREE.TorusGeometry(R, 1.6, 6, 180), coreMat));
      grp.add(new THREE.Mesh(new THREE.TorusGeometry(R, 16, 8, 180), glowMat));
      const sats = [];
      for (let i = 0; i < 6; i++) {
        const s = sprite(MINT, 26, 0.9);
        grp.add(s);
        sats.push(s);
      }
      const spin = k % 2 ? 1 : -1;
      addDeco('gate', grp, (dt, t, vis) => {
        const d = grp.position.distanceTo(camera.position);
        const near = smooth(4200, 600, d);
        coreMat.opacity = vis * (0.25 + near * 0.75);
        glowMat.opacity = vis * (0.05 + near * 0.15);
        sats.forEach((s, i) => {
          const a = (i / 6) * Math.PI * 2 + t * 0.4 * spin + k;
          s.position.set(Math.cos(a) * R, Math.sin(a) * R, 0);
          s.material.opacity = vis * (0.4 + near * 0.6);
        });
        grp.rotation.z = 0;
      });
    }
  }

  /* a ring of stars orbiting the testimonials */
  function stars(g, gi) {
    const grp = attach(g);
    const n = mobile ? 26 : 44;
    const pos = new Float32Array(n * 3);
    const geo = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ map: starTexture(), color: MINT, size: mobile ? 22 : 30, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
    grp.add(new THREE.Points(geo, mat));
    const rx = Math.max(W * 0.46, 260), ry = Math.max(g.H * 0.62, 260);
    addDeco(gi, grp, (dt, t, vis) => {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + t * 0.06;
        pos.set([Math.cos(a) * rx, Math.sin(a) * ry, -420 + Math.sin(a * 3 + t) * 60], i * 3);
      }
      geo.attributes.position.needsUpdate = true;
      mat.opacity = 0.75 * vis * (0.75 + 0.25 * Math.sin(t * 2));
    });
  }

  /* the patient pipeline: a tube of light you ride into the contact form */
  function pipeline(g, gi) {
    if (gi === 0) return;
    const pts = [];
    const down = mobile ? -240 : -300;
    for (let i = 0; i <= 30; i++) {
      const P = flyPose(gi - 1, i / 30);
      pts.push(new THREE.Vector3(0, down, 0).applyQuaternion(P.q).add(P.p));
    }
    const start = readPose(g, g.yTop);
    [0.45, 0.9].forEach((f) => pts.push(new THREE.Vector3(0, down, -F * f).applyQuaternion(start.q).add(start.p)));
    const curve = new THREE.CatmullRomCurve3(pts);
    const tubeUni = { ...uni, uVis: { value: 1 }, uTeal: { value: TEAL }, uMint: { value: MINT } };
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 260, mobile ? 7 : 10, 12, false), new THREE.ShaderMaterial({
      uniforms: tubeUni,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */`
        varying vec2 vUv; varying vec3 vN; varying vec3 vV;
        void main() {
          vUv = uv;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vN = normalize(normalMatrix * normal);
          vV = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */`
        uniform float uTime, uVis;
        uniform vec3 uTeal, uMint;
        varying vec2 vUv; varying vec3 vN; varying vec3 vV;
        void main() {
          float flow = smoothstep(0.7, 1.0, fract(vUv.x * 16.0 - uTime * 0.9));
          float fres = pow(1.0 - abs(dot(vN, vV)), 1.4);
          float ends = smoothstep(0.0, 0.12, vUv.x) * smoothstep(1.0, 0.94, vUv.x);
          gl_FragColor = vec4(mix(uTeal, uMint, flow), (0.1 + fres * 0.45 + flow * 0.65) * ends * uVis);
        }`,
    }));
    const plug = sprite(MINT, mobile ? 220 : 320, 0.55);
    plug.position.copy(pts[pts.length - 1]);
    const grp = new THREE.Group();
    grp.add(tube, plug);
    addDeco('pipe', grp, (dt, t, vis) => {
      tubeUni.uVis.value = vis;
      plug.material.opacity = 0.55 * vis * (0.8 + 0.2 * Math.sin(t * 3));
    });
    pipeline.g = gi;
  }

  /* floating wire forms around the FAQ */
  function shapes(g, gi) {
    const grp = attach(g);
    const geos = [new THREE.OctahedronGeometry(1, 0), new THREE.IcosahedronGeometry(1, 0), new THREE.TetrahedronGeometry(1, 0), new THREE.DodecahedronGeometry(1, 0)];
    const list = [];
    for (let i = 0; i < (mobile ? 5 : 9); i++) {
      const mat = new THREE.LineBasicMaterial({ color: i % 3 ? TEAL : MINT, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending });
      const m = new THREE.LineSegments(new THREE.EdgesGeometry(geos[i % geos.length]), mat);
      const side = i % 2 ? 1 : -1;
      m.position.set(side * (W * 0.38 + Math.random() * W * 0.14), (Math.random() - 0.5) * g.H * 1.1, -200 - Math.random() * 700);
      m.scale.setScalar((mobile ? 30 : 50) + Math.random() * (mobile ? 40 : 80));
      m.userData.spin = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
      m.userData.y = m.position.y;
      grp.add(m);
      list.push(m);
    }
    addDeco(gi, grp, (dt, t, vis) => {
      list.forEach((m, i) => {
        m.rotation.x += m.userData.spin.x * dt;
        m.rotation.y += m.userData.spin.y * dt;
        m.position.y = m.userData.y + Math.sin(t * 0.6 + i) * 20;
        m.material.opacity = 0.5 * vis;
      });
    });
  }

  /* a portal of light framing the final call to action */
  function portal(g, gi) {
    const grp = attach(g);
    const box = $$('[data-id="20ee614f"]')[0];
    const c = (box && localOf(g, box)) || new THREE.Vector3();
    const R = mobile ? Math.max(W * 0.55, 200) : Math.max(W * 0.36, 420);
    const holder = new THREE.Group();
    holder.position.set(c.x, c.y, -260);
    grp.add(holder);
    const coreMat = new THREE.MeshBasicMaterial({ color: MINT, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false });
    const glowMat = new THREE.MeshBasicMaterial({ color: TEAL, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false });
    holder.add(new THREE.Mesh(new THREE.TorusGeometry(R, 2, 6, 220), coreMat), new THREE.Mesh(new THREE.TorusGeometry(R, 22, 8, 220), glowMat));
    const n = mobile ? 700 : 1500;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = R * (0.55 + Math.pow(Math.random(), 0.6) * 1.1);
      const a = Math.random() * Math.PI * 2;
      pos.set([Math.cos(a) * r, Math.sin(a) * r, (Math.random() - 0.5) * 120], i * 3);
    }
    const vUni = { ...uni, uVis: { value: 1 }, uR: { value: R }, uTeal: { value: TEAL }, uMint: { value: MINT } };
    holder.add(new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(pos, 3)), new THREE.ShaderMaterial({
      uniforms: vUni,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */`
        uniform float uTime, uPx, uH, uR;
        varying float vA; varying float vK;
        void main() {
          float r = length(position.xy);
          float a = atan(position.y, position.x) + uTime * (0.05 + 0.35 * uR / r);
          vec3 p = vec3(cos(a) * r, sin(a) * r, position.z);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          vK = smoothstep(uR * 1.6, uR * 0.6, r);
          vA = smoothstep(uR * 1.7, uR, r) * smoothstep(uR * 0.5, uR * 0.9, r);
          gl_PointSize = uPx * 3.0 * (uH / -mv.z) * 2.0;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */`
        uniform float uVis;
        uniform vec3 uTeal, uMint;
        varying float vA; varying float vK;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;
          gl_FragColor = vec4(mix(uTeal, uMint, vK), smoothstep(0.5, 0.0, d) * vA * uVis * 0.8);
        }`,
    })));
    addDeco(gi, grp, (dt, t, vis) => {
      coreMat.opacity = 0.8 * vis;
      glowMat.opacity = 0.16 * vis;
      vUni.uVis.value = vis;
      holder.rotation.z = t * 0.05;
    });
  }

  /* ---------- HUD ---------- */
  const hudEl = make('nav', { id: 'j-hud' });
  hudEl.setAttribute('aria-label', 'Sections');
  const progress = make('div', { id: 'j-progress' });
  const hint = make('div', { id: 'j-hint' });
  hint.innerHTML = '<span class="m"><i></i></span><span>Scroll to explore</span>';
  document.body.append(hudEl, progress, hint);

  function labelFor(g, i) {
    const text = g.members.map((m) => m.s.innerText || '').join('\n');
    if (i === 0) return 'Home';
    if (g.members.some((m) => m.s.querySelector('[data-id="20ee614f"]'))) return 'Strategy Call';
    if (i === groups.length - 1) return 'Footer';
    const eyebrow = g.members.map((m) => m.s.querySelector('.elementor-icon-list-text')?.textContent.trim()).find(Boolean);
    if (eyebrow && eyebrow.length < 24) return eyebrow;
    return (text.split('\n').find((l) => l.trim().length > 2) || `Part ${i + 1}`).trim().split(/\s+/).slice(0, 3).join(' ');
  }
  function buildHud() {
    hudEl.innerHTML = '<ol>' + groups.map((g, i) => `<li><button type="button" data-g="${i}"><span class="l">${labelFor(g, i)}</span><span class="n">${String(i + 1).padStart(2, '0')}</span></button></li>`).join('') + '</ol>';
    hudEl.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => flyTo(stationScroll(+b.dataset.g))));
    activeHud = -1;
  }
  let activeHud = -1;
  const stationScroll = (gi, offset = 0) => {
    const sg = segs.find((s) => s.type === 'read' && s.g === gi);
    return sg ? sg.a + Math.min(sg.b - sg.a, groups[gi].D / 2 + offset) : 0;
  };

  /* ---------- scrolling: smoothing, snapping, flying to a station ---------- */
  let sCam = 0;
  let lockS = null;
  let auto = null;
  let lastScroll = 0;
  let dir = 1;
  let idleTimer = 0;

  function flyTo(target, ms) {
    const from = scrollY;
    const dist = Math.abs(target - from);
    if (dist < 2) return;
    auto = { from, to: target, t0: performance.now(), dur: ms || clamp(dist / vh * 420, 650, 2400) };
  }
  const cancelAuto = () => { auto = null; };
  ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach((ev) => addEventListener(ev, (e) => {
    if (ev === 'pointerdown' && e.target.closest?.('#j-hud')) return;
    cancelAuto();
  }, { passive: true }));

  addEventListener('scroll', () => {
    const y = scrollY;
    if (y !== lastScroll) dir = y > lastScroll ? 1 : -1;
    lastScroll = y;
    clearTimeout(idleTimer);
    idleTimer = setTimeout(settle, 170);
  }, { passive: true });

  // never leave the visitor stranded mid-flight: finish the trip in the direction they were going
  function settle() {
    if (auto || lockS !== null) return;
    const sg = segAt(scrollY);
    if (sg.type !== 'fly') return;
    const t = (scrollY - sg.a) / (sg.b - sg.a);
    if (t <= 0.001 || t >= 0.999) return;
    const forward = dir > 0 ? t > 0.06 : t > 0.94;
    flyTo(forward ? sg.b + 1 : sg.a - 1, clamp((forward ? 1 - t : t) * 1300, 450, 1300));
  }

  // anchors to sections fly there instead of jumping
  document.addEventListener('click', (e) => {
    const a = e.target.closest?.('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    let target = null;
    if (href === '#' || /^https?:\/\/design\.harvest\.pk\/?$/.test(href)) target = 0;
    else if (href.startsWith('#') && href.length > 1 && !href.startsWith('#collapse')) {
      const el = document.getElementById(href.slice(1));
      const gi = el ? groups.findIndex((g) => g.members.some((m) => m.s.contains(el))) : -1;
      if (gi >= 0) target = stationScroll(gi);
    }
    if (target === null) return;
    e.preventDefault();
    flyTo(target);
  });

  // keyboard focus or a form field inside a panel brings that panel to the camera
  function scrollFor(el) {
    const gi = groups.findIndex((g) => g.members.some((m) => m.s.contains(el)));
    if (gi < 0) return null;
    const g = groups[gi];
    const p = localOf(g, el);
    const fromTop = g.H / 2 - p.y;
    return stationScroll(gi, clamp(fromTop - hud - vh * 0.3, 0, g.pan));
  }
  let lastPointer = 0;
  addEventListener('pointerdown', () => { lastPointer = performance.now(); }, { passive: true });
  cam.addEventListener('focusin', (e) => {
    // a mouse click lands on something already in view; keyboard and touch focus may not be
    if (!touch && performance.now() - lastPointer < 400) return;
    const s = scrollFor(e.target);
    if (s === null) return;
    const field = e.target.matches('input, textarea, select');
    if (Math.abs(s - scrollY) > 4) flyTo(s, 600);
    if (field && touch) lockS = s;
  });
  cam.addEventListener('focusout', () => {
    if (lockS === null) return;
    const s = lockS;
    setTimeout(() => {
      if (cam.contains(document.activeElement) && document.activeElement.matches('input, textarea, select')) return;
      lockS = null;
      scrollTo({ top: s, behavior: 'instant' });
    }, 300);
  });

  /* ---------- keep the layout honest as images, fonts and accordions change size ---------- */
  let relayoutTimer = 0;
  function relayout(remeasure) {
    clearTimeout(relayoutTimer);
    relayoutTimer = setTimeout(() => {
      // keep the camera at the same place in the story
      const sg = segAt(sCam);
      const frac = (sCam - sg.a) / Math.max(1, sg.b - sg.a);
      const idx = segs.indexOf(sg);
      layout(remeasure);
      const ns = segs[Math.min(idx, segs.length - 1)];
      const s = ns.a + frac * (ns.b - ns.a);
      sCam = s;
      scrollTo({ top: s, behavior: 'instant' });
    }, remeasure ? 250 : 160);
  }
  const ro = new ResizeObserver(() => {
    if (groups.some((g) => g.members.some((m) => Math.abs(m.s.offsetHeight - m.h) > 1))) relayout(false);
  });
  sections.forEach((s) => ro.observe(s));
  let lastW = innerWidth, lastH = innerHeight;
  addEventListener('resize', () => {
    const typing = document.activeElement?.matches?.('input, textarea, select');
    const dw = innerWidth !== lastW, dh = Math.abs(innerHeight - lastH) > 150 && !typing;
    if (dw || dh) {
      lastW = innerWidth;
      lastH = innerHeight;
      relayout(true);
    } else {
      projection();
    }
  });

  /* ---------- per-frame ---------- */
  const prevP = new THREE.Vector3();
  const vel = new THREE.Vector3();
  const look = new THREE.Quaternion();
  const euler = new THREE.Euler();
  let introK = 0;
  let introT0 = 0;
  let introDone = false;
  let started = false;
  let lastCamCSS = '';
  let framed = false;
  let frameError = false;
  const clock = new THREE.Clock();

  // a single bad frame must never stop the loop (three.js stops requesting frames if one throws)
  function frame() {
    try {
      step();
      framed = true;
    } catch (err) {
      if (!frameError) console.error('[10acity 3d] frame error', err);
      frameError = true;
    }
  }

  function step() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = (uni.uTime.value += dt);
    if (auto) {
      const k = clamp((performance.now() - auto.t0) / auto.dur, 0, 1);
      scrollTo({ top: auto.from + (auto.to - auto.from) * easeInOut(k), behavior: 'instant' });
      if (k >= 1) auto = null;
    }
    const target = lockS ?? clamp(scrollY, 0, total);
    sCam += (target - sCam) * (1 - Math.exp(-dt * 7.5));
    if (Math.abs(target - sCam) < 0.05) sCam = target;
    mouse.sx += (mouse.x - mouse.sx) * 0.06;
    mouse.sy += (mouse.y - mouse.sy) * 0.06;

    if (started && !introDone) {
      introK = clamp((performance.now() - introT0) / 3200, 0, 1);
      if (introK >= 1) {
        introDone = true;
        root.classList.add('j-intro-done');
      }
    }

    // camera pose for this point of the story
    const sg = segAt(sCam);
    const P = poseAt(sCam);
    camera.position.copy(P.p);
    camera.quaternion.copy(P.q);
    let fov = cfg.fov;
    if (sg.type === 'fly') fov += cfg.warp * Math.pow(Math.sin(Math.PI * P.e), 2);
    if (introK < 1) {
      const k = easeInOut(introK);
      const inv = 1 - k;
      camera.position.add(new THREE.Vector3(-260 * inv, 420 * inv, 3400 * inv).applyQuaternion(P.q));
      camera.quaternion.multiply(look.setFromEuler(euler.set(-0.1 * inv, -0.16 * inv, 0.05 * inv)));
    }
    vel.copy(camera.position).sub(prevP).divideScalar(Math.max(dt, 0.001));
    prevP.copy(camera.position);
    if (cfg.look) camera.quaternion.multiply(look.setFromEuler(euler.set(-mouse.sy * cfg.look * 0.0105, -mouse.sx * cfg.look * 0.0175, 0)));
    if (Math.abs(camera.fov - fov) > 0.001) {
      camera.fov = glCam.fov = fov;
      camera.updateProjectionMatrix();
      glCam.updateProjectionMatrix();
    }
    camera.updateMatrixWorld();

    // DOM camera
    const Fnow = camera.projectionMatrix.elements[5] * vh / 2;
    const css = `perspective(${Fnow}px) translateZ(${Fnow}px)${cameraCSS(camera.matrixWorldInverse)}translate(${W / 2}px,${vh / 2}px)`;
    if (css !== lastCamCSS) {
      cam.style.transform = css;
      lastCamCSS = css;
    }

    // which panels are visible, assembled, and present for their 3D props
    const op = new Array(groups.length).fill(0);
    const as = new Array(groups.length).fill(1);
    const pres = new Array(groups.length).fill(0);
    let flyVis0 = 0;
    let readFrac = 0;
    if (sg.type === 'read') {
      op[sg.g] = 1;
      pres[sg.g] = 1;
      readFrac = (sCam - sg.a) / Math.max(1, sg.b - sg.a);
    } else {
      const ft = (sCam - sg.a) / (sg.b - sg.a);
      op[sg.g] = 1 - smooth(0.04, 0.3, ft);
      op[sg.g + 1] = smooth(0.22, 0.62, ft);
      as[sg.g + 1] = smooth(0.22, 1, ft);
      pres[sg.g] = 1 - smooth(0.3, 0.95, ft);
      pres[sg.g + 1] = smooth(0.05, 0.7, ft);
    }
    if (sg.type === 'fly' && sg.g === 0) flyVis0 = 1;
    else if (sg.type === 'read' && sg.g === 0) flyVis0 = smooth(0.3, 1, readFrac) * 0.7;
    else if (sg.type === 'read' && sg.g === 1) flyVis0 = (1 - smooth(0, 0.4, readFrac)) * 0.7;
    if (introK < 1) {
      op[0] *= smooth(0.04, 0.4, introK);
      as[0] = Math.min(as[0], smooth(0.2, 1, introK));
      pres[0] *= smooth(0, 0.5, introK);
    }

    groups.forEach((g, i) => {
      const o = Math.round(op[i] * 1000) / 1000;
      if (o !== g.op) {
        g.op = o;
        g.members.forEach((m) => {
          m.s.style.opacity = o;
          m.s.style.visibility = o > 0.002 ? 'visible' : 'hidden';
          m.s.classList.toggle('j-live', o > 0.9);
        });
      }
      if (o > 0) applyAssembly(g, as[i]);
    });

    // WebGL camera = DOM camera + a little mouse parallax
    glCam.position.copy(camera.position);
    glCam.quaternion.copy(camera.quaternion);
    if (!touch) {
      glCam.translateX(mouse.sx * 34);
      glCam.translateY(-mouse.sy * 22);
    }
    glCam.updateMatrixWorld();

    const speed = clamp(vel.length() / 5200, 0, 1);
    uni.uSpeed.value += (speed - uni.uSpeed.value) * 0.15;
    uni.uVel.value.copy(vel);
    uni.uCalm.value += ((sg.type === 'read' ? 1 : 0) - uni.uCalm.value) * 0.05;
    const step = floorStep;
    floorMat.uniforms.uOrigin.value.set(Math.round(camera.position.x / step) * step, camera.position.y - (mobile ? 1150 : 1500), Math.round(camera.position.z / step) * step);
    floorMat.uniforms.uCam.value.copy(camera.position);

    decos.forEach((d) => {
      let vis = 1;
      if (d.gIndex === 'gate') vis = flyVis0;
      else if (d.gIndex === 'pipe') {
        const gi = pipeline.g;
        vis = Math.max(pres[gi], sg.type === 'fly' && sg.g === gi - 1 ? 1 : 0);
      } else if (d.gIndex >= 0) vis = pres[d.gIndex];
      d.obj.visible = vis > 0.003;
      if (d.obj.visible) d.update?.(dt, t, vis);
    });

    renderer.render(scene, glCam);

    // HUD + hints
    const active = sg.type === 'read' ? sg.g : ((sCam - sg.a) / (sg.b - sg.a) < 0.5 ? sg.g : sg.g + 1);
    if (active !== activeHud) {
      activeHud = active;
      hudEl.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', i === active));
    }
    progress.style.transform = `scaleX(${total ? sCam / total : 0})`;
    hint.classList.toggle('on', introDone && scrollY < 40);
  }

  /* ---------- boot ---------- */
  layout(true);
  initTilt();
  initMagnets();
  initCursor();
  renderer.setAnimationLoop(frame);

  const bar = loader.querySelector('.j-load-bar i');
  const imgs = $$('img', cam);
  const tick = setInterval(() => {
    const done = imgs.filter((i) => i.complete).length / Math.max(1, imgs.length);
    bar.style.setProperty('--p', Math.max(0.06, done).toFixed(3));
  }, 120);
  const loaded = new Promise((r) => (document.readyState === 'complete' ? r() : addEventListener('load', r, { once: true })));
  Promise.race([Promise.all([loaded, document.fonts?.ready]), new Promise((r) => setTimeout(r, 3200))]).then(() => {
    clearInterval(tick);
    bar.style.setProperty('--p', 1);
    relayout(true);
    setTimeout(() => {
      loader.classList.add('j-done');
      started = true;
      introT0 = performance.now();
      setTimeout(() => loader.remove(), 1200);
    }, 450);
  });
  return true;
}

/* ---------- start ---------- */
try {
  if (reduced || params.has('classic') || !journey()) classic();
} catch (err) {
  console.error('[10acity 3d] journey failed, falling back to the classic page', err);
  if (!params.has('classic')) location.replace(location.pathname + '?classic=1');
  else classic();
}
