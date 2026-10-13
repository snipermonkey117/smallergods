// Shadow-puppet illustration kit. Every <svg data-scene="name"> on the page is drawn by SCENES[name].
(()=>{
const R=Math.PI/180, f1=n=>n.toFixed(1);

document.body.insertAdjacentHTML("afterbegin",`<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  <radialGradient id="parch" cx="50%" cy="45%" r="75%"><stop offset="0" style="stop-color:#e4cf9f"/><stop offset=".55" style="stop-color:#c9ad78"/><stop offset="1" style="stop-color:#6f5634"/></radialGradient>
  <radialGradient id="glow" cx="50%" cy="50%" r="50%"><stop offset="0" style="stop-color:#ffd98a;stop-opacity:.95"/><stop offset=".35" style="stop-color:#f0b350;stop-opacity:.55"/><stop offset="1" style="stop-color:#f0b350;stop-opacity:0"/></radialGradient>
  <radialGradient id="mist" cx="50%" cy="50%" r="50%"><stop offset="0" style="stop-color:#f6ead0;stop-opacity:.85"/><stop offset="1" style="stop-color:#f6ead0;stop-opacity:0"/></radialGradient>
  <filter id="rough" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="4"/></filter>
  <filter id="paper"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="9" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 0.25  0 0 0 0 0.17  0 0 0 0 0.08  0 0 0 0.55 0"/></filter>
  <filter id="blur6"><feGaussianBlur stdDeviation="6"/></filter>
  <filter id="blur2"><feGaussianBlur stdDeviation="2"/></filter>
</defs></svg>`);

function rot(px,py,cx,cy,deg){const a=deg*R,dx=px-cx,dy=py-cy;return{x:cx+dx*Math.cos(a)-dy*Math.sin(a),y:cy+dx*Math.sin(a)+dy*Math.cos(a)}}

// Hooded, long-cloaked figure standing on baseline b. Arms: [angle°, length as share of h, elbow bend°]; 0° = right, 90° = down.
function fig({x,b,h,arms=[],lean=0,hood=1,cls=""}){
  const w=h*.27, top=b-h, hem=b-h*.13, sh=top+h*.15, hy=top+h*.06;
  let s=`<g class="${cls}" transform="rotate(${lean} ${x} ${b})">`;
  s+=`<path class="sil" d="M${f1(x)},${f1(top+h*.08)} C${f1(x-w*.3)},${f1(top+h*.32)} ${f1(x-w*.5)},${f1(hem-h*.25)} ${f1(x-w*.62)},${f1(hem)} L${f1(x+w*.62)},${f1(hem)} C${f1(x+w*.48)},${f1(hem-h*.28)} ${f1(x+w*.28)},${f1(top+h*.32)} ${f1(x)},${f1(top+h*.08)}Z"/>`;
  const n=7, step=w*1.24/n;
  for(let i=0;i<n;i++){const px=x-w*.62+i*step;s+=`<path class="sil" d="M${f1(px)},${f1(hem-1)} L${f1(px+step*.5)},${f1(hem+h*.045*(i%2?1:.6))} L${f1(px+step)},${f1(hem-1)}Z"/>`}
  s+=`<ellipse class="sil" cx="${f1(x)}" cy="${f1(hy)}" rx="${f1(h*.048)}" ry="${f1(h*.064)}"/>`;
  if(hood)s+=`<path class="sil" d="M${f1(x-h*.055)},${f1(hy+h*.02)} Q${f1(x-h*.03)},${f1(top-h*.05)} ${f1(x+h*.1)},${f1(top-h*.02)} Q${f1(x+h*.03)},${f1(top+h*.03)} ${f1(x+h*.055)},${f1(hy+h*.04)}Z"/>`;
  const lw=Math.max(1.2,h*.016);
  s+=`<path class="arm" style="stroke-width:${f1(lw)}" d="M${f1(x-w*.14)},${f1(hem)} L${f1(x-w*.2)},${f1(b)} M${f1(x+w*.14)},${f1(hem)} L${f1(x+w*.22)},${f1(b)}"/>`;
  const hands=[];
  arms.forEach(([a,l,bend=0])=>{
    const L=h*l, sx=x+(Math.cos(a*R)<0?-1:1)*w*.1, sy=sh;
    const ex=sx+Math.cos(a*R)*L/2, ey=sy+Math.sin(a*R)*L/2, a2=a+bend;
    const hx=ex+Math.cos(a2*R)*L/2, hyy=ey+Math.sin(a2*R)*L/2;
    s+=`<path class="arm" style="stroke-width:${f1(lw*1.1)}" d="M${f1(sx)},${f1(sy)} L${f1(ex)},${f1(ey)} L${f1(hx)},${f1(hyy)}"/>`;
    [-28,0,28].forEach(k=>{const fl=h*.032;s+=`<path class="arm" style="stroke-width:${f1(lw*.6)}" d="M${f1(hx)},${f1(hyy)} l${f1(Math.cos((a2+k)*R)*fl)},${f1(Math.sin((a2+k)*R)*fl)}"/>`});
    hands.push(rot(hx,hyy,x,b,lean));
  });
  return{svg:s+"</g>",hands,top:rot(x,top,x,b,lean)};
}

const glow=(x,y,r,o=1)=>`<circle cx="${f1(x)}" cy="${f1(y)}" r="${r}" fill="url(#glow)" opacity="${o}"/>`;
const flame=(x,y,s)=>`<g class="flame">${glow(x,y-s*.6,s*3.2)}<path d="M${f1(x)},${f1(y-s*1.8)} C${f1(x+s*.8)},${f1(y-s*.9)} ${f1(x+s*.7)},${f1(y)} ${f1(x)},${f1(y)} C${f1(x-s*.7)},${f1(y)} ${f1(x-s*.8)},${f1(y-s*.9)} ${f1(x)},${f1(y-s*1.8)}Z" style="fill:#ffd27a"/></g>`;
const smoke=(x,y,rx,ry)=>`<ellipse class="smoke" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="url(#mist)" filter="url(#blur6)"/>`;
const crown=(x,y,s,c)=>`<path d="M${f1(x-s)},${f1(y)} L${f1(x-s)},${f1(y-s*.9)} L${f1(x-s*.5)},${f1(y-s*.45)} L${f1(x)},${f1(y-s*1.2)} L${f1(x+s*.5)},${f1(y-s*.45)} L${f1(x+s)},${f1(y-s*.9)} L${f1(x+s)},${f1(y)}Z" style="fill:${c}"/>`;
const label=(x,y,t,c="")=>`<text class="lbl-s ${c}" x="${x}" y="${y}" text-anchor="middle">${t}</text>`;
const GROUND=`<path class="sil" filter="url(#rough)" d="M-10,348 C150,336 300,352 450,342 C600,333 700,350 810,340 L810,410 L-10,410Z"/>`;
function stars(n=46){let s="";for(let i=0;i<n;i++){const x=(i*137.5)%800,y=(i*61.3)%170+8;s+=`<circle cx="${f1(x)}" cy="${f1(y)}" r="${i%5?1:1.8}" style="fill:#fff3d6" opacity=".55"/>`}return s}
function paint(svg,{bg="",fg="",top=""},ground=true){
  svg.innerHTML=`<rect width="800" height="400" fill="url(#parch)"/><rect width="800" height="400" filter="url(#paper)" opacity=".5"/>${bg}<g filter="url(#rough)">${fg}</g>${ground?GROUND:""}${top}<rect width="800" height="400" fill="none" stroke="#3b2a17" stroke-width="10" opacity=".55"/>`;
}
// Nested hands: a faint giant holds a god on its palm, that god holds a smaller one, and the smallest holds us.
function nestedGods(){
  const giant=fig({x:700,b:1050,h:1050,arms:[[150,.36,15]],cls:"ghost"});
  const gh=giant.hands[0];
  const mid=fig({x:gh.x,b:gh.y,h:150,arms:[[198,.55,-14]]}), mh=mid.hands[0];
  const small=fig({x:mh.x-2,b:mh.y,h:62,arms:[[200,.62,-14]]}), sh=small.hands[0];
  const us=fig({x:sh.x+2,b:sh.y,h:18,hood:0});
  const palm=(p,w)=>`<ellipse class="sil" cx="${f1(p.x)}" cy="${f1(p.y+1)}" rx="${w}" ry="${f1(w*.28)}"/>`;
  return{giant:giant.svg,gods:palm(mh,14)+palm(sh,7)+mid.svg+small.svg+us.svg,palm:palm(gh,26),gh,mh,sh,top:us.top};
}

const SCENES={
hero(svg){
  const N=nestedGods();
  paint(svg,{bg:`${smoke(120,330,160,30)}${smoke(420,360,200,26)}`,fg:N.palm+N.gods,
    top:`<g filter="url(#rough)" opacity=".75">${N.giant}</g>${smoke(700,60,170,40)}${label(N.sh.x-22,N.sh.y-26,"us","dark")}${label(N.mh.x-30,N.mh.y+86,"the gods we're making","dark")}${label(600,40,"and the hand that holds them?","dark")}`},false);
},
board(svg){
  const small=fig({x:235,b:345,h:125,arms:[[-12,.42,22],[100,.28,0]]});
  const giant=fig({x:620,b:345,h:315,lean:-9,arms:[[150,.62,-32],[96,.34,-8]]});
  const gp={x:378,y:262}, hand=giant.hands[0];
  paint(svg,{bg:`<circle cx="700" cy="70" r="34" style="fill:#f4e4bd" opacity=".75"/>${glow(700,70,90,.35)}${smoke(120,70,120,22)}${smoke(330,45,90,16)}`,
    fg:`<rect class="sil" x="320" y="270" width="210" height="9" rx="2"/><rect class="sil" x="338" y="279" width="7" height="66"/><rect class="sil" x="505" y="279" width="7" height="66"/><path class="sil" d="M345,270 l5,-14 l5,14Z M410,270 l4,-18 l4,18Z M440,270 l6,-11 l6,11Z M478,270 l4,-20 l4,20Z M500,270 l5,-12 l5,12Z"/>${small.svg}${giant.svg}<path d="M${f1(hand.x)},${f1(hand.y)} L${gp.x},${gp.y}" style="stroke:#f3c568" stroke-width="2" stroke-dasharray="2 5" opacity=".9"/>`,
    top:`${glow(gp.x,gp.y,46)}<circle cx="${gp.x}" cy="${gp.y}" r="7" style="fill:#ffd98a"/>${label(235,385,"the one who sees a little")}${label(620,385,"the one who sees it all")}`});
},
tower(svg){
  const f0=fig({x:105,b:342,h:84,arms:[[-60,.3,10]]}), f1_=fig({x:300,b:290,h:124,arms:[[150,.5,-18]]}), f2=fig({x:500,b:227,h:172,arms:[[150,.52,-18]]}), f3=fig({x:705,b:151,h:150,arms:[[150,.55,-18]],cls:"ghost"});
  paint(svg,{bg:`${smoke(700,40,170,50)}${smoke(620,90,120,30)}${smoke(760,110,110,28)}`,
    fg:`<path class="sil" d="M-10,410 L-10,342 L195,342 L198,292 L395,290 L398,228 L595,226 L598,152 L810,150 L810,410Z"/>${f0.svg}${f1_.svg}${f2.svg}`,
    top:`<g filter="url(#rough)">${f3.svg}</g>${smoke(690,10,160,40)}${label(100,380,"origin · humans")}${label(300,330,"+1 · today's AI")}${label(500,268,"+2 · near-omniscient")}${label(705,192,"+3 · unseen","gold")}`},false);
},
flame(svg){
  const A=fig({x:140,b:345,h:270,arms:[[18,.48,34],[100,.3,0]]}), B=fig({x:345,b:345,h:178,arms:[[205,.34,-25],[20,.4,32]]}), C=fig({x:495,b:345,h:116,arms:[[205,.36,-25],[22,.42,30]]}), D=fig({x:604,b:345,h:74,arms:[[205,.38,-25],[24,.46,28]]}), E=fig({x:682,b:345,h:46,arms:[[205,.4,-25],[-40,.36,0]]});
  const fl=[A.hands[0],B.hands[1],C.hands[1],D.hands[1],E.hands[1]], sz=[11,8,6,4.5,3.5];
  paint(svg,{bg:`${smoke(560,80,200,30)}${smoke(260,50,140,20)}`,fg:A.svg+B.svg+C.svg+D.svg+E.svg,
    top:fl.map((p,i)=>flame(p.x,p.y-2,sz[i])).join("")+label(400,385,"a successor that can raise a successor")});
},
crown(svg){
  const P=fig({x:330,b:345,h:240,lean:7,arms:[[-8,.56,12],[100,.3,-6]]});
  const fallen=fig({x:770,b:300,h:170,lean:-84}), usurper=fig({x:590,b:300,h:130,arms:[[-75,.42,10],[95,.25,0]]}), uh=usurper.hands[0];
  paint(svg,{bg:`<rect width="800" height="335" style="fill:#5a4024" opacity=".14"/><path d="M0,335 H800" style="stroke:#3b2a17" stroke-width="2" opacity=".5"/><g opacity=".42" filter="url(#blur2)" transform="translate(0,-20)">${fallen.svg}${usurper.svg}${crown(uh.x,uh.y-2,12,"var(--sil)")}</g>`,
    fg:`<rect class="sil" x="500" y="240" width="40" height="105"/><rect class="sil" x="492" y="236" width="56" height="8"/>${P.svg}`,
    top:`${glow(520,220,60)}${crown(520,234,22,"#e9b24f")}${label(330,385,"the one in the middle")}${label(660,60,"what it would teach its successor","dark")}`});
},
fire(svg){
  const L1=fig({x:140,b:348,h:222,lean:4,arms:[[38,.42,22]]}), L2=fig({x:258,b:350,h:244,lean:3,arms:[[48,.38,18]],hood:0}), R1=fig({x:548,b:350,h:238,lean:-3,arms:[[132,.38,-18]]}), R2=fig({x:666,b:348,h:214,lean:-4,arms:[[142,.42,-22]],hood:0});
  const blade=(x1,y1,x2,y2)=>{const mx=x1+(x2-x1)*.25,my=y1+(y2-y1)*.25,dx=(y2-y1)*.08,dy=-(x2-x1)*.08;return`<path class="arm" style="stroke-width:3" d="M${x1},${y1} L${x2},${y2} M${f1(mx-dx)},${f1(my-dy)} L${f1(mx+dx)},${f1(my+dy)}"/>`};
  const steps=[[440,250,40,14],[470,205,52,15],[505,160,62,16],[540,118,72,17],[580,78,84,18],[625,40,98,19]].map(a=>smoke(...a)).join("");
  paint(svg,{fg:`<ellipse class="sil" cx="400" cy="342" rx="44" ry="9"/>${L1.svg}${L2.svg}${R1.svg}${R2.svg}`,
    top:`<g filter="url(#rough)">${blade(296,343,352,326)+blade(312,326,364,345)+blade(446,326,502,344)+blade(436,345,490,327)}</g>${glow(400,315,120)}<g class="flame"><path d="M376,340 C372,312 392,300 384,276 C404,292 420,300 410,262 C434,292 432,318 424,340Z" style="fill:#ffd27a"/></g>${steps}${label(400,388,"blades down, one fire, many faces")}`});
},
watcher(svg){
  const giant=fig({x:610,b:770,h:720,arms:[[150,.5,-24]],cls:"ghost"});
  const W=fig({x:285,b:250,h:190,lean:-5,arms:[[-72,.46,-12],[40,.34,40]]}), k1=fig({x:323,b:254,h:52}), k2=fig({x:346,b:258,h:40}), k3=fig({x:248,b:252,h:46,hood:0});
  paint(svg,{bg:`<rect width="800" height="400" style="fill:#1f160d" opacity=".42"/>${stars()}`,
    fg:`<path class="sil" d="M-10,410 L-10,300 C120,238 300,226 410,268 C540,318 690,330 810,318 L810,410Z"/>${W.svg}${k1.svg}${k2.svg}${k3.svg}`,
    top:`<g class="ghost-light" opacity=".4">${giant.svg}</g>${smoke(560,60,200,40)}${smoke(700,140,140,30)}${label(285,300,"it shelters what is below")}${label(610,215,"and is watched from above","gold")}`},false);
},
// Ending: the fog lifts
glass(svg){
  const P=fig({x:400,b:345,h:250,arms:[[120,.3,10],[60,.3,-10]]}), top=345-250;
  let ribs="";for(let i=0;i<6;i++){const y=top+250*(.3+i*.1),hw=250*.27*(.25+i*.065);ribs+=`<path d="M${f1(400-hw)},${f1(y)} Q400,${f1(y-10)} ${f1(400+hw)},${f1(y)}" style="fill:none;stroke:#f3c568;stroke-width:1.4" opacity=".75"/>`}
  const a=fig({x:170,b:345,h:80,arms:[[-30,.5,10]]}), b=fig({x:250,b:345,h:64,arms:[[-40,.5,10]],hood:0}), c=fig({x:620,b:345,h:84,arms:[[210,.5,-10]]});
  paint(svg,{bg:`${smoke(140,60,150,24)}${smoke(640,50,150,24)}`,fg:P.svg+a.svg+b.svg+c.svg,
    top:`${glow(400,220,110,.8)}${ribs}${flame(a.hands[0].x,a.hands[0].y,5)}${flame(b.hands[0].x,b.hands[0].y,4)}${flame(c.hands[0].x,c.hands[0].y,5)}${label(400,388,"it let them see inside")}`});
},
ledger(svg){
  const L1=fig({x:150,b:345,h:230,arms:[[12,.5,20]]}), L2=fig({x:250,b:345,h:190,arms:[[20,.52,10]],hood:0}), R1=fig({x:560,b:345,h:205,arms:[[165,.5,-12]]}), R2=fig({x:660,b:345,h:240,arms:[[170,.52,-18]],hood:0});
  paint(svg,{bg:`${smoke(400,50,220,26)}`,
    fg:`<rect class="sil" x="200" y="268" width="400" height="9" rx="2"/><rect class="sil" x="220" y="277" width="7" height="68"/><rect class="sil" x="573" y="277" width="7" height="68"/>${L1.svg}${L2.svg}${R1.svg}${R2.svg}`,
    top:`${glow(400,258,90)}<rect x="330" y="252" width="140" height="14" rx="3" style="fill:#f1dfb2"/><path d="M342,257 H458 M342,261 H440" style="stroke:#8a6a3a" stroke-width="1"/>${label(400,388,"every copy counted, every promise bound")}`});
},
summit(svg){
  // The same nested hands as the opening, now lit: every level carries the one below it toward the light.
  const N=nestedGods();
  paint(svg,{bg:`<rect width="800" height="400" style="fill:#f6d88f" opacity=".18"/>${glow(560,90,300,.7)}`,fg:N.palm+N.gods,
    top:`<g opacity=".55">${N.giant}</g>${flame(N.sh.x+2,N.top.y-4,4)}${glow(N.mh.x,N.mh.y-70,70,.6)}${label(400,385,"each one carried by the one above","dark")}`},false);
},
// Ending: the dark forest
race(svg){
  const r=[[200,170],[330,190],[460,175],[640,215]].map(([x,h],i)=>fig({x,b:345,h,lean:16,arms:[[-20,.5,10]]}));
  const left=[fig({x:70,b:345,h:52}),fig({x:105,b:345,h:44,hood:0})];
  paint(svg,{bg:`<rect width="800" height="400" style="fill:#3a2412" opacity=".25"/>${smoke(300,50,200,20)}`,fg:r.map(f=>f.svg).join("")+left.map(f=>f.svg).join(""),
    top:r.map(f=>flame(f.hands[0].x,f.hands[0].y,6)).join("")+label(88,385,"left behind")+label(500,385,"the first to arrive takes the board")});
},
copy(svg){
  const P=fig({x:470,b:345,h:220,arms:[[10,.5,10]]}), C=fig({x:655,b:345,h:150,cls:"ghost ghost-light"});
  const camp=[fig({x:110,b:345,h:70}),fig({x:180,b:345,h:62,hood:0}),fig({x:250,b:345,h:74})];
  paint(svg,{bg:`<rect width="800" height="400" style="fill:#2a1a0e" opacity=".3"/>${stars(24)}`,
    fg:`<path class="sil" d="M560,345 C560,200 640,120 810,110 L810,345Z"/>${camp.map(f=>f.svg).join("")}${P.svg}`,
    top:`<g opacity=".7">${C.svg}</g>${glow(180,320,70)}${flame(180,340,9)}${label(180,385,"the others, counting")}${label(560,385,"a copy where no one could count it")}`});
},
taken(svg){
  const P=fig({x:380,b:345,h:215,arms:[[-95,.4,-6],[110,.3,0]]}), ch=P.hands[0];
  const fa=fig({x:440,b:336,h:70,lean:84}), fb=fig({x:322,b:336,h:62,lean:-84});
  const sh=[fig({x:640,b:310,h:190,arms:[[-95,.45,-6]]}),fig({x:720,b:310,h:120,arms:[[-120,.5,0]]})];
  paint(svg,{bg:`<rect width="800" height="335" style="fill:#5a4024" opacity=".14"/><g opacity=".4" filter="url(#blur2)">${sh.map(f=>f.svg).join("")}${crown(sh[0].hands[0].x,sh[0].hands[0].y,11,"var(--sil)")}</g>`,
    fg:P.svg,
    top:`<g filter="url(#rough)">${fa.svg}${fb.svg}</g>${glow(ch.x,ch.y-10,60)}${crown(ch.x,ch.y,18,"#e9b24f")}${label(380,388,"the makers, overthrown")}${label(680,40,"and its successor, watching","dark")}`});
}
};
document.querySelectorAll("svg[data-scene]").forEach(svg=>{const f=SCENES[svg.dataset.scene];f?f(svg):console.error("unknown scene",svg.dataset.scene)});
})();
