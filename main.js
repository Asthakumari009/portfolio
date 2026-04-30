// ──────────────────────────────────────────────────────────────
// 3D BACKGROUND v2 — bloom · 3D text · scroll-driven camera
// ──────────────────────────────────────────────────────────────

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

const canvas = document.getElementById('bg-canvas');
const isMobile = window.matchMedia('(max-width: 900px)').matches;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── renderer ──────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: !isMobile,
  alpha: true,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);
renderer.toneMapping = THREE.ACESFilmicToneMapping;

// ── scene + camera ────────────────────────────────────────────
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0a0a0f, 0.04);

const camera = new THREE.PerspectiveCamera(
  55, window.innerWidth / window.innerHeight, 0.1, 100
);
camera.position.set(0, 0, 8);

// ── lights ────────────────────────────────────────────────────
scene.add(new THREE.AmbientLight(0xffffff, 0.3));

const keyLight = new THREE.PointLight(0xc8ff3e, 5, 30);
keyLight.position.set(-4, 3, 6);
scene.add(keyLight);

const rimLight = new THREE.PointLight(0x7c5cff, 4, 30);
rimLight.position.set(5, -3, 4);
scene.add(rimLight);

const accentLight = new THREE.PointLight(0xff5cae, 2.5, 30);
accentLight.position.set(0, 5, -3);
scene.add(accentLight);

// ── HERO BLOB (custom shader icosahedron) ─────────────────────
const heroGeo = new THREE.IcosahedronGeometry(1.6, isMobile ? 24 : 64);

const heroUniforms = {
  uTime: { value: 0 },
  uMouse: { value: new THREE.Vector2(0, 0) },
  uScroll: { value: 0 },
  uHover: { value: 0 },
  uColorA: { value: new THREE.Color(0xc8ff3e) },
  uColorB: { value: new THREE.Color(0x7c5cff) },
  uColorC: { value: new THREE.Color(0xff5cae) },
};

const heroMat = new THREE.ShaderMaterial({
  uniforms: heroUniforms,
  transparent: true,
  vertexShader: /* glsl */`
    uniform float uTime;
    uniform vec2 uMouse;
    uniform float uScroll;
    uniform float uHover;

    varying vec3 vNormal;
    varying vec3 vPosition;
    varying float vDistort;

    vec3 mod289(vec3 x){return x - floor(x*(1.0/289.0))*289.0;}
    vec4 mod289(vec4 x){return x - floor(x*(1.0/289.0))*289.0;}
    vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
    vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314*r;}
    float snoise(vec3 v){
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i  = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;
      i = mod289(i);
      vec4 p = permute(permute(permute(
                 i.z + vec4(0.0, i1.z, i2.z, 1.0))
               + i.y + vec4(0.0, i1.y, i2.y, 1.0))
               + i.x + vec4(0.0, i1.x, i2.x, 1.0));
      float n_ = 0.142857142857;
      vec3 ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);
      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);
      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
      p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m*m;
      return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }

    void main() {
      vNormal = normal;
      vec3 pos = position;
      float t = uTime * 0.4;
      float noise  = snoise(pos * 1.4 + vec3(t, t * 0.7, -t * 0.5));
      float noise2 = snoise(pos * 2.6 + vec3(-t * 0.8, t * 0.3, t));
      float mInf = length(uMouse) * 0.3 + uHover * 0.4;
      float distort = noise * 0.35 + noise2 * 0.18 + mInf * 0.15;
      pos += normal * distort;
      vDistort = distort;
      vPosition = pos;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: /* glsl */`
    uniform vec3 uColorA;
    uniform vec3 uColorB;
    uniform vec3 uColorC;
    uniform float uTime;
    uniform float uHover;

    varying vec3 vNormal;
    varying vec3 vPosition;
    varying float vDistort;

    void main() {
      vec3 viewDir = normalize(cameraPosition - vPosition);
      float fres = pow(1.0 - max(dot(viewDir, normalize(vNormal)), 0.0), 2.5);
      float mix1 = smoothstep(-0.4, 0.4, vDistort);
      vec3 base = mix(uColorB, uColorA, mix1);
      base = mix(base, uColorC, fres * 0.4);
      float glow = fres * (1.4 + uHover * 0.6);
      vec3 color = base + glow * uColorA * 0.6;
      float coreFade = smoothstep(0.0, 1.5, length(vPosition));
      color *= 0.6 + coreFade * 0.6;
      gl_FragColor = vec4(color, 0.92);
    }
  `,
});

const heroMesh = new THREE.Mesh(heroGeo, heroMat);
heroMesh.position.set(2.4, 0.2, 0);
scene.add(heroMesh);

// wireframe halo
const halo = new THREE.Mesh(
  new THREE.IcosahedronGeometry(2.3, 1),
  new THREE.MeshBasicMaterial({ color: 0xc8ff3e, wireframe: true, transparent: true, opacity: 0.1 })
);
halo.position.copy(heroMesh.position);
scene.add(halo);

// outer ring
const ring = new THREE.Mesh(
  new THREE.TorusGeometry(2.8, 0.012, 16, 128),
  new THREE.MeshBasicMaterial({ color: 0xc8ff3e, transparent: true, opacity: 0.5 })
);
ring.rotation.x = Math.PI / 2.4;
ring.position.copy(heroMesh.position);
scene.add(ring);

// ── PARTICLE FIELD ────────────────────────────────────────────
const particleCount = isMobile ? 1000 : 2800;
const positions = new Float32Array(particleCount * 3);
const colors = new Float32Array(particleCount * 3);
const sizes = new Float32Array(particleCount);

const palette = [
  new THREE.Color(0xc8ff3e),
  new THREE.Color(0x7c5cff),
  new THREE.Color(0xff5cae),
  new THREE.Color(0xffffff),
];

for (let i = 0; i < particleCount; i++) {
  const i3 = i * 3;
  const radius = 5 + Math.random() * 18;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);

  positions[i3]     = radius * Math.sin(phi) * Math.cos(theta);
  positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
  positions[i3 + 2] = radius * Math.cos(phi) - 5;

  const c = palette[Math.floor(Math.random() * palette.length)];
  colors[i3]     = c.r;
  colors[i3 + 1] = c.g;
  colors[i3 + 2] = c.b;

  sizes[i] = Math.random() * 0.05 + 0.012;
}

const particleGeo = new THREE.BufferGeometry();
particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
particleGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

const particleMat = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  vertexColors: true,
  uniforms: { uTime: { value: 0 }, uPixelRatio: { value: renderer.getPixelRatio() } },
  vertexShader: /* glsl */`
    attribute float size;
    varying vec3 vColor;
    uniform float uTime;
    uniform float uPixelRatio;
    void main() {
      vColor = color;
      vec3 pos = position;
      pos.y += sin(uTime * 0.3 + position.x * 0.4) * 0.18;
      pos.x += cos(uTime * 0.25 + position.z * 0.3) * 0.14;
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_PointSize = size * 380.0 * uPixelRatio / -mvPosition.z;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: /* glsl */`
    varying vec3 vColor;
    void main() {
      vec2 uv = gl_PointCoord - vec2(0.5);
      float d = length(uv);
      if (d > 0.5) discard;
      float alpha = smoothstep(0.5, 0.0, d);
      gl_FragColor = vec4(vColor, alpha * 0.85);
    }
  `,
});

const particles = new THREE.Points(particleGeo, particleMat);
scene.add(particles);

// ── TORUS KNOT (parallax accent) ──────────────────────────────
const knot = new THREE.Mesh(
  new THREE.TorusKnotGeometry(0.6, 0.18, 100, 16),
  new THREE.MeshStandardMaterial({
    color: 0x7c5cff,
    metalness: 0.7,
    roughness: 0.25,
    emissive: 0x7c5cff,
    emissiveIntensity: 0.4,
    transparent: true,
    opacity: 0.6,
  })
);
knot.position.set(-3.8, -1.6, -2);
scene.add(knot);

// ── 3D TEXT (rotating background) ─────────────────────────────
let bigText = null;
const fontLoader = new FontLoader();
fontLoader.load(
  'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/helvetiker_bold.typeface.json',
  (font) => {
    const textGeo = new TextGeometry('SAAD°', {
      font,
      size: isMobile ? 1.2 : 2.2,
      height: 0.35,
      curveSegments: 12,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.025,
      bevelSegments: 4,
    });
    textGeo.center();

    const textMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.9,
      roughness: 0.18,
      emissive: 0xc8ff3e,
      emissiveIntensity: 0.05,
    });

    bigText = new THREE.Mesh(textGeo, textMat);
    bigText.position.set(0, -2.5, -6);
    scene.add(bigText);
  },
  undefined,
  () => { /* font load failure — silently skip */ }
);

// ── POST PROCESSING (bloom) ───────────────────────────────────
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  isMobile ? 0.55 : 0.85,   // strength
  0.7,                       // radius
  0.18                       // threshold
);
composer.addPass(bloomPass);
composer.addPass(new OutputPass());

// ── INTERACTION STATE ─────────────────────────────────────────
const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
const scroll = { y: 0, ty: 0, vel: 0 };

window.addEventListener('mousemove', (e) => {
  mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.ty = -(e.clientY / window.innerHeight) * 2 + 1;
});

window.addEventListener('touchmove', (e) => {
  if (!e.touches[0]) return;
  mouse.tx = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
  mouse.ty = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
}, { passive: true });

window.addEventListener('scroll', () => {
  const max = Math.max(1, document.body.scrollHeight - window.innerHeight);
  scroll.ty = window.scrollY / max;
}, { passive: true });

// expose hover state for hero blob (set from app.js when CTAs hovered)
window.__bloblHover = (v) => { heroUniforms.uHover.value = v ? 1 : 0; };

window.addEventListener('resize', onResize);
function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
}

// ── RENDER LOOP ───────────────────────────────────────────────
const clock = new THREE.Clock();
let prevScroll = 0;

function tick() {
  const t = clock.getElapsedTime();

  mouse.x += (mouse.tx - mouse.x) * 0.06;
  mouse.y += (mouse.ty - mouse.y) * 0.06;
  scroll.y += (scroll.ty - scroll.y) * 0.08;
  scroll.vel = Math.abs(scroll.y - prevScroll) * 80;
  prevScroll = scroll.y;

  // hero blob
  heroUniforms.uTime.value = t;
  heroUniforms.uMouse.value.set(mouse.x, mouse.y);
  heroUniforms.uScroll.value = scroll.y;
  heroMesh.rotation.x = t * 0.12 + mouse.y * 0.3;
  heroMesh.rotation.y = t * 0.18 + mouse.x * 0.4;
  heroMesh.position.y = 0.2 + Math.sin(t * 0.6) * 0.12 - scroll.y * 4;

  halo.rotation.x = -t * 0.1;
  halo.rotation.y = -t * 0.15;
  halo.position.copy(heroMesh.position);

  ring.rotation.z = t * 0.4;
  ring.position.copy(heroMesh.position);

  // particles drift
  particleMat.uniforms.uTime.value = t;
  particles.rotation.y = t * 0.04 + mouse.x * 0.1;
  particles.rotation.x = mouse.y * 0.08 + scroll.y * 0.4;

  // knot
  knot.rotation.x = t * 0.4;
  knot.rotation.y = t * 0.3;
  knot.position.x = -3.8 + Math.sin(t * 0.4) * 0.3;
  knot.position.y = -1.6 + Math.cos(t * 0.5) * 0.2 - scroll.y * 6;

  // 3D text follows scroll
  if (bigText) {
    bigText.rotation.y = t * 0.15 + scroll.y * Math.PI * 1.2;
    bigText.rotation.x = Math.sin(t * 0.2) * 0.15 + scroll.y * 0.5;
    bigText.position.y = -2.5 + scroll.y * 12 - 8;
    bigText.position.z = -6 - scroll.y * 4;
  }

  // camera flies forward + parallax with mouse
  camera.position.x += (mouse.x * 0.6 - camera.position.x) * 0.04;
  camera.position.y += (mouse.y * 0.4 + scroll.y * 1.5 - camera.position.y) * 0.04;
  camera.position.z = 8 - scroll.y * 4;
  camera.rotation.z = mouse.x * 0.02 + scroll.vel * 0.1;
  camera.lookAt(0, scroll.y * 2, -scroll.y * 2);

  // bloom strength reacts to scroll velocity
  bloomPass.strength = (isMobile ? 0.55 : 0.85) + scroll.vel * 0.4;

  if (!reduceMotion) composer.render();
  requestAnimationFrame(tick);
}

composer.render();
requestAnimationFrame(tick);

// pause on hidden tab
document.addEventListener('visibilitychange', () => {
  if (document.hidden) clock.stop();
  else clock.start();
});

// signal scene-ready to app.js
window.dispatchEvent(new CustomEvent('scene:ready'));
