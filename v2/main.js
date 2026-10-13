// Camera, scroll storytelling, mood lighting and bloom for the isometric Smaller Gods.
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";
import { buildWorld, ISL, C } from "./world.js";

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const host = document.getElementById("world");
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 800 ? 1.5 : 2));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
host.appendChild(renderer.domElement);
const labels = new CSS2DRenderer(); labels.domElement.className = "labels"; host.appendChild(labels.domElement);

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -200, 400);

// ---------- sky: a gradient dome with stars ----------
const skyU = { top: { value: new THREE.Color() }, mid: { value: new THREE.Color() }, bot: { value: new THREE.Color() }, stars: { value: 0 }, t: { value: 0 } };
const sky = new THREE.Mesh(new THREE.SphereGeometry(150, 32, 16), new THREE.ShaderMaterial({
  uniforms: skyU, side: THREE.BackSide, depthWrite: false,
  vertexShader: `varying vec3 vP; void main(){ vP=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `varying vec3 vP; uniform vec3 top,mid,bot; uniform float stars,t;
    float h(vec3 p){ return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453); }
    void main(){ float y=vP.y*.5+.5; vec3 c=mix(bot,mid,smoothstep(.15,.5,y)); c=mix(c,top,smoothstep(.5,.95,y));
      vec3 q=floor(vP*260.); float s=step(.9965,h(q))*stars*smoothstep(.35,.8,y)*(.6+.4*sin(t*2.+h(q)*30.)); c+=vec3(s);
      gl_FragColor=vec4(c,1.);
      #include <colorspace_fragment>
    }`
}));
scene.add(sky);

const hemi = new THREE.HemisphereLight(0xffffff, 0x333333, 1.2); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 2); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 80 }); sun.shadow.bias = -.0008;
scene.add(sun, sun.target);
scene.fog = new THREE.Fog(0x000000, 60, 160);

const W = buildWorld(scene);
window.__W = W; // handy in the console

// ---------- moods ----------
const MOOD = {
  dusk:  { sky: ["#f2a65a", "#7a3560", "#1b1336"], sun: "#ffc58a", si: 2.4, hs: "#c7a6ff", hg: "#3a2a20", hi: 1.1, bloom: .85, stars: .3, exp: 1.05 },
  ember: { sky: ["#e0763a", "#4b1f3a", "#120a14"], sun: "#ff9a5a", si: 1.6, hs: "#a07090", hg: "#20141a", hi: .8, bloom: 1.1, stars: .5, exp: 1.0 },
  night: { sky: ["#4a3a8b", "#18123a", "#05040f"], sun: "#9fb2ff", si: 1.0, hs: "#6c7cd0", hg: "#1a1530", hi: .7, bloom: .85, stars: 1, exp: .95 },
  gold:  { sky: ["#ffe2a0", "#d0708a", "#2a1a3a"], sun: "#ffe7b8", si: 2.8, hs: "#ffd9b0", hg: "#4a3020", hi: 1.25, bloom: .8, stars: 0, exp: 1.1 },
  dawn:  { sky: ["#fff0c8", "#f0a080", "#35406a"], sun: "#fff4dc", si: 2.8, hs: "#d8e8ff", hg: "#4a3a30", hi: 1.3, bloom: .7, stars: 0, exp: 1.12 },
  red:   { sky: ["#d0402a", "#4a0b16", "#0b0205"], sun: "#ff5a3a", si: 1.7, hs: "#a04040", hg: "#200808", hi: .7, bloom: 1.3, stars: .4, exp: 1.0 },
};
const col = s => new THREE.Color(s);

// ---------- keyframes, one per section ----------
const V = (x, y, z) => new THREE.Vector3(x, y, z), up = (i, dx = 0, dy = 0, dz = 0) => ISL[i].clone().add(V(dx, dy, dz));
const TOWER = V(1, 14, -1);
const KEYS = {
  prologue: { target: V(1, 15, -1), zoom: .74, az: .8, el: .62, mood: "dusk", show: ["labels"] },
  board:    { target: up(0, 1.6, .9, .5), zoom: 2.4, az: .55, el: .55, mood: "dusk", show: ["board"] },
  score:    { target: up(0, 1.1, 1.0, 1.6), zoom: 5.6, az: .9, el: .4, mood: "dusk", show: ["board", "scale"] },
  threshold:{ target: up(0, -1.3, .8, 3.0), zoom: 4.6, az: .3, el: .5, mood: "dusk", show: ["board", "gate"] },
  reading:  { target: up(0, 2.6, 1.6, 1.4), zoom: 5.0, az: 1.0, el: .26, mood: "dusk", show: ["board", "read"] },
  tower:    { target: V(1, 15, -1), zoom: .78, az: 1.1, el: .5, mood: "dusk", show: ["labels"] },
  flame:    { target: V(.5, 7, 3), zoom: 1.15, az: 2.0, el: .42, mood: "ember", show: ["stair"] },
  crown:    { target: up(1, -.4, 1.1, 0), zoom: 2.3, az: .45, el: .4, mood: "ember", show: ["crown"] },
  fire:     { target: up(2, .2, 1, .2), zoom: 1.9, az: .9, el: .55, mood: "night", show: ["fire"] },
  watcher:  { target: up(2, -2.4, 4.2, 2), zoom: 2.3, az: 1.2, el: .22, mood: "night", show: ["watch"] },
  moral:    { target: V(1, 15, -1), zoom: .74, az: 2.6, el: .55, mood: "gold", show: ["fire", "watch", "labels"] },
  choice:   { target: V(1, 15, -1), zoom: .72, az: 3.2, el: .5, mood: "dusk", show: ["labels"] },
  glass:    { target: up(1, -1.6, 1, -1.6), zoom: 2.2, az: .7, el: .5, mood: "dawn", show: ["glass", "beams"] },
  ledger:   { target: V(1, 15, -1), zoom: .74, az: 1.6, el: .5, mood: "dawn", show: ["beams", "glass", "fire"] },
  carried:  { target: V(-1, 11, 1), zoom: .85, az: 2.4, el: .42, mood: "gold", show: ["beams", "lifts", "watch", "fire"] },
  race:     { target: up(1, 0, 1, 0), zoom: 1.3, az: .9, el: .55, mood: "red", show: ["race"] },
  copy:     { target: up(1, -4.5, -.5, -3.5), zoom: 1.25, az: .55, el: .38, mood: "red", show: ["copy", "race"] },
  taken:    { target: V(1, 12, -1), zoom: .78, az: 1.2, el: .5, mood: "red", show: ["taken", "copy"], dark: true },
  after:    { target: V(1, 15, -1), zoom: .7, az: 4, el: .55, mood: "dusk", show: ["labels"] },
};

// ---------- scroll: blend between the keyframes of the two sections around the viewport centre ----------
const sections = () => [...document.querySelectorAll("section[data-key]")].filter(s => !s.closest("[hidden]"));
// ?at=<key> pins the camera to one keyframe and hides the cards, for screenshots and testing.
const AT = new URLSearchParams(location.search).get("at");
if (AT && KEYS[AT]) document.documentElement.classList.add("shot");
function scrollState() {
  if (AT && KEYS[AT]) return { A: KEYS[AT], B: KEYS[AT], k: 0 };
  const list = sections(), mid = innerHeight * .5;
  let a = list[0], b = list[0], k = 0;
  for (let i = 0; i < list.length; i++) {
    const r = list[i].getBoundingClientRect();
    if (r.top <= mid) { a = list[i]; b = list[i + 1] || list[i]; k = Math.min(1, Math.max(0, (mid - r.top) / Math.max(1, r.height))); }
  }
  // hold on each keyframe for most of its section, then travel
  const e = k < .55 ? 0 : (k - .55) / .45, ease = e * e * (3 - 2 * e);
  return { A: KEYS[a.dataset.key], B: KEYS[b.dataset.key], k: ease, keyA: a.dataset.key, keyB: b.dataset.key };
}

const cur = { target: TOWER.clone(), zoom: .5, az: .8, el: .6, mood: { ...MOOD.dusk }, init: false };
const presence = W.presence;
let mx = 0, my = 0, tmx = 0, tmy = 0;
addEventListener("pointermove", e => { tmx = e.clientX / innerWidth - .5; tmy = e.clientY / innerHeight - .5; }, { passive: true });

function resize() {
  const w = innerWidth, h = innerHeight; renderer.setSize(w, h); labels.setSize(w, h); composer.setSize(w, h); bloom.setSize(w, h);
  const a = w / h, half = 12; camera.left = -half * a; camera.right = half * a; camera.top = half; camera.bottom = -half; camera.updateProjectionMatrix();
}
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), .9, .55, .82);
composer.addPass(bloom); composer.addPass(new OutputPass());
addEventListener("resize", resize); resize();

const tmpC = new THREE.Color();
function lerpMood(A, B, k) {
  const m = {};
  for (const key of Object.keys(A)) {
    if (Array.isArray(A[key])) m[key] = A[key].map((c, i) => tmpC.copy(col(c)).lerp(col(B[key][i]), k).getStyle());
    else if (typeof A[key] === "string") m[key] = tmpC.copy(col(A[key])).lerp(col(B[key]), k).getStyle();
    else m[key] = A[key] + (B[key] - A[key]) * k;
  }
  return m;
}

const clock = new THREE.Clock();
function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), .05), t = reduce ? 0 : clock.elapsedTime;
  const S = scrollState();
  const goal = {
    target: S.A.target.clone().lerp(S.B.target, S.k),
    zoom: S.A.zoom + (S.B.zoom - S.A.zoom) * S.k,
    az: S.A.az + (S.B.az - S.A.az) * S.k,
    el: S.A.el + (S.B.el - S.A.el) * S.k,
    mood: lerpMood(MOOD[S.A.mood], MOOD[S.B.mood], S.k),
  };
  const f = cur.init ? 1 - Math.pow(.02, dt) : 1; cur.init = true;
  cur.target.lerp(goal.target, f); cur.zoom += (goal.zoom - cur.zoom) * f; cur.az += (goal.az - cur.az) * f; cur.el += (goal.el - cur.el) * f;
  cur.mood = lerpMood(cur.mood, goal.mood, f);
  mx += (tmx - mx) * .04; my += (tmy - my) * .04;

  // isometric camera orbiting the target
  const az = cur.az + (reduce ? 0 : Math.sin(t * .05) * .06 + mx * .25), el = cur.el + (reduce ? 0 : my * .08), R = 60;
  camera.position.set(cur.target.x + Math.cos(az) * Math.cos(el) * R, cur.target.y + Math.sin(el) * R, cur.target.z + Math.sin(az) * Math.cos(el) * R);
  camera.lookAt(cur.target); camera.zoom = cur.zoom; camera.updateProjectionMatrix();
  sky.position.copy(camera.position);

  // mood
  const M = cur.mood;
  skyU.top.value.set(M.sky[0]); skyU.mid.value.set(M.sky[1]); skyU.bot.value.set(M.sky[2]); skyU.stars.value = M.stars; skyU.t.value = t;
  sun.color.set(M.sun); sun.intensity = M.si; hemi.color.set(M.hs); hemi.groundColor.set(M.hg); hemi.intensity = M.hi;
  scene.fog.color.set(M.sky[2]); bloom.strength = M.bloom; renderer.toneMappingExposure = M.exp;
  sun.position.copy(cur.target).add(V(14, 26, 10)); sun.target.position.copy(cur.target);

  // which vignettes are on stage
  const show = new Set([...(S.k < .5 ? S.A.show : S.B.show)]);
  for (const [name, p] of Object.entries(presence)) {
    p.target = show.has(name) ? 1 : 0;
    p.v += (p.target - p.v) * (1 - Math.pow(.01, dt));
    const g = W.groups[name];
    g.visible = p.v > .02;
    g.userData.base ??= g.scale.x; // keep any scale the world gave the group
    if (g.position.lengthSq() > 0) g.scale.setScalar(g.userData.base * Math.max(.001, p.v < .999 ? 1 - Math.pow(1 - p.v, 3) : 1));
    if (name === "labels") W.labels.forEach(l => l.element.style.opacity = p.v);
  }
  // the dark ending puts out the village lights one by one
  const dark = (S.k < .5 ? S.A : S.B).dark;
  W.houses.forEach((h, i) => h.userData.win.visible = !dark || Math.sin(t * .5 + i) > .9);
  W.villagers.forEach(v => { if (v.userData.lantern) v.userData.lantern.visible = !dark; });

  W.update(t, dt);
  composer.render();
  labels.render(scene, camera);
}
frame();

// ---------- the branching ending ----------
const endings = { light: document.getElementById("ending-light"), dark: document.getElementById("ending-dark") };
document.querySelectorAll("[data-choose]").forEach(b => b.addEventListener("click", () => {
  const pick = b.dataset.choose, other = pick === "light" ? "dark" : "light";
  window.SGTally?.record(pick, "b").then(() => window.SGTally.render());
  endings[pick].hidden = false; endings[other].hidden = true;
  document.getElementById("after").hidden = false;
  document.querySelectorAll("[data-other]").forEach(o => o.hidden = o.dataset.other !== other);
  endings[pick].querySelector("section").scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
}));

// chapter progress rail
const rail = document.querySelector(".rail");
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) rail?.querySelectorAll("a").forEach(a => a.classList.toggle("on", a.getAttribute("href") === "#" + e.target.id)); }), { rootMargin: "-45% 0px -50% 0px" });
document.querySelectorAll("section[data-key]").forEach(s => io.observe(s));
document.body.classList.add("ready");
