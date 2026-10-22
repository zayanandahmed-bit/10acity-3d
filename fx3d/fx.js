// 10ACITY 3D layer — WebGL backdrop + 3D interactions layered on the original page.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const touch = matchMedia('(hover: none)').matches;
const mobile = innerWidth < 768;

const TEAL = new THREE.Color('#1aafa7');
const MINT = new THREE.Color('#6ee7b7');
const DEEP = new THREE.Color('#0d5f5a');

const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
let scrollP = 0;   // 0..1 whole page
let heroP = 0;     // 0..1 through the first viewport

/* =====================================================================
   WebGL scene
   ===================================================================== */
function initScene() {
  const canvas = document.createElement('canvas');
  canvas.id = 'fx-canvas';
  document.body.prepend(canvas);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !mobile, powerPreference: 'high-performance' });
  } catch (e) {
    canvas.remove();
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 1.75));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a0a0a, 0.028);
  const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 300);
  const rig = new THREE.Group();
  rig.add(camera);
  scene.add(rig);
  camera.position.set(0, 1.5, 14);

  const uni = {
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2() },
    uScroll: { value: 0 },
    uHero: { value: 0 },
    uTeal: { value: TEAL },
    uMint: { value: MINT },
    uDeep: { value: DEEP },
    uPx: { value: renderer.getPixelRatio() },
  };

  /* ---- growth field: undulating particle terrain that travels with the camera ---- */
  const seg = mobile ? 110 : 180;
  const fieldGeo = new THREE.PlaneGeometry(110, 110, seg, seg);
  fieldGeo.rotateX(-Math.PI / 2);
  const field = new THREE.Points(fieldGeo, new THREE.ShaderMaterial({
    uniforms: uni,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      uniform float uTime, uScroll, uPx;
      uniform vec2 uMouse;
      varying float vH;
      varying float vFade;
      void main() {
        vec3 p = position;
        float t = uTime * 0.45;
        float h = sin(p.x * 0.18 + t) * 0.9
                + sin(p.z * 0.22 + t * 1.3) * 0.7
                + sin((p.x + p.z) * 0.09 - t * 0.8) * 1.4
                + sin(length(p.xz) * 0.35 - t * 2.0) * 0.25;
        // ripple pushed by the mouse
        vec2 m = vec2(uMouse.x * 26.0, -uMouse.y * 14.0 - 6.0);
        float d = distance(p.xz, m);
        h += exp(-d * 0.16) * 2.6 * sin(d * 0.9 - uTime * 3.0);
        h *= 1.0 + uScroll * 0.35;
        p.y += h;
        vH = h;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vFade = smoothstep(95.0, 12.0, -mv.z) * smoothstep(0.0, 6.0, -mv.z);
        gl_PointSize = uPx * (2.2 + max(h, 0.0) * 0.9) * (26.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uTeal, uMint, uDeep;
      uniform float uScroll, uHero;
      varying float vH;
      varying float vFade;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float r = length(c);
        if (r > 0.5) discard;
        float a = smoothstep(0.5, 0.0, r);
        vec3 col = mix(uDeep, uTeal, smoothstep(-2.5, 1.0, vH));
        col = mix(col, uMint, smoothstep(1.2, 3.4, vH) * 0.6);
        gl_FragColor = vec4(col, a * vFade * mix(0.72, 0.22, uHero));
      }`,
  }));
  field.position.set(0, -7.5, -18);
  rig.add(field);

  /* ---- hero core: morphing glass orb, wire crystal, orbit rings ---- */
  const core = new THREE.Group();
  scene.add(core);

  const orbMat = new THREE.ShaderMaterial({
    uniforms: uni,
    transparent: true,
    vertexShader: /* glsl */`
      uniform float uTime;
      varying vec3 vN;
      varying vec3 vV;
      varying float vD;
      // cheap 3D noise
      vec3 hash(vec3 p){ p = vec3(dot(p,vec3(127.1,311.7,74.7)), dot(p,vec3(269.5,183.3,246.1)), dot(p,vec3(113.5,271.9,124.6))); return -1.0 + 2.0*fract(sin(p)*43758.5453123); }
      float noise(vec3 p){
        vec3 i = floor(p); vec3 f = fract(p); vec3 u = f*f*(3.0-2.0*f);
        return mix(mix(mix(dot(hash(i+vec3(0,0,0)),f-vec3(0,0,0)), dot(hash(i+vec3(1,0,0)),f-vec3(1,0,0)),u.x),
                       mix(dot(hash(i+vec3(0,1,0)),f-vec3(0,1,0)), dot(hash(i+vec3(1,1,0)),f-vec3(1,1,0)),u.x),u.y),
                   mix(mix(dot(hash(i+vec3(0,0,1)),f-vec3(0,0,1)), dot(hash(i+vec3(1,0,1)),f-vec3(1,0,1)),u.x),
                       mix(dot(hash(i+vec3(0,1,1)),f-vec3(0,1,1)), dot(hash(i+vec3(1,1,1)),f-vec3(1,1,1)),u.x),u.y),u.z);
      }
      void main() {
        float d = noise(normal * 1.6 + uTime * 0.35) * 0.32 + noise(normal * 4.0 - uTime * 0.5) * 0.06;
        vec3 p = position + normal * d;
        vD = d;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vN = normalize(normalMatrix * normal);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uTeal, uMint, uDeep;
      uniform float uTime, uFade;
      varying vec3 vN;
      varying vec3 vV;
      varying float vD;
      void main() {
        float fres = pow(1.0 - max(dot(vN, vV), 0.0), 2.4);
        vec3 col = mix(uDeep * 0.35, uTeal, fres);
        col += uMint * smoothstep(0.1, 0.32, vD) * 0.55;
        col += vec3(0.9, 1.0, 1.0) * pow(fres, 6.0) * 0.6;
        float bands = smoothstep(0.92, 1.0, sin(vD * 60.0 + uTime) * 0.5 + 0.5) * 0.25;
        gl_FragColor = vec4(col + uTeal * bands, (0.55 + fres * 0.45) * uFade);
      }`,
  });
  const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(1.75, mobile ? 24 : 48), orbMat);
  core.add(orb);

  const crystal = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(2.75, 1)),
    new THREE.LineBasicMaterial({ color: TEAL, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending })
  );
  core.add(crystal);

  const vertsGeo = new THREE.IcosahedronGeometry(2.75, 1);
  const verts = new THREE.Points(vertsGeo, new THREE.PointsMaterial({
    color: MINT, size: 0.12, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  core.add(verts);

  const rings = [];
  const ringMat = new THREE.MeshBasicMaterial({ color: TEAL, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending });
  const satMat = new THREE.MeshBasicMaterial({ color: MINT });
  [[3.7, 1.1, 0.3], [4.3, -0.6, 0.9], [5.0, 0.4, -0.7]].forEach(([r, rx, rz], i) => {
    const g = new THREE.Group();
    g.rotation.set(rx, 0, rz);
    g.add(new THREE.Mesh(new THREE.TorusGeometry(r, 0.012, 6, 220), ringMat));
    const sat = new THREE.Mesh(new THREE.SphereGeometry(0.09 + i * 0.03, 16, 16), satMat);
    sat.position.x = r;
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.28 + i * 0.05, 16, 16),
      new THREE.MeshBasicMaterial({ color: TEAL, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending }));
    sat.add(glow);
    g.add(sat);
    g.userData.speed = 0.35 - i * 0.08;
    core.add(g);
    rings.push(g);
  });

  // halo particles around the core
  const haloN = mobile ? 500 : 1100;
  const haloPos = new Float32Array(haloN * 3);
  for (let i = 0; i < haloN; i++) {
    const r = 3 + Math.random() * 4.5;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    haloPos.set([r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph) * 0.6, r * Math.sin(ph) * Math.sin(th)], i * 3);
  }
  const haloGeo = new THREE.BufferGeometry();
  haloGeo.setAttribute('position', new THREE.BufferAttribute(haloPos, 3));
  const halo = new THREE.Points(haloGeo, new THREE.PointsMaterial({
    color: TEAL, size: 0.05, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  core.add(halo);

  // materials faded out together as the hero scrolls away (the orb fades via its own alpha)
  const coreMats = new Set();
  core.traverse((o) => { if (o.material && o.material !== orbMat) coreMats.add(o.material); });
  coreMats.forEach((m) => { m.userData.base = m.opacity; });
  uni.uFade = { value: 1 };

  /* ---- depth dust: a long column the camera descends through on scroll ---- */
  const DEPTH = 90;
  const dustN = mobile ? 900 : 2200;
  const dustPos = new Float32Array(dustN * 3);
  const dustSeed = new Float32Array(dustN);
  for (let i = 0; i < dustN; i++) {
    dustPos.set([(Math.random() - 0.5) * 60, 8 - Math.random() * (DEPTH + 20), -Math.random() * 40 + 6], i * 3);
    dustSeed[i] = Math.random();
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  dustGeo.setAttribute('seed', new THREE.BufferAttribute(dustSeed, 1));
  const dust = new THREE.Points(dustGeo, new THREE.ShaderMaterial({
    uniforms: uni,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      uniform float uTime, uPx;
      attribute float seed;
      varying float vTw;
      void main() {
        vec3 p = position;
        p.x += sin(uTime * 0.2 + seed * 40.0) * 0.6;
        p.y += cos(uTime * 0.15 + seed * 25.0) * 0.4;
        vTw = 0.4 + 0.6 * sin(uTime * (1.0 + seed * 2.0) + seed * 60.0) * 0.5 + 0.3;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = uPx * (1.0 + seed * 2.4) * (22.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uTeal, uMint;
      varying float vTw;
      void main() {
        float r = length(gl_PointCoord - 0.5);
        if (r > 0.5) discard;
        gl_FragColor = vec4(mix(uTeal, uMint, vTw), smoothstep(0.5, 0.0, r) * vTw * 0.8);
      }`,
  }));
  scene.add(dust);

  /* ---- floating wire shapes scattered down the page for depth ---- */
  const shapes = [];
  const shapeGeos = [
    new THREE.OctahedronGeometry(1.2, 0),
    new THREE.TorusGeometry(1.1, 0.02, 6, 80),
    new THREE.TetrahedronGeometry(1.2, 0),
    new THREE.IcosahedronGeometry(1.1, 0),
  ];
  for (let i = 0; i < (mobile ? 6 : 12); i++) {
    const geo = shapeGeos[i % shapeGeos.length];
    const m = geo.type === 'TorusGeometry'
      ? new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: TEAL, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending }))
      : new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: i % 3 ? TEAL : MINT, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending }));
    const side = i % 2 ? 1 : -1;
    m.position.set(side * (11 + Math.random() * 8), -6 - i * (DEPTH / 12) - Math.random() * 3, -6 - Math.random() * 10);
    m.scale.setScalar(0.6 + Math.random() * 1.1);
    m.userData.spin = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(0.6);
    m.userData.baseY = m.position.y;
    scene.add(m);
    shapes.push(m);
  }

  /* ---- layout ---- */
  let coreBase = new THREE.Vector3();
  function layout() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    uni.uPx.value = renderer.getPixelRatio();
    // keep the core to the right of the headline on wide screens, centred & smaller on narrow
    const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    const halfW = halfH * camera.aspect;
    if (camera.aspect > 1.1) {
      coreBase.set(halfW * 0.56, halfH * 0.22 + 1.5, 0);
      core.scale.setScalar(Math.min(1.15, 0.75 + camera.aspect * 0.2));
    } else {
      coreBase.set(0, halfH * 0.42 + 1.5, -4);
      core.scale.setScalar(0.62);
    }
  }
  layout();
  addEventListener('resize', layout);

  /* ---- loop ---- */
  const clock = new THREE.Clock();
  let visible = true;
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; if (visible) clock.getDelta(); });

  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = (uni.uTime.value += dt);
    mouse.sx += (mouse.x - mouse.sx) * 0.05;
    mouse.sy += (mouse.y - mouse.sy) * 0.05;
    uni.uMouse.value.set(mouse.sx, mouse.sy);
    uni.uScroll.value += (scrollP - uni.uScroll.value) * 0.08;
    uni.uHero.value += (Math.min(1, heroP * 1.4) - uni.uHero.value) * 0.08;

    // camera descends through the dust column as the page scrolls
    const targetY = -uni.uScroll.value * DEPTH;
    rig.position.y += (targetY - rig.position.y) * 0.08;
    camera.position.x = mouse.sx * 1.4;
    camera.position.y = 1.5 - mouse.sy * 0.9;
    camera.lookAt(rig.position.x, rig.position.y + 0.5, -6);
    field.rotation.y = t * 0.02;

    // hero core floats, follows the mouse and lifts away as the hero scrolls out
    core.position.set(coreBase.x, coreBase.y + heroP * 9 + Math.sin(t * 0.8) * 0.25, coreBase.z - heroP * 6);
    core.rotation.y = t * 0.15 + mouse.sx * 0.6;
    core.rotation.x = mouse.sy * 0.35 + Math.sin(t * 0.3) * 0.1;
    orb.rotation.y = t * 0.1;
    crystal.rotation.set(t * 0.12, -t * 0.18 + mouse.sx * 0.8, 0);
    verts.rotation.copy(crystal.rotation);
    halo.rotation.y = -t * 0.05;
    rings.forEach((g) => { g.rotation.y += dt * g.userData.speed; });
    const fade = 1 - Math.min(1, heroP * 1.2);
    core.visible = fade > 0.01;
    uni.uFade.value = fade;
    coreMats.forEach((m) => { m.opacity = m.userData.base * fade; });

    shapes.forEach((m, i) => {
      m.rotation.x += m.userData.spin.x * dt;
      m.rotation.y += m.userData.spin.y * dt;
      m.rotation.z += m.userData.spin.z * dt;
      m.position.y = m.userData.baseY + Math.sin(t * 0.5 + i) * 0.6;
    });

    renderer.render(scene, camera);
  }

  if (reduced) {
    frame();
  } else {
    renderer.setAnimationLoop(() => { if (visible) frame(); });
  }
  requestAnimationFrame(() => canvas.classList.add('fx-ready'));
}

/* =====================================================================
   DOM 3D interactions
   ===================================================================== */
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

function givePerspective(el, px = 1400) {
  const p = el.parentElement;
  if (p && getComputedStyle(p).perspective === 'none') p.style.perspective = px + 'px';
}

function initTilt() {
  const cards = $$([
    '.hiw__card',
    '.svc__card',
    '.boxes-section .box',
    '[data-id="11a72051"]',
    '[data-id="35beb80f"]',
    '.elementor-widget-elementskit-testimonial',
    '[data-id="46a3f1bf"]',
    '[data-id="20ee614f"]',
  ].join(','));
  const depthy = new Set($$('.hiw__card, .svc__card, .boxes-section .box'));
  cards.forEach((el) => {
    givePerspective(el);
    el.classList.add('fx-tilt');
    if (depthy.has(el)) el.classList.add('fx-depth');
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    const glare = document.createElement('span');
    glare.className = 'fx-glare';
    glare.setAttribute('aria-hidden', 'true');
    el.appendChild(glare);
    if (reduced || touch) return;
    const big = el.offsetWidth > 600;
    const maxDeg = big ? 5 : 12;
    el.addEventListener('pointerenter', () => el.classList.add('fx-hover'));
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
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

function initReveal() {
  if (reduced) return;
  const groups = [
    '.hiw__card',
    '.svc__card',
    '.boxes-section .box',
    '[data-id="11a72051"], [data-id="35beb80f"]',
    '.elementor-widget-elementskit-testimonial',
    '[data-id="46a3f1bf"]',
    '[data-id="20ee614f"]',
  ];
  const pending = [];
  const check = () => {
    for (let i = pending.length - 1; i >= 0; i--) {
      // the bounding box includes the 90px reveal offset, so this fires just as the card nears view
      if (pending[i].getBoundingClientRect().top < innerHeight * 0.92) {
        pending[i].classList.add('fx-in');
        pending.splice(i, 1);
      }
    }
    if (!pending.length) removeEventListener('scroll', check);
  };
  groups.forEach((sel) => {
    $$(sel).forEach((el, i) => {
      // already on screen at load: don't hide it
      if (el.getBoundingClientRect().top < innerHeight * 0.9) return;
      givePerspective(el);
      el.classList.add('fx-reveal');
      el.style.setProperty('--fx-d', (i % 4) * 0.12 + 's');
      pending.push(el);
    });
  });
  addEventListener('scroll', check, { passive: true });
  addEventListener('resize', check);
  check();
}

function initHero() {
  const text = document.querySelector('[data-id="7e98ecec"]');
  if (!text) return;
  givePerspective(text, 1000);
  text.classList.add('fx-hero-text');
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
  const ring = document.createElement('div');
  const dot = document.createElement('div');
  ring.className = 'fx-cursor';
  dot.className = 'fx-dot';
  document.body.append(ring, dot);
  let x = -100, y = -100, rx = -100, ry = -100;
  addEventListener('pointermove', (e) => {
    x = e.clientX; y = e.clientY;
    document.body.classList.add('fx-has-cursor');
    ring.classList.toggle('fx-big', !!e.target.closest?.('a, button, input, textarea, select, .fx-tilt'));
  }, { passive: true });
  document.addEventListener('pointerleave', () => document.body.classList.remove('fx-has-cursor'));
  (function loop() {
    rx += (x - rx) * 0.18;
    ry += (y - ry) * 0.18;
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
    dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    requestAnimationFrame(loop);
  })();
}

function initProgress() {
  const bar = document.createElement('div');
  bar.className = 'fx-progress';
  document.body.appendChild(bar);
  return bar;
}

/* ---- global input ---- */
function boot() {
  const bar = initProgress();
  const heroText = () => document.querySelector('.fx-hero-text');
  const h1 = () => document.querySelector('.fx-hero-text h1');

  function onScroll() {
    const max = document.documentElement.scrollHeight - innerHeight;
    scrollP = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    heroP = Math.min(1, scrollY / innerHeight);
    bar.style.transform = `scaleX(${scrollP})`;
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  if (!reduced && !touch) {
    addEventListener('pointermove', (e) => {
      mouse.x = (e.clientX / innerWidth) * 2 - 1;
      mouse.y = (e.clientY / innerHeight) * 2 - 1;
      const ht = heroText();
      if (ht && scrollY < innerHeight) {
        ht.style.setProperty('--hy', (mouse.x * 7).toFixed(2) + 'deg');
        ht.style.setProperty('--hx', (-mouse.y * 5).toFixed(2) + 'deg');
        const el = h1();
        el.style.setProperty('--sx', (-mouse.x * 2).toFixed(2));
        el.style.setProperty('--sy', (-mouse.y * 2 + 1).toFixed(2));
      }
    }, { passive: true });
  }

  initHero();
  initTilt();
  initReveal();
  initMagnets();
  initCursor();
  initScene();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
