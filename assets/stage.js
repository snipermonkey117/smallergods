// three.js stage: turns each scene's paper layers into a lit parallax diorama, and drifts embers behind the page.
// One renderer draws every visible scene into its <figure> rect (scissor), so there is a single WebGL context.
// If anything fails, the flat SVG fallback drawn by puppets.js stays visible.
import * as THREE from "three";

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const DPR = Math.min(devicePixelRatio || 1, 1.75);
const W = 8, H = 4, FOV = 30, D = (H / 2) / Math.tan((FOV / 2) * Math.PI / 180); // camera distance that frames a 8×4 plane exactly
const OVER = 1.07; // layers are oversized so parallax never reveals an edge

function softDot(inner, outer) {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const g = c.getContext("2d"), r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, inner); r.addColorStop(.35, outer); r.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const GLOW = softDot("rgba(255,224,150,1)", "rgba(240,170,70,.5)");
const DOT = softDot("rgba(255,236,190,1)", "rgba(255,190,90,.6)");

function svgTexture(svg) {
  return new Promise((ok, fail) => {
    const img = new Image();
    img.onload = () => { const t = new THREE.Texture(img); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.needsUpdate = true; ok(t); };
    img.onerror = fail;
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  });
}

// Parchment sky: gradient toward the light source, paper fibres, stains and a burnt edge.
const skyMaterial = (c, sun) => new THREE.ShaderMaterial({
  uniforms: { t: { value: 0 }, c0: { value: new THREE.Color(c[0]) }, c1: { value: new THREE.Color(c[1]) }, c2: { value: new THREE.Color(c[2]) }, sun: { value: new THREE.Vector2(sun[0] / 800, 1 - sun[1] / 400) } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `
    varying vec2 vUv; uniform float t; uniform vec3 c0,c1,c2; uniform vec2 sun;
    float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
    float n(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y); }
    float fbm(vec2 p){ float v=0.,a=.5; for(int i=0;i<5;i++){ v+=a*n(p); p*=2.03; a*=.5; } return v; }
    void main(){
      vec2 uv=vUv; vec2 q=(uv-sun)*vec2(2.,1.);
      float d=length(q);
      vec3 col=mix(c0,c1,smoothstep(.0,.55,d));
      col=mix(col,c2,smoothstep(.45,1.25,d));
      float fib=fbm(uv*vec2(60.,14.)); col*=.94+.1*fib;
      float st=fbm(uv*3.+vec2(t*.01,0.)); col=mix(col,col*.82,smoothstep(.55,.8,st)*.5);
      float cloud=fbm(uv*vec2(4.,2.)+vec2(t*.02,t*.004)); col+=c0*.08*smoothstep(.45,.75,cloud);
      gl_FragColor=vec4(col,1.);
      #include <colorspace_fragment>
    }`
});
// Vignette, burnt edge and film grain over the whole scene.
const veilMaterial = () => new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, uniforms: { t: { value: 0 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `
    varying vec2 vUv; uniform float t;
    float h(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
    void main(){
      vec2 c=vUv-.5; c.x*=1.6;
      float v=smoothstep(.45,1.0,length(c));
      float e=min(min(vUv.x,1.-vUv.x),min(vUv.y,1.-vUv.y)); float edge=1.-smoothstep(0.,.025,e);
      float g=h(vUv*vec2(1600.,800.)+fract(t*13.))-.5;
      gl_FragColor=vec4(vec3(.08,.05,.02), clamp(v*.62+edge*.55+g*.06,0.,1.));
    }`
});

const items = [];
function toPlane(x, y, z) { const s = (D - z) / D * OVER; return new THREE.Vector3((x / 800 - .5) * W * s, (.5 - y / 400) * H * s, z); }

async function buildScene(svg, def) {
  const fig = svg.closest("figure");
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 2, .1, 50); camera.position.set(0, 0, D);
  const sky = window.SG.SKY[def.sky];
  const plane = (z, mat) => { const s = (D - z) / D * OVER; const m = new THREE.Mesh(new THREE.PlaneGeometry(W * s, H * s), mat); m.position.z = z; scene.add(m); return m; };
  const back = plane(-2.6, skyMaterial(sky.c, def.sun));
  const [far, mid, near] = await Promise.all(["far", "mid", "near"].map(k => svgTexture(window.SG.layerSVG(def[k] || "", 2))));
  const layer = (tex, z) => plane(z, new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
  const lFar = layer(far, -1.3), lMid = layer(mid, 0);
  const glows = def.glows.map(([x, y, r], i) => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: .85 }));
    sp.position.copy(toPlane(x, y, .05)); const s = r / 800 * W * 2.4; sp.scale.set(s, s, 1); sp.userData = { s, i };
    scene.add(sp); return sp;
  });
  // Embers rise from each source; dust drifts across the whole frame.
  const emberSrc = def.embers, EN = emberSrc.length ? 26 * emberSrc.length : 0;
  let embers = null, eData = [];
  if (EN) {
    const g = new THREE.BufferGeometry(), pos = new Float32Array(EN * 3); g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    embers = new THREE.Points(g, new THREE.PointsMaterial({ map: DOT, size: .055, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: .9 }));
    for (let i = 0; i < EN; i++) { const s = emberSrc[i % emberSrc.length]; eData.push({ src: toPlane(s[0], s[1], .1), rate: s[2], life: Math.random(), vx: (Math.random() - .5) * .9, ph: Math.random() * 6 }); }
    scene.add(embers);
  }
  const DN = 70, dg = new THREE.BufferGeometry(), dpos = new Float32Array(DN * 3);
  for (let i = 0; i < DN; i++) { dpos[i * 3] = (Math.random() - .5) * W; dpos[i * 3 + 1] = (Math.random() - .5) * H; dpos[i * 3 + 2] = -.8 + Math.random() * 1.2; }
  dg.setAttribute("position", new THREE.BufferAttribute(dpos, 3));
  const dust = new THREE.Points(dg, new THREE.PointsMaterial({ map: DOT, size: .03, transparent: true, opacity: def.sky === "night" ? .5 : .35, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(dust);
  const lNear = layer(near, .55);
  const veil = plane(1.2, veilMaterial());
  // Captions move from SVG text to HTML so they stay crisp above the canvas.
  const cap = document.createElement("div"); cap.className = "captions";
  cap.innerHTML = def.labels.map(([x, y, t, dark]) => `<span class="${dark ? "dark" : ""}" style="left:${x / 8}%;top:${y / 4}%">${t}</span>`).join("");
  fig.appendChild(cap);
  fig.classList.add("gl");
  items.push({ fig, scene, camera, back, lFar, lMid, lNear, veil, glows, embers, eData, dust, seed: Math.random() * 10 });
}

// Full-page ambient embers behind the text.
function ambient() {
  const c = document.createElement("canvas"); c.id = "ambient"; c.setAttribute("aria-hidden", "true"); document.body.prepend(c);
  const r = new THREE.WebGLRenderer({ canvas: c, alpha: true, antialias: false }); r.setPixelRatio(Math.min(DPR, 1.5));
  const s = new THREE.Scene(), cam = new THREE.PerspectiveCamera(50, 1, .1, 100); cam.position.z = 10;
  const N = innerWidth < 700 ? 60 : 140, g = new THREE.BufferGeometry(), p = new Float32Array(N * 3), v = [];
  for (let i = 0; i < N; i++) { p[i * 3] = (Math.random() - .5) * 26; p[i * 3 + 1] = (Math.random() - .5) * 16; p[i * 3 + 2] = (Math.random() - .5) * 8; v.push(.15 + Math.random() * .35); }
  g.setAttribute("position", new THREE.BufferAttribute(p, 3));
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ map: DOT, size: .12, transparent: true, opacity: .5, blending: THREE.AdditiveBlending, depthWrite: false }));
  s.add(pts);
  const size = () => { r.setSize(innerWidth, innerHeight, false); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); };
  size(); addEventListener("resize", size);
  return (t, dt, mx, my, sy) => {
    for (let i = 0; i < N; i++) { p[i * 3 + 1] += v[i] * dt; p[i * 3] += Math.sin(t * .3 + i) * .002; if (p[i * 3 + 1] > 8) p[i * 3 + 1] = -8; }
    g.attributes.position.needsUpdate = true;
    cam.position.x = mx * .6; cam.position.y = my * .4 - sy * .0006;
    r.render(s, cam);
  };
}

function start() {
  const canvas = document.createElement("canvas"); canvas.id = "stage"; canvas.setAttribute("aria-hidden", "true"); document.body.appendChild(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(DPR); renderer.setScissorTest(true); renderer.setClearColor(0x000000, 0);
  const size = () => renderer.setSize(innerWidth, innerHeight, false);
  size(); addEventListener("resize", size);
  const drawAmbient = ambient();

  // Build scenes lazily as they approach the viewport.
  const pending = new Map(window.SG.scenes);
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const svg = e.target, def = pending.get(svg); if (!def) return;
    pending.delete(svg); io.unobserve(svg);
    buildScene(svg, def).catch(err => console.warn("scene fell back to SVG", err));
  }), { rootMargin: "800px 0px" });
  pending.forEach((_, svg) => io.observe(svg));

  let mx = 0, my = 0, tx = 0, ty = 0;
  addEventListener("pointermove", e => { tx = e.clientX / innerWidth * 2 - 1; ty = e.clientY / innerHeight * 2 - 1; }, { passive: true });
  let last = performance.now(), visible = true;
  document.addEventListener("visibilitychange", () => { visible = !document.hidden; last = performance.now(); });

  function frame(now) {
    requestAnimationFrame(frame);
    if (!visible) return;
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    const t = reduce ? 0 : now / 1000;
    mx += (tx - mx) * .05; my += (ty - my) * .05;
    const vh = innerHeight;
    drawAmbient(t, reduce ? 0 : dt, reduce ? 0 : mx, reduce ? 0 : my, scrollY);
    renderer.setScissor(0, 0, innerWidth, vh); renderer.setViewport(0, 0, innerWidth, vh); renderer.clear();
    for (const it of items) {
      const r = it.fig.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh || r.width < 2) continue;
      const k = ((r.top + r.height / 2) - vh / 2) / vh; // -1 above centre … +1 below
      it.camera.aspect = r.width / r.height; it.camera.updateProjectionMatrix();
      it.camera.position.x = reduce ? 0 : mx * .16;
      it.camera.position.y = reduce ? 0 : -my * .08 + k * .22;
      it.camera.lookAt(0, 0, -.6);
      it.back.material.uniforms.t.value = t; it.veil.material.uniforms.t.value = t;
      it.lFar.position.x = Math.sin(t * .05 + it.seed) * .05;
      it.lNear.position.y = Math.sin(t * .4 + it.seed) * .012;
      it.glows.forEach(g => { const f = 1 + Math.sin(t * 7 + g.userData.i * 3) * .04 + Math.sin(t * 2.3 + g.userData.i) * .05; g.scale.set(g.userData.s * f, g.userData.s * f, 1); });
      if (it.embers) {
        const p = it.embers.geometry.attributes.position.array;
        it.eData.forEach((e, i) => {
          e.life += dt * (.35 + e.rate * .25); if (e.life > 1) { e.life = 0; e.vx = (Math.random() - .5) * .9; }
          p[i * 3] = e.src.x + e.vx * e.life * e.life + Math.sin(t * 1.7 + e.ph) * .07 * e.life;
          p[i * 3 + 1] = e.src.y + e.life * (.35 + e.rate * .25) * (1 + .4 * Math.sin(e.ph));
          p[i * 3 + 2] = e.src.z;
        });
        it.embers.geometry.attributes.position.needsUpdate = true;
      }
      const dp = it.dust.geometry.attributes.position.array;
      for (let i = 0; i < dp.length; i += 3) { dp[i] += Math.sin(t * .2 + i) * .0006; dp[i + 1] += .0008 * (reduce ? 0 : 1); if (dp[i + 1] > H / 2) dp[i + 1] = -H / 2; }
      it.dust.geometry.attributes.position.needsUpdate = true;
      const x = r.left, y = vh - r.bottom;
      renderer.setScissor(x, y, r.width, r.height); renderer.setViewport(x, y, r.width, r.height);
      renderer.render(it.scene, it.camera);
    }
  }
  requestAnimationFrame(frame);
}

try {
  const probe = document.createElement("canvas");
  if (window.SG && (probe.getContext("webgl2") || probe.getContext("webgl"))) start();
} catch (e) { console.warn("WebGL unavailable; keeping SVG scenes", e); }
