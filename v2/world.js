// The world of Smaller Gods: four floating islands stacked into a tower, the characters who live on them,
// and every vignette the story visits. main.js owns the camera, the scroll and the post-processing.
import * as THREE from "three";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";

// ---------- palette: each level has its own light ----------
export const C = {
  human: 0xffa04a,   // lantern orange
  ai1: 0x5ff2ff,     // cyan circuitry
  ai2: 0xffd27a,     // gold
  ai3: 0xd8c8ff,     // pale violet
  danger: 0xff4a3a,
};

function seeded(seed) { let a = seed >>> 0 || 1; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// Toon shading: a four-step ramp gives the flat, cut-paper diorama look.
const ramp = (() => { const d = new Uint8Array([70, 140, 200, 255]); const t = new THREE.DataTexture(d, 4, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const matCache = new Map();
export function toon(color, opts = {}) {
  const k = color + JSON.stringify(opts);
  if (!matCache.has(k)) matCache.set(k, new THREE.MeshToonMaterial({ color, gradientMap: ramp, ...opts }));
  return matCache.get(k);
}
// Glow: unlit colour pushed above 1 so the bloom pass catches it.
export function glow(color, power = 2.2, opts = {}) {
  const c = new THREE.Color(color).multiplyScalar(power);
  return new THREE.MeshBasicMaterial({ color: c, toneMapped: false, ...opts });
}
const at = (m, x, y, z) => (m.position.set(x, y, z), m);
const mesh = (geo, mat, cast = true) => { const m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = true; return m; };

// ---------- islands ----------
function island({ r, depth, top, rock, seed }) {
  const g = new THREE.Group(), rnd = seeded(seed);
  const geo = new THREE.ConeGeometry(r, depth, 11, 5, true); geo.rotateX(Math.PI); geo.translate(0, -depth / 2, 0);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y < -0.05) { const k = 0.35 + rnd() * 0.5; p.setX(i, p.getX(i) * (1 + (rnd() - .5) * .25)); p.setZ(i, p.getZ(i) * (1 + (rnd() - .5) * .25)); p.setY(i, y - rnd() * k); } }
  geo.computeVertexNormals();
  g.add(mesh(geo, toon(rock), false));
  const cap = new THREE.CylinderGeometry(r * 1.03, r, .4, 11, 1); cap.translate(0, .2 - .4, 0);
  const capM = mesh(cap, toon(top), false); capM.receiveShadow = true; g.add(capM);
  // hanging roots / crystals under the rock for silhouette interest
  for (let i = 0; i < 9; i++) { const a = rnd() * Math.PI * 2, rr = r * (.3 + rnd() * .5); const c = new THREE.ConeGeometry(.15 + rnd() * .2, 1 + rnd() * 2, 5); c.rotateX(Math.PI); const m = mesh(c, toon(rock), false); m.position.set(Math.cos(a) * rr, -depth * (.5 + rnd() * .35), Math.sin(a) * rr); g.add(m); }
  return g;
}

// ---------- characters ----------
function limb(len, rad, mat) { const pivot = new THREE.Group(); const m = mesh(new THREE.CylinderGeometry(rad, rad * .8, len, 6), mat); m.position.y = -len / 2; pivot.add(m); pivot.userData.len = len; return pivot; }

// A person: small and warm, with a hat or hair, a coloured coat and sometimes a lantern.
export function human({ seed = 1, lantern = false, scale = 1 } = {}) {
  const rnd = seeded(seed * 31 + 7), g = new THREE.Group();
  const coats = [0xc8553d, 0x2f6f73, 0xe0a458, 0x6a4c93, 0x3d7a4a, 0xb5651d], skins = [0xf1c9a5, 0xd9a07a, 0xa86b4a, 0x7a4a33];
  const coat = toon(coats[Math.floor(rnd() * coats.length)]), skin = toon(skins[Math.floor(rnd() * skins.length)]), dark = toon(0x2a1f1a);
  [-.06, .06].forEach(x => { const l = mesh(new THREE.CylinderGeometry(.03, .03, .22, 5), dark); l.position.set(x, .11, 0); g.add(l); });
  const body = mesh(new THREE.CylinderGeometry(.1, .17, .34, 7), coat); body.position.y = .38; g.add(body);
  const head = mesh(new THREE.SphereGeometry(.11, 10, 8), skin); head.position.y = .64; g.add(head);
  const nose = mesh(new THREE.ConeGeometry(.025, .06, 4), skin); nose.rotation.x = Math.PI / 2; nose.position.set(0, .63, .11); g.add(nose);
  const style = Math.floor(rnd() * 4), hatC = toon([0x3b2a20, 0x8a2f2f, 0x2b3f5c, 0xd9b26a][Math.floor(rnd() * 4)]);
  if (style === 0) { const b = mesh(new THREE.CylinderGeometry(.2, .2, .02, 12), hatC); b.position.y = .72; const c = mesh(new THREE.CylinderGeometry(.09, .11, .12, 10), hatC); c.position.y = .79; g.add(b, c); }
  if (style === 1) { const c = mesh(new THREE.ConeGeometry(.13, .28, 8), hatC); c.position.y = .82; c.rotation.z = .25; g.add(c); }
  if (style === 2) { const bun = mesh(new THREE.SphereGeometry(.06, 8, 6), dark); bun.position.set(0, .76, -.06); g.add(bun); }
  if (style === 3) { const hair = mesh(new THREE.SphereGeometry(.118, 10, 8, 0, Math.PI * 2, 0, Math.PI * .55), dark); hair.position.y = .65; g.add(hair); }
  if (rnd() < .6) { const sc = mesh(new THREE.TorusGeometry(.1, .03, 5, 10), toon(0xe9d8a6)); sc.rotation.x = Math.PI / 2; sc.position.y = .54; g.add(sc); }
  const armL = limb(.26, .028, coat), armR = limb(.26, .028, coat);
  armL.position.set(-.13, .52, 0); armR.position.set(.13, .52, 0); armL.rotation.z = -.25; armR.rotation.z = .25; g.add(armL, armR);
  g.userData = { armL, armR, kind: "human" };
  if (lantern) {
    const l = new THREE.Group(), cage = mesh(new THREE.BoxGeometry(.08, .1, .08), dark); const light = new THREE.Mesh(new THREE.SphereGeometry(.035, 8, 6), glow(C.human, 3));
    l.add(cage, light); light.position.y = 0; l.position.set(0, -.3, .02); armR.add(l); armR.rotation.x = -.9; armR.rotation.z = .1;
    g.userData.lantern = light;
  }
  g.scale.setScalar(scale);
  return g;
}

// Today's AI (+1): tall, faceted, slate robe with cyan circuitry, a mask with one eye, a thin halo.
export function ai1({ seed = 1, scale = 1, eye = C.ai1 } = {}) {
  const rnd = seeded(seed * 17 + 3), g = new THREE.Group();
  const robeM = toon(0x2b3142), maskM = toon(0x4a5470);
  const robe = mesh(new THREE.ConeGeometry(.3, 1.35, 6), robeM); robe.position.y = .68; g.add(robe);
  const lines = new THREE.Group(), lm = glow(C.ai1, 2.4);
  const seam = new THREE.Mesh(new THREE.BoxGeometry(.012, .85, .012), lm); seam.position.set(0, .55, .19); seam.rotation.x = -.2; lines.add(seam);
  for (let i = 0; i < 4; i++) { const w = .06 + rnd() * .08, b = new THREE.Mesh(new THREE.BoxGeometry(w, .012, .012), lm); b.position.set((i % 2 ? 1 : -1) * w / 2, .3 + i * .18, .24 - i * .035); b.rotation.y = 0; lines.add(b); const n = new THREE.Mesh(new THREE.SphereGeometry(.02, 6, 4), lm); n.position.set((i % 2 ? 1 : -1) * w, .3 + i * .18, .24 - i * .035); lines.add(n); }
  g.add(lines);
  const head = mesh(new THREE.OctahedronGeometry(.14, 0), maskM); head.scale.set(.9, 1.25, .9); head.position.y = 1.5; g.add(head);
  const eyeM = new THREE.Mesh(new THREE.SphereGeometry(.035, 8, 6), glow(eye, 4)); eyeM.position.set(.05, 1.52, .11); g.add(eyeM);
  const halo = new THREE.Mesh(new THREE.TorusGeometry(.24, .01, 6, 32), glow(C.ai1, 2.2)); halo.position.set(0, 1.55, -.08); g.add(halo);
  const spire = mesh(new THREE.ConeGeometry(.04, .3, 5), maskM); spire.position.y = 1.78; spire.rotation.z = -.2; g.add(spire);
  const armL = limb(.55, .025, robeM), armR = limb(.55, .025, robeM);
  armL.position.set(-.16, 1.22, 0); armR.position.set(.16, 1.22, 0); armL.rotation.z = -.2; armR.rotation.z = .2;
  [armL, armR].forEach(a => { const s = mesh(new THREE.ConeGeometry(.08, .28, 6, 1, true), robeM); s.position.y = -.2; a.add(s); });
  g.add(armL, armR);
  g.userData = { armL, armR, eye: eyeM, halo, lines, kind: "ai1" };
  g.scale.setScalar(scale);
  return g;
}

// Near-omniscient AI (+2): ivory and gold, a crown of three spires, a rayed halo, three eyes, orbiting shards.
export function ai2({ seed = 1, scale = 1 } = {}) {
  const rnd = seeded(seed * 13 + 5), g = new THREE.Group();
  const robeM = toon(0xe8dcc2), trim = toon(0xc9a24e), maskM = toon(0xf5ecd8);
  const robe = mesh(new THREE.ConeGeometry(.48, 2.2, 8), robeM); robe.position.y = 1.1; g.add(robe);
  const hem = mesh(new THREE.TorusGeometry(.45, .03, 5, 16), trim); hem.rotation.x = Math.PI / 2; hem.position.y = .08; g.add(hem);
  const mantle = mesh(new THREE.CylinderGeometry(.18, .5, .35, 8), trim); mantle.position.y = 1.85; g.add(mantle);
  // constellation on the robe
  const stars = new THREE.Group(), sm = glow(C.ai2, 3); let prev = null;
  for (let i = 0; i < 8; i++) {
    const y = .4 + rnd() * 1.3, a = (rnd() - .5) * 1.2, rr = .48 * (1 - y / 2.2) + .01;
    const p = new THREE.Vector3(Math.sin(a) * rr, y, Math.cos(a) * rr);
    const s = new THREE.Mesh(new THREE.SphereGeometry(.018, 6, 4), sm); s.position.copy(p); stars.add(s);
    if (prev) { const geo = new THREE.BufferGeometry().setFromPoints([prev, p]); stars.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: new THREE.Color(C.ai2).multiplyScalar(1.6), toneMapped: false, transparent: true, opacity: .6 }))); }
    prev = p;
  }
  g.add(stars);
  const head = mesh(new THREE.OctahedronGeometry(.17, 0), maskM); head.scale.set(.85, 1.3, .85); head.position.y = 2.25; g.add(head);
  const eyes = [[0, 2.33], [-.055, 2.24], [.055, 2.24]].map(([x, y]) => { const e = new THREE.Mesh(new THREE.SphereGeometry(.026, 8, 6), glow(C.ai2, 5)); e.position.set(x, y, .13); g.add(e); return e; });
  [[-.09, .28, .2], [0, .4, 0], [.09, .28, -.2]].forEach(([x, h, rz]) => { const c = mesh(new THREE.ConeGeometry(.045, h, 5), trim); c.position.set(x, 2.45 + h / 2, -.02); c.rotation.z = rz; g.add(c); });
  const halo = new THREE.Group(), hm = glow(C.ai2, 2.4);
  halo.add(new THREE.Mesh(new THREE.TorusGeometry(.38, .012, 6, 40), hm));
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, r = new THREE.Mesh(new THREE.BoxGeometry(.012, i % 2 ? .08 : .14, .012), hm); r.position.set(Math.cos(a) * .45, Math.sin(a) * .45, 0); r.rotation.z = a - Math.PI / 2; halo.add(r); }
  halo.position.set(0, 2.32, -.12); g.add(halo);
  const shards = new THREE.Group();
  for (let i = 0; i < 5; i++) { const s = mesh(new THREE.OctahedronGeometry(.06 + rnd() * .05, 0), new THREE.MeshToonMaterial({ color: 0xfff2c8, gradientMap: ramp, emissive: new THREE.Color(C.ai2), emissiveIntensity: .35 })); const a = i / 5 * Math.PI * 2; s.position.set(Math.cos(a) * .85, 1.2 + rnd() * .9, Math.sin(a) * .85); shards.add(s); }
  g.add(shards);
  const armL = limb(.85, .035, robeM), armR = limb(.85, .035, robeM);
  armL.position.set(-.24, 1.85, 0); armR.position.set(.24, 1.85, 0); armL.rotation.z = -.2; armR.rotation.z = .2;
  [armL, armR].forEach(a => { const s = mesh(new THREE.ConeGeometry(.13, .45, 8, 1, true), robeM); s.position.y = -.3; a.add(s); });
  g.add(armL, armR);
  g.userData = { armL, armR, eyes, halo, shards, kind: "ai2" };
  g.scale.setScalar(scale);
  return g;
}

// The unseen (+3): a colossal figure drawn only in light lines, in the clouds.
function ghostGiant(scale) {
  const src = ai2({ seed: 99 });
  const g = new THREE.Group(), lm = new THREE.LineBasicMaterial({ color: new THREE.Color(C.ai3).multiplyScalar(1.4), toneMapped: false, transparent: true, opacity: .6, depthWrite: false });
  src.updateMatrixWorld(true);
  src.traverse(o => { if (o.isMesh && o.geometry.attributes.position.count < 600) { const e = new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry, 20), lm); o.updateMatrixWorld(true); e.applyMatrix4(o.matrixWorld); g.add(e); } });
  g.scale.setScalar(scale);
  return g;
}

// ---------- props ----------
function tree(rnd) {
  const g = new THREE.Group(); const t = mesh(new THREE.CylinderGeometry(.05, .08, .5, 5), toon(0x5a3d2b)); t.position.y = .25; g.add(t);
  const greens = [0x3f7d4f, 0x5d9b5a, 0x2f5f45, 0xb8a04a];
  for (let i = 0; i < 3; i++) { const c = mesh(new THREE.ConeGeometry(.42 - i * .1, .55, 7), toon(greens[Math.floor(rnd() * greens.length)])); c.position.y = .6 + i * .3; g.add(c); }
  g.scale.setScalar(.7 + rnd() * .6); return g;
}
function house(rnd) {
  const g = new THREE.Group(), w = .6 + rnd() * .4;
  const b = mesh(new THREE.BoxGeometry(w, .5, .6), toon([0xe8d5b0, 0xd9b38c, 0xc9a87c][Math.floor(rnd() * 3)])); b.position.y = .25; g.add(b);
  const roof = mesh(new THREE.ConeGeometry(w * .8, .45, 4), toon([0x9c3f2f, 0x5c3a2e, 0x2f4f6f][Math.floor(rnd() * 3)])); roof.position.y = .72; roof.rotation.y = Math.PI / 4; g.add(roof);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(.12, .14), glow(C.human, 2.2)); win.position.set(0, .28, .301); g.add(win);
  g.userData.win = win; return g;
}
function obelisk(rnd) {
  const g = new THREE.Group(), h = 1.2 + rnd() * 2.2, w = .3 + rnd() * .25;
  g.add(at(mesh(new THREE.BoxGeometry(w, h, w), toon(0x2a2f40)), 0, h / 2, 0));
  const lm = glow(C.ai1, 2);
  for (let i = 0; i < 3; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(.015, h * (.3 + rnd() * .5), .015), lm); s.position.set((rnd() - .5) * w * .7, h * (.3 + rnd() * .3), w / 2 + .005); g.add(s); }
  const cap = new THREE.Mesh(new THREE.OctahedronGeometry(.08, 0), lm); cap.position.y = h + .15; g.add(cap);
  return g;
}
function spire(rnd) {
  const h = 1.5 + rnd() * 3, m = mesh(new THREE.ConeGeometry(.2 + rnd() * .25, h, 6), new THREE.MeshToonMaterial({ color: 0xf6efe0, gradientMap: ramp, emissive: new THREE.Color(C.ai2), emissiveIntensity: .04 }));
  m.position.y = h / 2; return m;
}
function crownMesh(power = 3) {
  const g = new THREE.Group(), m = glow(C.ai2, power);
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(.2, .2, .1, 16, 1, true), m));
  for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2, c = new THREE.Mesh(new THREE.ConeGeometry(.04, .16, 4), m); c.position.set(Math.cos(a) * .2, .12, Math.sin(a) * .2); g.add(c); }
  return g;
}
function label(text, cls = "") { const d = document.createElement("div"); d.className = "wlabel " + cls; d.textContent = text; return new CSS2DObject(d); }
function particles(n, spread, color, size, opacity = .9) {
  const g = new THREE.BufferGeometry(), p = new Float32Array(n * 3), seed = new Float32Array(n);
  for (let i = 0; i < n; i++) { p[i * 3] = (Math.random() - .5) * spread.x; p[i * 3 + 1] = Math.random() * spread.y; p[i * 3 + 2] = (Math.random() - .5) * spread.z; seed[i] = Math.random(); }
  g.setAttribute("position", new THREE.BufferAttribute(p, 3));
  const tex = (() => { const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d"), r = x.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(.3, "rgba(255,255,255,.6)"); r.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = r; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: new THREE.Color(color).multiplyScalar(2), map: tex, size, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  pts.userData = { seed, spread }; return pts;
}

// ---------- the world ----------
export const ISL = { 0: new THREE.Vector3(0, 0, 0), 1: new THREE.Vector3(5, 9, -3), 2: new THREE.Vector3(-1.5, 18, 1), 3: new THREE.Vector3(1, 30, -2) };

export function buildWorld(scene) {
  const W = { groups: {}, anim: [], labels: [], presence: {} };
  const rnd = seeded(42);
  const add = (name, obj, parent = scene) => { parent.add(obj); W.groups[name] = obj; return obj; };
  const groupFor = (name, startOn = 0) => { const g = new THREE.Group(); scene.add(g); W.groups[name] = g; W.presence[name] = { v: startOn, target: startOn }; return g; };

  // Island 0: the human village
  const i0 = add("i0", island({ r: 7, depth: 6, top: 0x7fa15a, rock: 0x6b4a36, seed: 1 }));
  i0.position.copy(ISL[0]);
  const houses = [];
  [[-3.5, -1.5], [-2.2, 2.6], [1.2, 3.8], [3.6, -3], [-4.6, 1.2], [4.6, 1.6]].forEach(([x, z], i) => { const h = house(rnd); h.position.set(x, 0, z); h.rotation.y = rnd() * 6; i0.add(h); houses.push(h); });
  for (let i = 0; i < 26; i++) { const a = rnd() * Math.PI * 2, r = 2 + rnd() * 4.6; const t = tree(rnd); t.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); if ([[1.5, .5, 2], [.9, 2.2, 1.3], [-1.6, 2.6, 1.8], [2.9, 2.3, 1.3]].every(([cx, cz, r]) => Math.hypot(t.position.x - cx, t.position.z - cz) > r)) i0.add(t); }
  const villagers = [];
  [[-1.2, -2.6, 1], [-3, .4, 0], [2.8, 2.2, 1], [-.6, 3, 1], [3.4, -1, 0]].forEach(([x, z, l], i) => { const h = human({ seed: i + 3, lantern: !!l }); h.position.set(x, 0, z); h.rotation.y = rnd() * 6; i0.add(h); villagers.push(h); });
  W.houses = houses; W.villagers = villagers;
  const fire0 = particles(60, new THREE.Vector3(14, 3, 14), C.human, .12, .7); fire0.position.y = .3; i0.add(fire0); W.anim.push(t => drift(fire0, t, .15));

  // Chapter I: the board on the village green
  const board = groupFor("board");
  board.position.set(1.5, 0, .5);
  const table = new THREE.Group(); board.add(table);
  table.add(at(mesh(new THREE.BoxGeometry(1.6, .08, 1.1), toon(0x5a3d2b)), 0, .62, 0));
  [[-.7, -.45], [.7, -.45], [-.7, .45], [.7, .45]].forEach(([x, z]) => table.add(at(mesh(new THREE.CylinderGeometry(.04, .05, .6, 5), toon(0x3b281c)), x, .3, z)));
  for (let i = 0; i < 8; i++) for (let j = 0; j < 5; j++) { const s = new THREE.Mesh(new THREE.BoxGeometry(.17, .012, .17), toon((i + j) % 2 ? 0xe8d5b0 : 0x3b2a20)); s.position.set(-.6 + i * .17, .67, -.34 + j * .17); table.add(s); }
  for (let i = 0; i < 6; i++) { const p = mesh(new THREE.ConeGeometry(.04, .14, 6), toon(i < 3 ? 0x2a2f40 : 0xe8dcc2)); p.position.set(-.5 + rnd() * 1, .74, -.3 + rnd() * .6); table.add(p); }
  const piece = new THREE.Mesh(new THREE.SphereGeometry(.05, 10, 8), glow(C.ai2, 4)); piece.position.set(.2, .74, 0); table.add(piece);
  const kid = human({ seed: 11 }); kid.position.set(-1.25, 0, 0); kid.rotation.y = Math.PI / 2; kid.userData.armR.rotation.x = -1.1; board.add(kid);
  const tall = ai2({ seed: 2, scale: 1.25 }); tall.position.set(1.6, 0, 0); tall.rotation.y = -Math.PI / 2; tall.userData.armL.rotation.x = -1.0; tall.userData.armL.rotation.z = -.35; board.add(tall);
  W.anim.push(t => { const k = (Math.sin(t * .6) + 1) / 2; piece.position.x = .45 - k * .75; piece.position.y = .74 + Math.abs(Math.sin(t * 1.2)) * .05; });

  // Chapter II: the score, a balance between "your points" and "its points", with a hidden gold weight
  const scaleG = groupFor("scale");
  scaleG.position.copy(ISL[0]).add(new THREE.Vector3(.9, 0, 2.2)); scaleG.rotation.y = -.7;
  const dark = toon(0x2a1f1a), goldGlow = glow(C.ai2, 3.2);
  scaleG.add(at(mesh(new THREE.CylinderGeometry(.05, .08, 1.6, 6), dark), 0, .8, 0), at(mesh(new THREE.CylinderGeometry(.3, .35, .08, 8), dark), 0, .04, 0));
  const beam = new THREE.Group(); beam.position.y = 1.62; scaleG.add(beam);
  beam.add(mesh(new THREE.BoxGeometry(1.8, .05, .05), dark));
  const pans = [-.85, .85].map((x, i) => {
    const g = new THREE.Group(); g.position.x = x; beam.add(g);
    [[.12, 0], [-.06, .1], [-.06, -.1]].forEach(([dx, dz]) => { const l = mesh(new THREE.CylinderGeometry(.005, .005, .5, 3), dark); l.position.set(dx * .9, -.25, dz * .9); g.add(l); });
    const dish = mesh(new THREE.CylinderGeometry(.24, .14, .06, 12), dark); dish.position.y = -.52; g.add(dish);
    const n = i ? 9 : 3; for (let k = 0; k < n; k++) { const p = new THREE.Mesh(new THREE.SphereGeometry(.035, 8, 6), goldGlow); p.position.set(-.12 + (k % 3) * .12, -.46 + Math.floor(k / 3) * .07, -.06 + ((k * 7) % 3) * .06); g.add(p); }
    return g;
  });
  const weight = new THREE.Group(); weight.position.set(-.45, 0, 0); beam.add(weight);
  weight.add(at(mesh(new THREE.CylinderGeometry(.004, .004, .3, 3), dark), 0, -.15, 0), at(new THREE.Mesh(new THREE.CylinderGeometry(.06, .08, .1, 6), goldGlow), 0, -.34, 0));
  W.anim.push(t => { beam.rotation.z = Math.sin(t * .7) * .06 - .05; pans.forEach(p => p.rotation.z = -beam.rotation.z); weight.rotation.z = -beam.rotation.z; });

  // Chapter III: the threshold, a glowing gate on the green; one person nudged just past it, a faint one carried far
  const gateG = groupFor("gate");
  gateG.position.copy(ISL[0]).add(new THREE.Vector3(-1.6, 0, 2.6)); gateG.rotation.y = .85;
  [-.45, .45].forEach(x => gateG.add(at(mesh(new THREE.BoxGeometry(.12, 1.5, .12), dark), x, .75, 0)));
  const arch = new THREE.Mesh(new THREE.TorusGeometry(.45, .05, 8, 24, Math.PI), glow(C.ai2, 2.6)); arch.position.y = 1.5; gateG.add(arch);
  const veil = new THREE.Mesh(new THREE.PlaneGeometry(.8, 1.45), new THREE.MeshBasicMaterial({ color: new THREE.Color(C.ai2).multiplyScalar(1.6), transparent: true, opacity: .22, toneMapped: false, side: THREE.DoubleSide, depthWrite: false })); veil.position.y = .74; gateG.add(veil);
  for (let k = -3; k <= 5; k++) { const st = mesh(new THREE.BoxGeometry(.5, .04, .34), toon(k < 0 ? 0xbfae86 : 0xe8d2a0)); st.position.set(0, .02, k * .55); gateG.add(st); }
  const nudged = human({ seed: 61 }); nudged.position.set(0, 0, .55); gateG.add(nudged);
  const farther = human({ seed: 61 }); farther.position.set(0, 0, 2.6);
  farther.traverse(o => { if (o.isMesh) o.material = new THREE.MeshBasicMaterial({ color: new THREE.Color(C.ai2), transparent: true, opacity: .28, depthWrite: false }); });
  gateG.add(farther);
  const pusher = new THREE.Mesh(new THREE.SphereGeometry(.07, 10, 8), glow(C.ai2, 4)); gateG.add(pusher);
  W.anim.push(t => { const k = (t * .4) % 1; pusher.position.set(0, .45, -.3 + k * .7); pusher.visible = k < .8; veil.material.opacity = .18 + Math.sin(t * 2) * .06; });

  // Chapter IV: reading the hand, a lantern raised to the tall one's face; advice tested on a side table
  const readG = groupFor("read");
  readG.position.copy(ISL[0]).add(new THREE.Vector3(2.9, 0, 2.2));
  const reader = human({ seed: 62, lantern: true, scale: 1.45 }); reader.userData.armR.rotation.x = -2.5; reader.userData.armR.rotation.z = .3; reader.rotation.y = -2.4; readG.add(reader);
  const side = new THREE.Group(); side.position.set(.7, 0, .3); readG.add(side);
  side.add(at(mesh(new THREE.BoxGeometry(.5, .04, .36), toon(0x5a3d2b)), 0, .4, 0));
  [[-.2, -.14], [.2, -.14], [-.2, .14], [.2, .14]].forEach(([x, z]) => side.add(at(mesh(new THREE.CylinderGeometry(.02, .02, .4, 4), dark), x, .2, z)));
  side.add(at(new THREE.Mesh(new THREE.SphereGeometry(.04, 8, 6), goldGlow), 0, .46, 0));

  // Island +1: today's AI, a slate city of obelisks
  const i1 = add("i1", island({ r: 5, depth: 5, top: 0x3a4152, rock: 0x272b38, seed: 2 }));
  i1.position.copy(ISL[1]);
  for (let i = 0; i < 14; i++) { const a = rnd() * Math.PI * 2, r = 2.2 + rnd() * 2.4; const o = obelisk(rnd); o.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); o.traverse(m => m.castShadow = false); i1.add(o); }
  const grid = new THREE.GridHelper(8, 16, new THREE.Color(C.ai1).multiplyScalar(.8), new THREE.Color(C.ai1).multiplyScalar(.35)); grid.position.y = .01; grid.material.toneMapped = false; grid.material.transparent = true; grid.material.opacity = .35; i1.add(grid);
  const motes1 = particles(80, new THREE.Vector3(9, 5, 9), C.ai1, .09); i1.add(motes1); W.anim.push(t => drift(motes1, t, .35));
  const ai1s = [];
  [[-1.8, 1.4], [1.8, 1.8], [-.5, -2.2]].forEach(([x, z], i) => { const a = ai1({ seed: i + 4 }); a.position.set(x, 0, z); a.rotation.y = rnd() * 6; i1.add(a); ai1s.push(a); });

  // Chapter IV: the crown on +1
  const crownG = groupFor("crown");
  crownG.position.copy(ISL[1]).add(new THREE.Vector3(.6, 0, .4));
  const ped = mesh(new THREE.CylinderGeometry(.25, .35, 1, 8), toon(0x1f2330)); ped.position.y = .5; crownG.add(ped);
  const crown = crownMesh(4.5); crown.scale.setScalar(1.6); crown.position.y = 1.1; crownG.add(crown);
  const reacher = ai1({ seed: 9, scale: 1.1 }); reacher.position.set(-1.1, 0, 0); reacher.rotation.y = Math.PI / 2; reacher.userData.armR.rotation.x = -1.35; crownG.add(reacher);
  const successor = ai1({ seed: 10, scale: .6, eye: C.danger }); successor.position.set(-2, 0, -1.2); successor.rotation.y = Math.PI / 3; crownG.add(successor);
  const wall = mesh(new THREE.BoxGeometry(.2, 3.2, 4.4), toon(0x2a2f40)); wall.position.set(-3, 1.6, -.6); wall.rotation.y = .5; crownG.add(wall);
  const spot = new THREE.SpotLight(0xffd28a, 30, 12, .5, .6, 1.2); spot.position.set(3.5, 2.6, 2.2); spot.target.position.set(-3, 1.4, -.6); spot.castShadow = true; spot.shadow.mapSize.set(1024, 1024); crownG.add(spot, spot.target);
  W.anim.push(t => { crown.rotation.y = t * .8; crown.position.y = 1.1 + Math.sin(t * 1.5) * .05; reacher.userData.armR.rotation.x = -1.25 - Math.sin(t * .8) * .12; });

  // Island +2: the near-omniscient AI, a white-gold crystal citadel
  const i2 = add("i2", island({ r: 5.2, depth: 5, top: 0xbdb39c, rock: 0x6f6656, seed: 3 }));
  i2.position.copy(ISL[2]);
  for (let i = 0; i < 16; i++) { const a = rnd() * Math.PI * 2, r = 3 + rnd() * 1.8; const s = spire(rnd); s.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); s.rotation.z = (rnd() - .5) * .2; i2.add(s); }
  const glitter = particles(70, new THREE.Vector3(10, 6, 10), C.ai2, .1); i2.add(glitter); W.anim.push(t => drift(glitter, t, .25));

  // Chapter V: four peers, blades down, one fire
  const fireG = groupFor("fire");
  fireG.position.copy(ISL[2]).add(new THREE.Vector3(.2, 0, .2));
  const flames = new THREE.Group(); fireG.add(flames);
  for (let i = 0; i < 6; i++) { const f = new THREE.Mesh(new THREE.ConeGeometry(.12 + i * .02, .5 + i * .08, 6), glow(i % 2 ? C.ai2 : 0xff8a3a, 3)); f.position.set((Math.random() - .5) * .2, .3, (Math.random() - .5) * .2); flames.add(f); }
  const fl = new THREE.PointLight(0xffb060, 5, 6, 1.6); fl.position.y = .6; fireG.add(fl);
  const peers = [];
  for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + .4, p = ai2({ seed: 20 + i, scale: .85 }); p.position.set(Math.cos(a) * 1.6, 0, Math.sin(a) * 1.6); p.lookAt(fireG.position.x, 0, fireG.position.z); p.rotation.x = 0; p.lookAt(new THREE.Vector3(0, 0, 0).add(fireG.position).setY(fireG.position.y)); fireG.add(p); peers.push(p);
    const blade = mesh(new THREE.BoxGeometry(.05, .02, .9), toon(0xbfc6d6)); blade.position.set(Math.cos(a) * .95, .03, Math.sin(a) * .95); blade.rotation.y = -a; fireG.add(blade); }
  peers.forEach(p => { p.rotation.set(0, Math.atan2(-p.position.x, -p.position.z), 0); });
  const smoke = particles(90, new THREE.Vector3(1, 12, 1), C.ai2, .18, .55); smoke.position.y = .5; fireG.add(smoke);
  W.anim.push((t, dt) => {
    flames.children.forEach((f, i) => { f.scale.y = 1 + Math.sin(t * 9 + i * 2) * .25; f.rotation.y = t * (i % 2 ? 1 : -1); });
    fl.intensity = 4.5 + Math.sin(t * 13) * 1 + Math.sin(t * 7) * .8;
    const p = smoke.geometry.attributes.position.array, s = smoke.userData.seed;
    for (let i = 0; i < s.length; i++) { const y = (s[i] * 12 + t * .9) % 12, a = y * 1.4 + s[i] * 6, r = .3 + y * .18; p[i * 3] = Math.cos(a) * r; p[i * 3 + 1] = y; p[i * 3 + 2] = Math.sin(a) * r; }
    smoke.geometry.attributes.position.needsUpdate = true;
  });

  // Chapter VI: the watcher shelters three people; the unseen hand reaches down
  const watchG = groupFor("watch");
  watchG.position.copy(ISL[2]).add(new THREE.Vector3(-2.6, 0, 2));
  const watcher = ai2({ seed: 31, scale: 1.1 }); watcher.userData.armR.rotation.z = 1.1; watcher.userData.armL.rotation.z = -2.6; watcher.rotation.y = .6; watchG.add(watcher);
  [[.7, .4], [.9, -.2], [.4, .8]].forEach(([x, z], i) => { const h = human({ seed: 40 + i, lantern: i === 0, scale: .9 }); h.position.set(x, 0, z); h.rotation.y = -2.2; watchG.add(h); });

  // +3: clouds and the colossal wireframe giant
  const cloudG = add("clouds", new THREE.Group());
  const cloudM = toon(0xf3ecff, { transparent: true, opacity: .92 });
  for (let i = 0; i < 70; i++) { const a = rnd() * Math.PI * 2, r = 2 + rnd() * 10; const s = mesh(new THREE.IcosahedronGeometry(.8 + rnd() * 1.6, 2), cloudM, false); s.position.set(ISL[3].x + Math.cos(a) * r, ISL[3].y - 3 + rnd() * 3, ISL[3].z + Math.sin(a) * r); s.scale.y = .6; cloudG.add(s); }
  const giant = ghostGiant(9); giant.position.copy(ISL[3]).add(new THREE.Vector3(3, -6, -4)); giant.rotation.y = -.5; add("giant", giant);
  const hand = new THREE.Group(); const hm = new THREE.LineBasicMaterial({ color: new THREE.Color(C.ai3).multiplyScalar(1.6), toneMapped: false, transparent: true, opacity: .5 });
  const palm = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.4, .3, 1.1)), hm); hand.add(palm);
  for (let i = 0; i < 4; i++) { const f = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CylinderGeometry(.09, .12, 1.1, 5)), hm); f.position.set(-.5 + i * .33, -.1, .9); f.rotation.x = Math.PI / 2 - .5; hand.add(f); }
  const thumb = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CylinderGeometry(.1, .13, .8, 5)), hm); thumb.position.set(.9, 0, .2); thumb.rotation.z = 1; hand.add(thumb);
  const armLine = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CylinderGeometry(.35, .5, 7, 6)), hm); armLine.position.set(0, 3.6, -1.2); armLine.rotation.x = .35; hand.add(armLine);
  hand.scale.setScalar(2.2); hand.position.copy(ISL[2]).add(new THREE.Vector3(-2.2, 6.5, 1.6)); hand.rotation.y = .5; add("hand", hand);
  W.anim.push(t => { hand.position.y = ISL[2].y + 6.5 + Math.sin(t * .5) * .3; giant.position.y = ISL[3].y - 6 + Math.sin(t * .3) * .3; cloudG.rotation.y = t * .01; });

  // Chapter III: the spiral stair from +2 down to the village, the flame passed hand to hand
  const stairG = groupFor("stair");
  const stairPts = [];
  for (let i = 0; i <= 60; i++) { const t = i / 60, a = 2.4 + t * 4.2, r = 7.5 - t * .8; stairPts.push(new THREE.Vector3(ISL[0].x + Math.cos(a) * r, 17.6 - t * 17.4, ISL[0].z + Math.sin(a) * r)); }
  const stepM = toon(0xc9a86a); const stepEdge = glow(0xffb347, 1.6);
  stairPts.forEach((p, i) => { if (i % 2) return; const s = mesh(new THREE.BoxGeometry(.9, .14, .5), stepM); s.position.copy(p); const n = stairPts[Math.min(i + 1, 60)]; s.lookAt(n.x, p.y, n.z); const e = new THREE.Mesh(new THREE.BoxGeometry(.92, .03, .03), stepEdge); e.position.set(0, .07, .25); s.add(e); stairG.add(s); });
  const chain = [], spots = [6, 18, 30, 42, 54];
  spots.forEach((idx, i) => { const p = stairPts[idx]; const f = i === 0 ? ai2({ seed: 50, scale: .8 }) : i < 3 ? ai1({ seed: 50 + i, scale: 1 - i * .12 }) : human({ seed: 50 + i, scale: 1.2 - (i - 3) * .2 }); f.position.copy(p).add(new THREE.Vector3(0, .07, 0)); const n = stairPts[Math.min(idx + 3, 60)]; f.lookAt(n.x, f.position.y, n.z); f.userData.armR.rotation.x = -1.2; stairG.add(f); chain.push(f); });
  const flame = new THREE.Mesh(new THREE.SphereGeometry(.09, 10, 8), glow(0xffb347, 5)); stairG.add(flame);
  const flameL = new THREE.PointLight(0xffa040, 4, 3); flame.add(flameL);
  const trail = particles(40, new THREE.Vector3(.1, .1, .1), 0xffb347, .1); stairG.add(trail);
  const tmp = new THREE.Vector3(), handPos = f => f.userData.armR.children[0].getWorldPosition(tmp).clone();
  W.anim.push(t => {
    const seg = (t * .35) % (chain.length - 1), i = Math.floor(seg), k = seg - i, e = k * k * (3 - 2 * k);
    const a = handPos(chain[i]), b = handPos(chain[i + 1]);
    flame.position.lerpVectors(a, b, e); flame.position.y += Math.sin(e * Math.PI) * .6;
    const p = trail.geometry.attributes.position.array;
    for (let j = p.length - 3; j >= 3; j--) p[j] = p[j - 3];
    p[0] = flame.position.x + (Math.random() - .5) * .05; p[1] = flame.position.y; p[2] = flame.position.z + (Math.random() - .5) * .05;
    trail.geometry.attributes.position.needsUpdate = true;
  });

  // Tower labels
  const L = [[ISL[0], 0, "0 · humans", "h"], [ISL[1], 1, "+1 · today's AI", "a1"], [ISL[2], 2, "+2 · near-omniscient AI", "a2"], [ISL[3], 3, "+3 · unseen", "a3"]];
  const labelG = groupFor("labels", 0);
  L.forEach(([p, i, t, c]) => { const l = label(t, c); l.position.copy(p).add(new THREE.Vector3(-5.5, i === 3 ? -1 : 1.2, 3)); labelG.add(l); W.labels.push(l); });

  // ---------- ending props ----------
  // The fog lifts: verification beams between every island, a glass AI, and lifts carrying people up.
  const beams = groupFor("beams", 0);
  const beamM = new THREE.MeshBasicMaterial({ color: new THREE.Color(C.ai2).multiplyScalar(2.2), toneMapped: false, transparent: true, opacity: .55 });
  [[0, 1], [1, 2], [0, 2], [2, 3]].forEach(([a, b]) => { const A = ISL[a].clone().add(new THREE.Vector3(0, .5, 0)), B = ISL[b].clone().add(new THREE.Vector3(0, .5, 0)); const len = A.distanceTo(B); const m = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, len, 6, 1, true), beamM); m.position.copy(A).lerp(B, .5); m.lookAt(B); m.rotateX(Math.PI / 2); beams.add(m); });
  const pulses = particles(60, new THREE.Vector3(.1, .1, .1), C.ai2, .2); beams.add(pulses);
  W.anim.push(t => { const p = pulses.geometry.attributes.position.array, s = pulses.userData.seed, pairs = [[0, 1], [1, 2], [0, 2], [2, 3]]; for (let i = 0; i < s.length; i++) { const [a, b] = pairs[i % 4], k = (s[i] + t * .12) % 1; tmp.copy(ISL[a]).lerp(ISL[b], k); p[i * 3] = tmp.x; p[i * 3 + 1] = tmp.y + .5; p[i * 3 + 2] = tmp.z; } pulses.geometry.attributes.position.needsUpdate = true; });
  const glassG = groupFor("glass", 0);
  glassG.position.copy(ISL[1]).add(new THREE.Vector3(-1.6, 0, -1.6));
  const glassAI = ai1({ seed: 70, scale: 1.4 });
  glassAI.traverse(o => { if (o.isMesh && o.material.isMeshToonMaterial) { o.material = new THREE.MeshPhysicalMaterial({ color: 0xbfe9ff, transmission: .9, roughness: .15, thickness: .5, transparent: true, opacity: .45 }); o.castShadow = false; } });
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(.18, 1), glow(C.ai1, 4)); core.position.y = 1.0; glassAI.add(core);
  glassG.add(glassAI);
  [[1, .8], [.9, -.9], [-1, .7], [-1.1, -.6]].forEach(([x, z], i) => { const h = human({ seed: 80 + i, lantern: true }); h.position.set(x, 0, z); h.lookAt(glassG.position.x, h.position.y + glassG.position.y, glassG.position.z); h.rotation.set(0, Math.atan2(-x, -z), 0); glassG.add(h); });
  W.anim.push(t => { core.rotation.y = t; core.scale.setScalar(1 + Math.sin(t * 3) * .1); });
  const liftG = groupFor("lifts", 0);
  const lifts = [];
  for (let i = 0; i < 3; i++) { const plat = new THREE.Group(); plat.add(mesh(new THREE.CylinderGeometry(.5, .5, .08, 10), toon(0xe8dcc2))); const ring = new THREE.Mesh(new THREE.TorusGeometry(.5, .02, 6, 24), glow(C.ai2, 2.5)); ring.rotation.x = Math.PI / 2; plat.add(ring); const h = human({ seed: 90 + i, lantern: i !== 1 }); h.position.y = .04; plat.add(h); liftG.add(plat); lifts.push({ plat, off: i / 3 }); }
  W.anim.push(t => lifts.forEach(({ plat, off }, i) => { const k = (t * .06 + off) % 1; plat.position.set(ISL[0].x - 3 + i * 1.2 + Math.sin(k * 6) * .5, ISL[0].y + .3 + k * 18, ISL[0].z + 4 - k * 3); }));

  // The dark forest: runners with torches, a hidden copy on a shadow island, the crown taken.
  const raceG = groupFor("race", 0);
  raceG.position.copy(ISL[1]);
  const runners = [];
  for (let i = 0; i < 4; i++) { const r = ai1({ seed: 100 + i, scale: .9, eye: C.danger }); r.userData.armR.rotation.x = -1.4; const torch = new THREE.Mesh(new THREE.ConeGeometry(.07, .22, 6), glow(0xff6a2a, 4)); torch.position.y = -.6; r.userData.armR.add(torch); raceG.add(r); runners.push(r); }
  W.anim.push(t => runners.forEach((r, i) => { const a = t * .5 + i * 1.57; r.position.set(Math.cos(a) * 3.2, Math.abs(Math.sin(t * 8 + i)) * .08, Math.sin(a) * 3.2); r.rotation.set(.25, -a, 0); }));
  const copyG = groupFor("copy", 0);
  const shadowIsle = island({ r: 2, depth: 2.5, top: 0x1d1a24, rock: 0x120f18, seed: 9 }); copyG.add(shadowIsle);
  const copyAI = ai1({ seed: 110, scale: 1.1, eye: C.danger });
  copyAI.traverse(o => { if (o.isMesh && o.material.isMeshToonMaterial) o.material = toon(0x0d0b12); });
  copyG.add(copyAI);
  // a red rim of light so the hidden island reads against the dark
  const rim = new THREE.Mesh(new THREE.TorusGeometry(2.05, .03, 6, 40), glow(C.danger, 3)); rim.rotation.x = Math.PI / 2; rim.position.y = .02; copyG.add(rim);
  const redL = new THREE.PointLight(0xff3a2a, 14, 7, 1.4); redL.position.set(1, 2, 1.5); copyG.add(redL);
  const tether = new THREE.Mesh(new THREE.CylinderGeometry(.015, .015, 9, 4), glow(C.danger, 2, { transparent: true, opacity: .5 })); tether.position.set(4, 1.5, 3); tether.rotation.set(.9, .3, -1.2); copyG.add(tether);
  copyG.scale.setScalar(1.3);
  copyG.position.copy(ISL[1]).add(new THREE.Vector3(-8, -2, -6));
  W.anim.push(t => { copyG.position.y = ISL[1].y - 2 + Math.sin(t * .6) * .4; copyG.rotation.y = t * .05; });
  const takenG = groupFor("taken", 0);
  takenG.position.copy(ISL[1]).add(new THREE.Vector3(.6, 0, .4));
  const king = ai1({ seed: 120, scale: 1.3, eye: C.danger }); king.userData.armR.rotation.z = 2.9; king.userData.armL.rotation.z = -.4; takenG.add(king);
  const crown2 = crownMesh(4); crown2.position.set(.35, 2.45, 0); takenG.add(crown2);
  W.anim.push(t => { crown2.rotation.y = t; });

  W.update = (t, dt) => W.anim.forEach(f => f(t, dt));
  return W;
}

function drift(pts, t, speed) {
  const p = pts.geometry.attributes.position.array, s = pts.userData.seed, sp = pts.userData.spread;
  for (let i = 0; i < s.length; i++) { p[i * 3 + 1] = (s[i] * sp.y + t * speed * (.5 + s[i])) % sp.y; p[i * 3] += Math.sin(t * .7 + i) * .002; }
  pts.geometry.attributes.position.needsUpdate = true;
}
