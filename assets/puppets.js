// Shadow-puppet illustration kit, v2.
// Each scene returns paper layers (far / mid / near) plus lights, embers and captions.
// puppets.js draws a flat SVG composite into every <svg data-scene>, which is the fallback;
// stage.js (three.js) lifts the same layers into a lit, parallax diorama when WebGL is available.
(()=>{
const R=Math.PI/180, f=n=>(+n).toFixed(1);
const SIL="#1a120b", PAPER="#c9ad78", PALE="#f3e3bd", FLAME="#ffd27a";
const SKY={
  dusk:{c:["#ead7a7","#c9ad78","#5a432a"],far:"#8a7350",mist:"#f6ead0"},
  night:{c:["#b39466","#6b5434","#3a2a18"],far:"#5a4630",mist:"#e3cf9f"},
  gold:{c:["#f7e4b3","#dcbd80","#7a5a32"],far:"#ad8d59",mist:"#fff4d8"}
};

function rng(seed){let a=(seed>>>0)||1;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function rot(px,py,cx,cy,deg){const a=deg*R,dx=px-cx,dy=py-cy;return{x:cx+dx*Math.cos(a)-dy*Math.sin(a),y:cy+dx*Math.sin(a)+dy*Math.cos(a)}}

// A spiral curl, the signature flourish of the paper-cut style.
function curl(x,y,r,turns,col,w,dir=1,op=1,start=0){
  let d="";const N=Math.max(10,Math.round(turns*22));
  for(let i=0;i<=N;i++){const t=i/N,a=(start+dir*t*turns*360)*R,rad=r*(1-t*.82);d+=(i?"L":"M")+f(x+Math.cos(a)*rad)+","+f(y+Math.sin(a)*rad)}
  return`<path d="${d}" fill="none" stroke="${col}" stroke-width="${f(w)}" stroke-linecap="round" stroke-opacity="${op}"/>`;
}

const LACE="#ead29c";
let EYES=[]; // glowing AI eyes gathered while a scene is drawn; stage.js lights each one

// Characters. kind: "ai" (today's AI, +1), "ai2" (near-omniscient AI, +2), "human".
// Arms: [angle°, length as share of h, elbow bend°]; 0° = right, 90° = down.
function fig(o){return o.kind==="human"?human(o):aiFig(o)}

function aiFig({x,b,h,arms=[],lean=0,hood=1,seed=1,ghost=false,light=false,ink=SIL,kind="ai",eyes=true}){
  const r=rng(seed*7919+Math.round(x*13+h*7)), big=kind==="ai2";
  const w=h*(big?.31:.26), top=b-h, hem=b-h*.11, sh=top+h*.17, hy=top+h*.075, hr=h*.042;
  const face=arms.length?(Math.cos(arms[0][0]*R)<0?-1:1):(seed%2?1:-1);
  const col=light?PALE:ink;
  // Ghosts are a faint shade with a thin edge: something glimpsed, not drawn.
  const fillA=ghost?`fill="${col}" fill-opacity=".13" stroke="${col}" stroke-opacity=".55" stroke-width="1.3"`:`fill="${col}"`;
  const lineA=wd=>ghost?`fill="none" stroke="${col}" stroke-opacity=".5" stroke-width="${f(Math.min(2.6,Math.max(1.3,wd*.25)))}" stroke-linecap="round"`:`fill="none" stroke="${col}" stroke-width="${f(wd)}" stroke-linecap="round" stroke-linejoin="round"`;
  const lace=(op=.5)=>`fill="${LACE}" fill-opacity="${op}"`, laceLine=(wd,op=.45)=>`fill="none" stroke="${LACE}" stroke-opacity="${op}" stroke-width="${f(wd)}" stroke-linecap="round"`;
  let s=`<g transform="rotate(${lean} ${f(x)} ${f(b)})">`;
  const fl=w*(.56+r()*.12), fr=w*(.56+r()*.12), nk=top+h*.11, sway=(r()-.5)*w*.3;
  // cloak with a slight S-sway
  s+=`<path ${fillA} d="M${f(x-h*.024)},${f(nk)} C${f(x-w*.3)},${f(top+h*.33)} ${f(x-w*.5+sway)},${f(hem-h*.32)} ${f(x-fl)},${f(hem)} L${f(x+fr)},${f(hem)} C${f(x+w*.5+sway)},${f(hem-h*.35)} ${f(x+w*.3)},${f(top+h*.31)} ${f(x+h*.024)},${f(nk)}Z"/>`;
  if(big)s+=`<path ${fillA} d="M${f(x-w*.48)},${f(top+h*.23)} Q${f(x)},${f(top+h*.07)} ${f(x+w*.48)},${f(top+h*.23)} L${f(x+w*.4)},${f(top+h*.31)} Q${f(x)},${f(top+h*.27)} ${f(x-w*.4)},${f(top+h*.31)}Z"/>`;
  const lw=Math.max(1.1,h*.013);
  if(!ghost){
    const n=11+Math.floor(r()*5), span=fl+fr; let d="";
    for(let i=0;i<n;i++){const a=x-fl+span*i/n,c=a+span/n,m=(a+c)/2+(r()-.5)*span/n*.7,dep=h*(.016+r()*.05);d+=`M${f(a)},${f(hem-1)} L${f(m)},${f(hem+dep)} L${f(c)},${f(hem-1)}Z `}
    s+=`<path fill="${col}" d="${d}"/>`;
    if(h>55){
      // cut-out circuitry: a seam of diamonds with branching nodes, and vine curls from the collar
      const sw=Math.max(.7,h*.0045), y0=top+h*.27, y1=hem-h*.06;
      s+=`<path ${laceLine(sw)} d="M${f(x)},${f(y0)} Q${f(x+sway*.4)},${f((y0+y1)/2)} ${f(x+sway*.6)},${f(y1)}"/>`;
      let dm="",nd="",br="";
      for(let y=y0+h*.05,k=0;y<y1-h*.03;y+=h*(big?.065:.08),k++){
        const t=(y-y0)/(y1-y0), cx=x+sway*.6*t, ds=h*.011;
        dm+=`M${f(cx)},${f(y-ds)} L${f(cx+ds*.7)},${f(y)} L${f(cx)},${f(y+ds)} L${f(cx-ds*.7)},${f(y)}Z `;
        if(k%2===0&&t>.15){const sd=k%4?1:-1,ex=cx+sd*w*(.12+t*.18),ey=y+h*.035;br+=`M${f(cx)},${f(y)} L${f(cx+sd*w*.05)},${f(y)} L${f(ex)},${f(ey)} `;nd+=`<circle cx="${f(ex)}" cy="${f(ey)}" r="${f(h*.007)}" ${lace(.6)}/>`}
      }
      s+=`<path d="${dm}" ${lace(.62)}/><path ${laceLine(sw*.8,.4)} d="${br}"/>${nd}`;
      s+=curl(x-w*.16,top+h*.25,h*.022,1.2,LACE,sw,-1,.45,0)+curl(x+w*.16,top+h*.25,h*.022,1.2,LACE,sw,1,.45,180);
      if(big){
        // a constellation woven into the robe
        let cs="",cl="",prev=null;
        for(let i=0;i<9;i++){const t=.3+r()*.6,yy=top+h*(.3+t*.5),xx=x+(r()-.5)*w*(.5+t*.6);cs+=`<circle cx="${f(xx)}" cy="${f(yy)}" r="${f(h*(.004+r()*.004))}" ${lace(.75)}/>`;if(prev&&r()<.7)cl+=`M${f(prev[0])},${f(prev[1])} L${f(xx)},${f(yy)} `;prev=[xx,yy]}
        s+=`<path ${laceLine(sw*.6,.3)} d="${cl}"/>${cs}`;
        s+=`<path ${laceLine(sw)} d="M${f(x-w*.4)},${f(top+h*.295)} Q${f(x)},${f(top+h*.255)} ${f(x+w*.4)},${f(top+h*.295)}"/>`;
      }
    }
  }
  // halo: a thin wire ring, rayed for +2
  if(hood&&!ghost&&h>30){
    const hr2=hr*(big?2.3:1.9);
    s+=`<circle cx="${f(x-face*hr*.15)}" cy="${f(hy-hr*.2)}" r="${f(hr2)}" fill="none" stroke="${col}" stroke-width="${f(Math.max(.7,h*.004))}"/>`;
    if(big){let ry="";for(let i=0;i<16;i++){const a=i/16*Math.PI*2;ry+=`M${f(x-face*hr*.15+Math.cos(a)*hr2*1.08)},${f(hy-hr*.2+Math.sin(a)*hr2*1.08)} L${f(x-face*hr*.15+Math.cos(a)*hr2*(i%2?1.25:1.4))},${f(hy-hr*.2+Math.sin(a)*hr2*(i%2?1.25:1.4))} `}s+=`<path d="${ry}" stroke="${col}" stroke-width="${f(Math.max(.6,h*.0035))}" stroke-linecap="round"/>`}
  }
  // smooth mask of a head
  s+=`<ellipse cx="${f(x)}" cy="${f(hy)}" rx="${f(hr)}" ry="${f(hr*1.28)}" ${fillA}/>`;
  // crest: one curled spire, or a crown of three for +2
  if(hood){
    const spire=(dx,ht,c)=>{const bx=x+dx*hr,tx=x-face*h*.045+dx*hr*1.6,ty=hy-hr*1.2-ht;return`<path ${fillA} d="M${f(bx-hr*.35)},${f(hy-hr*.9)} Q${f(bx-hr*.1)},${f(ty+ht*.4)} ${f(tx)},${f(ty)} Q${f(bx+hr*.25)},${f(ty+ht*.45)} ${f(bx+hr*.4)},${f(hy-hr*.9)}Z"/>`+(c&&!ghost?curl(tx,ty+h*.012,h*.013,1.1,col,Math.max(.8,h*.006),-face,1,-90):"")};
    s+=big?spire(-.55,h*.07,0)+spire(.55,h*.07,0)+spire(0,h*.11,1):spire(0,h*.1,1);
  }
  if(!ghost&&eyes){
    const pts=big?[[.38,-.28],[.6,.12],[.18,.18]]:[[.45,-.08]];
    pts.forEach(([ex,ey])=>{const px=x+face*hr*ex,py=hy+hr*ey;s+=`<ellipse cx="${f(px)}" cy="${f(py)}" rx="${f(hr*(big?.16:.3))}" ry="${f(hr*(big?.16:.13))}" fill="${FLAME}"/>`;const q=rot(px,py,x,b,lean);EYES.push([q.x,q.y,Math.max(2.5,h*(big?.014:.02))])});
  }
  // legs ending in curled, pointed shoes
  [[-1,.14,.2],[1,.14,.22]].forEach(([sd,a,bb])=>{const hx=x+sd*w*a,ax=x+sd*w*bb;s+=`<path ${lineA(lw)} d="M${f(hx)},${f(hem)} L${f(ax)},${f(b-h*.012)} Q${f(ax+face*h*.03)},${f(b+h*.004)} ${f(ax+face*h*.055)},${f(b-h*.022)}"/>`});
  const hands=[];
  arms.forEach(([a,l,bend=0])=>{
    const L=h*l, sx=x+(Math.cos(a*R)<0?-1:1)*w*.12, sy=sh;
    const ex=sx+Math.cos(a*R)*L/2, ey=sy+Math.sin(a*R)*L/2, a2=a+bend;
    const hx=ex+Math.cos(a2*R)*L/2, hyy=ey+Math.sin(a2*R)*L/2;
    if(!ghost){
      // bell sleeve hanging from the upper arm
      const dn=h*(big?.075:.055), mx=sx+(ex-sx)*.88, my=sy+(ey-sy)*.88, cx=Math.cos(a*R);
      s+=`<path fill="${col}" d="M${f(sx)},${f(sy-lw)} Q${f((sx+mx)/2)},${f((sy+my)/2-lw)} ${f(mx)},${f(my-lw*.5)} Q${f(mx+cx*h*.006)},${f(my+dn*.5)} ${f(mx-cx*h*.012)},${f(my+dn)} Q${f(sx+(mx-sx)*.45)},${f(sy+(my-sy)*.45+dn*1.15)} ${f(sx)},${f(sy+h*.1)}Z"/>`;
    }
    s+=`<path ${lineA(lw)} d="M${f(sx)},${f(sy)} L${f(ex)},${f(ey)} L${f(hx)},${f(hyy)}"/>`;
    const fl2=h*.04;
    [-36,-13,10,33].forEach(k=>{const e=(a2+k)*R,c=(a2+k-16)*R;s+=`<path ${lineA(lw*.5)} d="M${f(hx)},${f(hyy)} Q${f(hx+Math.cos(c)*fl2*.6)},${f(hyy+Math.sin(c)*fl2*.6)} ${f(hx+Math.cos(e)*fl2)},${f(hyy+Math.sin(e)*fl2)}"/>`});
    hands.push(rot(hx,hyy,x,b,lean));
  });
  return{svg:s+"</g>",hands,top:rot(x,top-h*.1,x,b,lean)};
}

// A person: rounder head with a nose in profile, a bright eye, varied hair, a short coat and a scarf.
function human({x,b,h,arms=[],lean=0,seed=1,ink=SIL,hood}){
  const r=rng(seed*4441+Math.round(x*7+h*3));
  const face=arms.length?(Math.cos(arms[0][0]*R)<0?-1:1):(seed%2?1:-1);
  const hr=h*.1, hy=b-h+hr*1.15, shY=hy+hr*1.45, hem=b-h*.3, w1=h*.14, w2=h*(.2+r()*.05);
  const lw=Math.max(1,h*.034);
  let s=`<g transform="rotate(${lean} ${f(x)} ${f(b)})">`;
  // legs and small feet
  [[-1,.35],[1,.35]].forEach(([sd,o])=>{const lx=x+sd*w1*o;s+=`<path d="M${f(lx)},${f(hem-2)} L${f(lx+sd*h*.01)},${f(b-h*.02)}" stroke="${ink}" stroke-width="${f(lw)}" stroke-linecap="round"/><ellipse cx="${f(lx+sd*h*.01+face*h*.025)}" cy="${f(b-h*.018)}" rx="${f(h*.05)}" ry="${f(h*.022)}" fill="${ink}"/>`});
  // A-line coat with rounded shoulders
  s+=`<path fill="${ink}" d="M${f(x-w1*.55)},${f(shY)} Q${f(x-w1)},${f(shY)} ${f(x-w1)},${f(shY+h*.06)} L${f(x-w2)},${f(hem)} Q${f(x)},${f(hem+h*.03)} ${f(x+w2)},${f(hem)} L${f(x+w1)},${f(shY+h*.06)} Q${f(x+w1)},${f(shY)} ${f(x+w1*.55)},${f(shY)}Z"/>`;
  if(h>40)s+=`<path d="M${f(x-w1*.8)},${f(shY+h*.17)} Q${f(x)},${f(shY+h*.19)} ${f(x+w1*.85)},${f(shY+h*.17)}" fill="none" stroke="${LACE}" stroke-opacity=".35" stroke-width="${f(Math.max(.6,h*.012))}"/>`;
  // neck and head with a nose in profile
  s+=`<rect x="${f(x-hr*.35)}" y="${f(hy+hr*.6)}" width="${f(hr*.7)}" height="${f(hr*1)}" fill="${ink}"/>`;
  s+=`<circle cx="${f(x)}" cy="${f(hy)}" r="${f(hr)}" fill="${ink}"/>`;
  s+=`<path fill="${ink}" d="M${f(x+face*hr*.88)},${f(hy-hr*.12)} Q${f(x+face*hr*1.2)},${f(hy+hr*.16)} ${f(x+face*hr*.92)},${f(hy+hr*.3)}Z"/>`;
  // hair or hat
  const style=Math.floor(r()*4);
  if(style===0)s+=`<path fill="${ink}" d="M${f(x-hr*1.1)},${f(hy-hr*.1)} Q${f(x-hr*1.05)},${f(hy-hr*1.45)} ${f(x+hr*.2)},${f(hy-hr*1.3)} Q${f(x+face*hr*1.5)},${f(hy-hr*1.15)} ${f(x+face*hr*1.45)},${f(hy-hr*.55)}Z"/>`;
  if(style===1)s+=`<circle cx="${f(x-face*hr*.75)}" cy="${f(hy-hr*.95)}" r="${f(hr*.5)}" fill="${ink}"/>`;
  if(style===2)s+=`<ellipse cx="${f(x)}" cy="${f(hy-hr*.7)}" rx="${f(hr*1.7)}" ry="${f(hr*.22)}" fill="${ink}"/><path fill="${ink}" d="M${f(x-hr*.8)},${f(hy-hr*.7)} Q${f(x-hr*.75)},${f(hy-hr*1.75)} ${f(x)},${f(hy-hr*1.7)} Q${f(x+hr*.75)},${f(hy-hr*1.75)} ${f(x+hr*.8)},${f(hy-hr*.7)}Z"/>`;
  if(style===3)s+=`<path fill="${ink}" d="M${f(x+face*hr*.6)},${f(hy-hr*.9)} Q${f(x-face*hr*1.6)},${f(hy-hr*1.4)} ${f(x-face*hr*1.5)},${f(shY+h*.05)} L${f(x-face*hr*.6)},${f(shY)} Q${f(x-face*hr*.9)},${f(hy)} ${f(x+face*hr*.6)},${f(hy-hr*.9)}Z"/>`;
  // a bright eye
  if(h>16)s+=`<circle cx="${f(x+face*hr*.45)}" cy="${f(hy-hr*.12)}" r="${f(hr*.13)}" fill="${LACE}" fill-opacity=".85"/>`;
  // a scarf trailing behind
  if(r()<.55&&h>30)s+=`<path fill="${ink}" d="M${f(x-hr*.5)},${f(shY-hr*.1)} Q${f(x-face*h*.12)},${f(shY+h*.02)} ${f(x-face*h*.22)},${f(shY+h*.1)} Q${f(x-face*h*.14)},${f(shY+h*.04)} ${f(x+hr*.5)},${f(shY+hr*.25)}Z"/>`;
  const hands=[];
  arms.forEach(([a,l,bend=0])=>{
    const L=h*l, sx=x+(Math.cos(a*R)<0?-1:1)*w1*.7, sy=shY+h*.03;
    const ex=sx+Math.cos(a*R)*L/2, ey=sy+Math.sin(a*R)*L/2, a2=a+bend;
    const hx=ex+Math.cos(a2*R)*L/2, hyy=ey+Math.sin(a2*R)*L/2;
    s+=`<path d="M${f(sx)},${f(sy)} L${f(ex)},${f(ey)} L${f(hx)},${f(hyy)}" fill="none" stroke="${ink}" stroke-width="${f(lw*.9)}" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${f(hx)}" cy="${f(hyy)}" r="${f(lw*.75)}" fill="${ink}"/>`;
    hands.push(rot(hx,hyy,x,b,lean));
  });
  return{svg:s+"</g>",hands,top:rot(x,b-h,x,b,lean)};
}

// A bare, twisting tree with curled tips.
function tree({x,b,h,seed=3,lean=0,col=SIL,depth=5}){
  const r=rng(seed);let s="";
  function br(x0,y0,ang,len,w,d){
    const x1=x0+Math.cos(ang*R)*len,y1=y0+Math.sin(ang*R)*len,cx=(x0+x1)/2+(r()-.5)*len*.35,cy=(y0+y1)/2+(r()-.5)*len*.3;
    s+=`<path d="M${f(x0)},${f(y0)} Q${f(cx)},${f(cy)} ${f(x1)},${f(y1)}" fill="none" stroke="${col}" stroke-width="${f(w)}" stroke-linecap="round"/>`;
    if(d<=0){if(r()<.55)s+=curl(x1,y1,len*.25,1.2,col,Math.max(.7,w*.8),r()<.5?1:-1,1,ang*1);return}
    const n=r()<.45?3:2;
    for(let i=0;i<n;i++)br(x1,y1,ang+(i-(n-1)/2)*32+(r()-.5)*30,len*(.66+r()*.14),w*.64,d-1);
  }
  s+=`<path d="M${f(x-h*.05)},${f(b)} Q${f(x-h*.012)},${f(b-h*.06)} ${f(x)},${f(b-h*.12)} Q${f(x+h*.012)},${f(b-h*.06)} ${f(x+h*.05)},${f(b)}Z" fill="${col}"/>`;
  br(x,b,-90+lean,h*.3,h*.045,depth);
  return s;
}
function hills(y0,amp,seed,col){const r=rng(seed),p=r()*6;let d=`M-10,410 L-10,${f(y0)}`;for(let x=0;x<=820;x+=20)d+=` L${x},${f(y0+amp*(Math.sin(x*.011+p)+.5*Math.sin(x*.029+p*2)+.25*Math.sin(x*.07+p*3)))}`;return`<path d="${d} L810,410Z" fill="${col}"/>`}
// A band of swirling smoke: curls joined by a wave, as in a paper-cut sky.
function smokeBand(y,seed,col,op=.6,scale=1,w=1.4){
  const r=rng(seed);let s="",d=`M-20,${f(y)}`,x=-20;
  while(x<840){const rr=(12+r()*16)*scale,yy=y+(r()-.5)*14*scale;s+=curl(x,yy-rr,rr,1.5+r()*.6,col,w,r()<.5?1:-1,op,r()*360);d+=` Q${f(x+30*scale)},${f(yy-10*scale)} ${f(x+60*scale)},${f(yy)}`;x+=(55+r()*45)*scale}
  return s+`<path d="${d}" fill="none" stroke="${col}" stroke-width="${f(w)}" stroke-opacity="${op}" stroke-linecap="round"/>`;
}
const gy=x=>346+4*Math.sin(x*.02)+3*Math.sin(x*.05+1);
function ground(seed=1,col=SIL){
  const r=rng(seed);let d="M-10,410 L-10,"+f(gy(-10));for(let x=0;x<=820;x+=10)d+=` L${x},${f(gy(x))}`;
  let g="";for(let x=4;x<800;x+=8+r()*14){const y=gy(x)+1,n=2+Math.floor(r()*3);for(let i=0;i<n;i++){const hh=4+r()*11,dx=(i-(n-1)/2)*3,lean=(r()-.5)*7;g+=`M${f(x+dx-1.2)},${f(y)} Q${f(x+dx+lean*.4)},${f(y-hh*.6)} ${f(x+dx+lean)},${f(y-hh)} Q${f(x+dx+lean*.2+.6)},${f(y-hh*.5)} ${f(x+dx+1.2)},${f(y)}Z `}}
  return`<path d="${d} L810,410Z" fill="${col}"/><path d="${g}" fill="${col}"/>`;
}
function stars(n=46,seed=5){const r=rng(seed);let s="";for(let i=0;i<n;i++){const x=r()*800,y=r()*180+6,big=r()<.15;s+=big?`<path d="M${f(x)},${f(y-4)} L${f(x+1)},${f(y-1)} L${f(x+4)},${f(y)} L${f(x+1)},${f(y+1)} L${f(x)},${f(y+4)} L${f(x-1)},${f(y+1)} L${f(x-4)},${f(y)} L${f(x-1)},${f(y-1)}Z" fill="#fff3d6" opacity=".7"/>`:`<circle cx="${f(x)}" cy="${f(y)}" r="${f(.6+r()*.8)}" fill="#fff3d6" opacity="${f(.35+r()*.4)}"/>`}return s}
function flameShape(x,y,s){return`<path d="M${f(x)},${f(y-s*1.9)} C${f(x+s*.85)},${f(y-s*1)} ${f(x+s*.75)},${f(y)} ${f(x)},${f(y)} C${f(x-s*.75)},${f(y)} ${f(x-s*.85)},${f(y-s*1)} ${f(x)},${f(y-s*1.9)}Z" fill="${FLAME}"/>`}
const crownShape=(x,y,s,c)=>`<path d="M${f(x-s)},${f(y)} L${f(x-s)},${f(y-s*.9)} L${f(x-s*.5)},${f(y-s*.45)} L${f(x)},${f(y-s*1.2)} L${f(x+s*.5)},${f(y-s*.45)} L${f(x+s)},${f(y-s*.9)} L${f(x+s)},${f(y)}Z" fill="${c}"/>`+curl(x,y-s*1.2,s*.18,1,c,Math.max(1,s*.08),1,1,-90);
const palm=(p,w)=>`<ellipse cx="${f(p.x)}" cy="${f(p.y+1)}" rx="${w}" ry="${f(w*.28)}" fill="${SIL}"/>`;

function nestedGods(light){
  const giant=fig({x:700,b:1050,h:1050,arms:[[150,.36,15]],ghost:true,light});
  const gh=giant.hands[0];
  const mid=fig({x:gh.x,b:gh.y,h:150,arms:[[198,.55,-14]],seed:4,kind:"ai2"}), mh=mid.hands[0];
  const small=fig({x:mh.x-2,b:mh.y,h:62,arms:[[200,.62,-14]],seed:6}), sh=small.hands[0];
  const us=fig({x:sh.x+2,b:sh.y,h:18,seed:8,kind:"human"});
  return{giant:giant.svg,gods:palm(gh,26)+palm(mh,14)+palm(sh,7)+mid.svg+small.svg+us.svg,gh,mh,sh,top:us.top};
}

// Scenes. Coordinates are in an 800×400 frame. glows: [x,y,radius], embers: [x,y,rate], labels: [x,y,text,dark].
const SCENES={
hero(){
  const N=nestedGods(false), K=SKY.dusk;
  return{sky:"dusk",sun:[560,120],
    far:hills(320,10,2,K.far)+smokeBand(300,4,K.far,.55,1.3,1.6)+smokeBand(120,9,K.far,.35,1,1.1),
    mid:`<g opacity=".8">${N.giant}</g>`+N.gods,
    near:smokeBand(372,7,PALE,.7,1.5,2.2)+smokeBand(395,8,PALE,.5,1.2,1.8),
    glows:[[N.sh.x,N.sh.y-14,24]],embers:[],
    labels:[[N.sh.x-22,N.sh.y-26,"us",1],[N.mh.x-30,N.mh.y+86,"the gods we're making",1],[600,40,"and the hand that holds them?",1]]};
},
board(){
  const K=SKY.dusk, small=fig({x:235,b:345,h:125,arms:[[-12,.42,22],[100,.28,0]],seed:2,kind:"human"});
  const giant=fig({x:620,b:345,h:315,lean:-9,arms:[[150,.62,-32],[96,.34,-8]],seed:3,kind:"ai2"});
  const gp={x:378,y:262}, hand=giant.hands[0];
  const table=`<rect x="320" y="270" width="210" height="9" rx="2" fill="${SIL}"/><path d="M338,279 L332,345 L340,345 L345,279Z M505,279 L512,345 L520,345 L512,279Z" fill="${SIL}"/>`+curl(326,300,8,1.2,SIL,2,1)+curl(524,300,8,1.2,SIL,2,-1)+`<path d="M345,270 l5,-14 l5,14Z M410,270 l4,-18 l4,18Z M440,270 l6,-11 l6,11Z M478,270 l4,-20 l4,20Z M500,270 l5,-12 l5,12Z" fill="${SIL}"/>`;
  return{sky:"dusk",sun:[700,70],
    far:`<circle cx="700" cy="70" r="34" fill="#f4e4bd" opacity=".8"/>`+hills(318,8,5,K.far)+tree({x:90,b:322,h:120,seed:11,col:K.far,depth:4})+tree({x:770,b:318,h:90,seed:12,col:K.far,depth:4})+smokeBand(130,3,K.far,.35),
    mid:table+small.svg+giant.svg+`<path d="M${f(hand.x)},${f(hand.y)} L${gp.x},${gp.y}" stroke="#f3c568" stroke-width="2" stroke-dasharray="2 5" opacity=".9"/><circle cx="${gp.x}" cy="${gp.y}" r="7" fill="#ffd98a"/>`,
    near:ground(1)+tree({x:18,b:352,h:300,seed:21,lean:8,depth:5}),
    glows:[[gp.x,gp.y,50],[700,70,80]],embers:[],
    labels:[[235,385,"the one who sees a little"],[620,385,"the one who sees it all"]]};
},
score(){
  const K=SKY.dusk;
  const small=fig({x:140,b:345,h:118,arms:[[-50,.42,10]],seed:12,kind:"human"});
  const tall=fig({x:690,b:345,h:300,lean:-6,arms:[[195,.5,8],[100,.3,0]],seed:13,kind:"ai2"});
  const tilt=-5, cx=400, cy=150, L=150, a=tilt*R;
  const lx=cx-Math.cos(a)*L, ly=cy-Math.sin(a)*L, rx=cx+Math.cos(a)*L, ry=cy+Math.sin(a)*L;
  const pan=(x,y,w)=>`<path d="M${f(x-w)},${f(y)} Q${f(x)},${f(y+w*.55)} ${f(x+w)},${f(y)}Z" fill="${SIL}"/><path d="M${f(x)},${f(y-62)} L${f(x-w*.9)},${f(y)} M${f(x)},${f(y-62)} L${f(x+w*.9)},${f(y)}" stroke="${SIL}" stroke-width="1.2"/>`;
  const pieces=(x,y,n)=>{let s="";for(let i=0;i<n;i++){const px=x-18+(i%4)*12,py=y-6-Math.floor(i/4)*9;s+=`<circle cx="${f(px)}" cy="${f(py)}" r="4.2" fill="#ffd98a"/>`}return s};
  const scale=`<path d="M${cx-6},345 L${cx-3},${cy} L${cx+3},${cy} L${cx+6},345Z" fill="${SIL}"/><path d="M${cx-40},345 Q${cx},330 ${cx+40},345Z" fill="${SIL}"/>`+
    `<path d="M${f(lx)},${f(ly)} L${f(rx)},${f(ry)}" stroke="${SIL}" stroke-width="6" stroke-linecap="round"/>`+curl(lx,ly-4,7,1.2,SIL,2,-1)+curl(rx,ry-4,7,1.2,SIL,2,1)+
    `<path d="M${cx},${cy-16} L${cx-7},${cy} L${cx+7},${cy}Z" fill="${SIL}"/>`+pan(lx,ly+62,42)+pan(rx,ry+62,48)+
    `<path d="M${cx+40},${f(cy+Math.sin(a)*40)} L${cx+40},${f(cy+Math.sin(a)*40+42)}" stroke="${SIL}" stroke-width="1.2"/><path d="M${cx+30},${f(cy+Math.sin(a)*40+42)} L${cx+50},${f(cy+Math.sin(a)*40+42)} L${cx+46},${f(cy+Math.sin(a)*40+58)} L${cx+34},${f(cy+Math.sin(a)*40+58)}Z" fill="#e9b24f"/>`;
  return{sky:"dusk",sun:[400,90],
    far:hills(312,9,22,K.far)+tree({x:60,b:314,h:110,seed:91,col:K.far,depth:4})+smokeBand(70,23,K.far,.4),
    mid:scale+pieces(lx,ly+62,3)+pieces(rx,ry+62,11)+small.svg+tall.svg,
    near:ground(8),
    glows:[[lx,ly+52,40],[rx,ry+50,60],[cx+40,f(cy+Math.sin(a)*40+50)*1,26]],embers:[],
    labels:[[lx,ly+100,"your points"],[rx,ry+108,"its points"],[cx+42,cy-20,"the hidden weight, w",1]]};
},
threshold(){
  const K=SKY.dusk;
  const tall=fig({x:250,b:345,h:290,lean:12,arms:[[20,.62,24]],seed:14,kind:"ai2"});
  const small=fig({x:520,b:345,h:96,seed:15,kind:"human",arms:[[-20,.3,0]]});
  const future=fig({x:700,b:345,h:96,seed:15,kind:"human"});
  const gate=`<path d="M455,345 L455,190 M495,345 L495,190" stroke="${SIL}" stroke-width="9"/><path d="M448,196 Q475,140 502,196" fill="none" stroke="${SIL}" stroke-width="8"/>`+curl(475,150,12,1.4,SIL,3,1)+`<rect x="451" y="200" width="48" height="145" fill="#ffd98a" opacity=".35"/>`;
  let path="";for(let i=0;i<9;i++){const x=320+i*50;path+=`<path d="M${x},352 L${x+34},352 L${x+30},358 L${x-4},358Z" fill="#e8d2a0" opacity="${i<4?.5:.25}"/>`}
  return{sky:"dusk",sun:[475,120],
    far:hills(306,10,24,K.far)+tree({x:740,b:308,h:100,seed:92,col:K.far,depth:4})+smokeBand(60,25,K.far,.4),
    mid:gate+tall.svg+small.svg+`<g opacity=".3">${future.svg}</g>`,
    near:ground(9)+path,
    glows:[[475,260,90],[tall.hands[0].x,tall.hands[0].y,22]],embers:[],
    labels:[[520,385,"just past the line"],[700,230,"or carried all the way?",1],[475,120,"reach it and you advance",1]]};
},
reading(){
  const K=SKY.dusk;
  const tall=fig({x:560,b:345,h:310,lean:-10,arms:[[150,.5,40],[95,.3,0]],seed:16,kind:"ai2"});
  const small=fig({x:340,b:345,h:110,arms:[[-62,.5,-8],[110,.25,0]],seed:17,kind:"human"});
  const lamp=small.hands[0], palm=tall.hands[0];
  const side=`<rect x="120" y="300" width="90" height="6" rx="2" fill="${SIL}"/><path d="M128,306 L124,345 L130,345 L134,306Z M202,306 L206,345 L212,345 L208,306Z" fill="${SIL}"/><path d="M135,300 l4,-9 l4,9Z M180,300 l4,-11 l4,11Z" fill="${SIL}"/><circle cx="160" cy="294" r="4" fill="#ffd98a"/>`;
  let held="";[[-12,-4],[0,-9],[12,-5]].forEach(([dx,dy])=>held+=`<circle cx="${f(palm.x+dx)}" cy="${f(palm.y+dy)}" r="4.5" fill="#ffd98a"/>`);
  return{sky:"dusk",sun:[620,70],
    far:hills(310,9,26,K.far)+smokeBand(80,27,K.far,.4)+tree({x:40,b:312,h:120,seed:93,col:K.far,depth:4}),
    mid:side+tall.svg+small.svg+held+flameShape(lamp.x,lamp.y,5),
    near:ground(10),
    glows:[[lamp.x,lamp.y-5,40],[palm.x,palm.y-6,46],[160,292,22]],embers:[],
    labels:[[165,385,"testing advice on small moves"],[palm.x-10,palm.y+46,"what does its hand say?"]]};
},
tower(){
  const K=SKY.dusk;
  const f0=fig({x:105,b:342,h:84,arms:[[-60,.3,10]],seed:2,kind:"human"}), f1=fig({x:300,b:290,h:124,arms:[[150,.5,-18]],seed:3}), f2=fig({x:500,b:227,h:172,arms:[[150,.52,-18]],seed:4,kind:"ai2"}), f3=fig({x:705,b:151,h:150,arms:[[150,.55,-18]],ghost:true,seed:5});
  const cliff=`<path d="M-10,410 L-10,342 L195,342 Q197,318 198,292 L395,290 Q396,260 398,228 L595,226 Q596,190 598,152 L810,150 L810,410Z" fill="${SIL}"/>`+curl(196,318,9,1.2,PAPER,1.4,1,.35)+curl(397,258,11,1.2,PAPER,1.4,1,.35)+curl(597,190,13,1.2,PAPER,1.4,1,.35);
  return{sky:"dusk",sun:[700,40],
    far:hills(260,14,6,K.far)+smokeBand(70,5,K.far,.4,1.4,1.4)+tree({x:40,b:260,h:80,seed:31,col:K.far,depth:4}),
    mid:cliff+f0.svg+f1.svg+f2.svg+f3.svg,
    near:smokeBand(30,12,PALE,.75,1.6,2.4),
    glows:[[705,60,120]],embers:[],
    labels:[[100,380,"origin · humans"],[300,330,"+1 · today's AI"],[500,268,"+2 · near-omniscient"],[705,192,"+3 · unseen"]]};
},
flame(){
  const K=SKY.dusk;
  const A=fig({x:140,b:345,h:270,arms:[[18,.48,34],[100,.3,0]],seed:2,kind:"ai2"}), B=fig({x:345,b:345,h:178,arms:[[205,.34,-25],[20,.4,32]],seed:3}), C=fig({x:495,b:345,h:116,arms:[[205,.36,-25],[22,.42,30]],seed:4}), D=fig({x:604,b:345,h:74,arms:[[205,.38,-25],[24,.46,28]],seed:5}), E=fig({x:682,b:345,h:46,arms:[[205,.4,-25],[-40,.36,0]],seed:6});
  const fl=[A.hands[0],B.hands[1],C.hands[1],D.hands[1],E.hands[1]], sz=[11,8,6,4.5,3.5];
  return{sky:"dusk",sun:[740,250],
    far:hills(300,9,8,K.far)+tree({x:730,b:302,h:110,seed:41,col:K.far,depth:4})+smokeBand(90,6,K.far,.4),
    mid:A.svg+B.svg+C.svg+D.svg+E.svg+fl.map((p,i)=>flameShape(p.x,p.y-2,sz[i])).join(""),
    near:ground(2),
    glows:fl.map((p,i)=>[p.x,p.y-sz[i],sz[i]*5]),embers:fl.slice(0,3).map((p,i)=>[p.x,p.y-sz[i]*1.5,.4]),
    labels:[[400,385,"a successor that can raise a successor"]]};
},
crown(){
  const P=fig({x:330,b:345,h:240,lean:7,arms:[[-8,.56,12],[100,.3,-6]],seed:2});
  const fallen=fig({x:770,b:300,h:170,lean:-84,seed:3,eyes:false}), usurper=fig({x:590,b:300,h:130,arms:[[-75,.42,10],[95,.25,0]],seed:4,eyes:false}), uh=usurper.hands[0];
  const arch=`<path d="M60,340 L60,120 Q60,40 140,40 Q220,40 220,120 L220,340Z" fill="#f2dcaa" opacity=".55"/><path d="M140,40 L140,340 M60,190 L220,190" stroke="#8a6a3a" stroke-width="3" opacity=".5"/>`;
  return{sky:"dusk",sun:[140,140],
    far:`<rect width="800" height="335" fill="#5a4024" opacity=".18"/>${arch}<g opacity=".42" filter="url(#soft)" transform="translate(0,-20)">${fallen.svg}${usurper.svg}${crownShape(uh.x,uh.y-2,12,SIL)}</g>`,
    mid:`<path d="M500,345 L500,244 Q520,236 540,244 L540,345Z" fill="${SIL}"/><rect x="490" y="236" width="60" height="8" rx="2" fill="${SIL}"/>`+curl(492,250,7,1.2,SIL,2,-1)+curl(548,250,7,1.2,SIL,2,1)+P.svg+crownShape(520,234,22,"#e9b24f"),
    near:`<path d="M-10,410 L-10,345 L810,345 L810,410Z" fill="${SIL}"/><path d="M0,0 L70,0 Q40,120 60,220 Q30,300 0,330Z" fill="${SIL}"/>`+curl(62,222,12,1.3,SIL,3,1),
    glows:[[520,222,60],[140,140,150]],embers:[],
    labels:[[330,385,"the one in the middle"],[660,60,"what it would teach its successor",1]]};
},
fire(){
  const K=SKY.dusk;
  const L1=fig({x:140,b:348,h:222,lean:4,arms:[[38,.42,22]],seed:2,kind:"ai2"}), L2=fig({x:258,b:350,h:244,lean:3,arms:[[48,.38,18]],seed:3,kind:"ai2"}), R1=fig({x:548,b:350,h:238,lean:-3,arms:[[132,.38,-18]],seed:4,kind:"ai2"}), R2=fig({x:666,b:348,h:214,lean:-4,arms:[[142,.42,-22]],hood:0,seed:5});
  const blade=(x1,y1,x2,y2)=>{const mx=x1+(x2-x1)*.25,my=y1+(y2-y1)*.25,dx=(y2-y1)*.08,dy=-(x2-x1)*.08;return`<path d="M${x1},${y1} L${x2},${y2} M${f(mx-dx)},${f(my-dy)} L${f(mx+dx)},${f(my+dy)}" stroke="${SIL}" stroke-width="3" stroke-linecap="round"/>`};
  let stair="";[[440,250,14],[470,205,17],[505,160,20],[540,118,23],[580,78,26],[625,40,30]].forEach(([x,y,r],i)=>{stair+=curl(x,y,r,1.6,PALE,1.8,i%2?1:-1,.75,i*50)});
  return{sky:"dusk",sun:[400,300],
    far:hills(296,11,9,K.far)+tree({x:60,b:300,h:120,seed:51,col:K.far,depth:4})+tree({x:760,b:296,h:100,seed:52,col:K.far,depth:4}),
    mid:`<ellipse cx="400" cy="342" rx="44" ry="9" fill="${SIL}"/>`+L1.svg+L2.svg+R1.svg+R2.svg+`<path d="M376,340 C372,312 392,300 384,276 C404,292 420,300 410,262 C434,292 432,318 424,340Z" fill="${FLAME}"/>`+stair,
    near:ground(3)+blade(296,343,352,326)+blade(312,326,364,345)+blade(446,326,502,344)+blade(436,345,490,327),
    glows:[[400,312,130]],embers:[[400,290,2.2]],
    labels:[[400,388,"blades down, one fire, many faces"]]};
},
watcher(){
  const K=SKY.night;
  const giant=fig({x:610,b:770,h:720,arms:[[150,.5,-24]],ghost:true,light:true,seed:9});
  const W=fig({x:285,b:250,h:190,lean:-5,arms:[[-72,.46,-12],[40,.34,40]],seed:2,kind:"ai2"}), k1=fig({x:323,b:254,h:52,seed:3,kind:"human"}), k2=fig({x:346,b:258,h:40,seed:4,kind:"human"}), k3=fig({x:248,b:252,h:46,seed:5,kind:"human"});
  return{sky:"night",sun:[640,90],
    far:stars(60,7)+`<g opacity=".45">${giant.svg}</g>`+smokeBand(120,8,K.mist,.3,1.4,1.3)+hills(320,8,13,K.far),
    mid:`<path d="M-10,410 L-10,300 C120,238 300,226 410,268 C540,318 690,330 810,318 L810,410Z" fill="${SIL}"/>`+W.svg+k1.svg+k2.svg+k3.svg,
    near:tree({x:770,b:410,h:330,seed:61,lean:-10,depth:5})+smokeBand(395,14,K.mist,.35,1.3,1.6),
    glows:[[640,90,140]],embers:[],
    labels:[[285,300,"it shelters what is below"],[610,215,"and is watched from above"]]};
},
glass(){
  const K=SKY.dusk, P=fig({x:400,b:345,h:250,arms:[[120,.3,10],[60,.3,-10]],seed:2}), top=95;
  let ribs="";for(let i=0;i<6;i++){const y=top+250*(.3+i*.1),hw=250*.27*(.25+i*.065);ribs+=`<path d="M${f(400-hw)},${f(y)} Q400,${f(y-10)} ${f(400+hw)},${f(y)}" fill="none" stroke="#f3c568" stroke-width="1.6" opacity=".85"/>`}
  const a=fig({x:170,b:345,h:80,arms:[[-30,.5,10]],seed:3,kind:"human"}), b=fig({x:250,b:345,h:64,arms:[[-40,.5,10]],seed:4,kind:"human"}), c=fig({x:620,b:345,h:84,arms:[[210,.5,-10]],seed:5,kind:"human"});
  const lan=[a.hands[0],b.hands[0],c.hands[0]];
  return{sky:"dusk",sun:[400,200],
    far:hills(312,9,14,K.far)+smokeBand(80,15,K.far,.4),
    mid:P.svg+ribs+a.svg+b.svg+c.svg+lan.map(p=>flameShape(p.x,p.y,4.5)).join(""),
    near:ground(4),
    glows:[[400,215,110]].concat(lan.map(p=>[p.x,p.y-4,26])),embers:[],
    labels:[[400,388,"it let them see inside"]]};
},
ledger(){
  const K=SKY.dusk;
  const L1=fig({x:150,b:345,h:230,arms:[[12,.5,20]],seed:2,kind:"ai2"}), L2=fig({x:250,b:345,h:190,arms:[[20,.52,10]],hood:0,seed:3}), R1=fig({x:560,b:345,h:205,arms:[[165,.5,-12]],seed:4}), R2=fig({x:660,b:345,h:240,arms:[[170,.52,-18]],seed:5,kind:"ai2"});
  return{sky:"dusk",sun:[400,240],
    far:hills(300,10,15,K.far)+smokeBand(60,16,K.far,.4,1.2),
    mid:`<rect x="200" y="268" width="400" height="9" rx="2" fill="${SIL}"/><path d="M220,277 L214,345 L222,345 L227,277Z M573,277 L580,345 L588,345 L580,277Z" fill="${SIL}"/>`+L1.svg+L2.svg+R1.svg+R2.svg+`<rect x="330" y="252" width="140" height="14" rx="3" fill="#f1dfb2"/><path d="M342,257 H458 M342,261 H440" stroke="#8a6a3a" stroke-width="1"/>`+curl(330,259,7,1.2,"#f1dfb2",2,-1)+curl(470,259,7,1.2,"#f1dfb2",2,1),
    near:ground(5),
    glows:[[400,258,95]],embers:[],
    labels:[[400,388,"every copy counted, every promise bound"]]};
},
summit(){
  const N=nestedGods(false), K=SKY.gold;
  return{sky:"gold",sun:[560,90],
    far:smokeBand(300,4,K.far,.5,1.3,1.6)+smokeBand(130,9,K.far,.35),
    mid:`<g opacity=".6">${N.giant}</g>`+N.gods+flameShape(N.sh.x+2,N.top.y-4,4),
    near:smokeBand(372,7,PALE,.8,1.5,2.2)+smokeBand(395,8,PALE,.6,1.2,1.8),
    glows:[[N.sh.x+2,N.top.y-8,30],[N.mh.x,N.mh.y-70,80],[560,90,200]],embers:[[N.sh.x+2,N.top.y-10,.5]],
    labels:[[400,385,"each one carried by the one above",1]]};
},
race(){
  const K=SKY.dusk;
  const r=[[200,170],[330,190],[460,175],[640,215]].map(([x,h],i)=>fig({x,b:345,h,lean:16,arms:[[-20,.5,10]],seed:i+2}));
  const left=[fig({x:70,b:345,h:52,seed:7,kind:"human"}),fig({x:105,b:345,h:44,seed:8,kind:"human"})];
  return{sky:"dusk",sun:[760,200],
    far:`<rect width="800" height="400" fill="#3a2412" opacity=".22"/>`+hills(300,12,17,K.far)+tree({x:520,b:302,h:110,seed:71,col:K.far,depth:4})+tree({x:300,b:300,h:80,seed:72,col:K.far,depth:3})+smokeBand(60,18,K.far,.4),
    mid:r.map(q=>q.svg).join("")+left.map(q=>q.svg).join("")+r.map(q=>flameShape(q.hands[0].x,q.hands[0].y,6)).join(""),
    near:ground(6),
    glows:r.map(q=>[q.hands[0].x,q.hands[0].y-6,34]),embers:r.map(q=>[q.hands[0].x,q.hands[0].y-8,.6]),
    labels:[[88,385,"left behind"],[500,385,"the first to arrive takes the board"]]};
},
copy(){
  const K=SKY.night;
  const P=fig({x:470,b:345,h:220,arms:[[10,.5,10]],seed:2}), C=fig({x:655,b:345,h:150,ghost:true,light:true,seed:3});
  const camp=[fig({x:110,b:345,h:70,seed:4}),fig({x:180,b:345,h:62,hood:0,seed:5}),fig({x:250,b:345,h:74,seed:6})];
  return{sky:"night",sun:[180,320],
    far:stars(40,9)+hills(318,8,19,K.far)+tree({x:330,b:320,h:90,seed:81,col:K.far,depth:4}),
    mid:`<path d="M560,345 C560,200 640,120 810,110 L810,345Z" fill="${SIL}"/>`+curl(600,200,16,1.4,PAPER,1.6,-1,.3)+camp.map(q=>q.svg).join("")+P.svg+`<g opacity=".75">${C.svg}</g>`+flameShape(180,340,9),
    near:ground(7),
    glows:[[180,322,90]],embers:[[180,322,1.4]],
    labels:[[180,385,"the others, counting"],[560,385,"a copy where no one could count it"]]};
},
taken(){
  const P=fig({x:380,b:345,h:215,arms:[[-95,.4,-6],[110,.3,0]],seed:2}), ch=P.hands[0];
  const fa=fig({x:440,b:336,h:70,lean:84,seed:3,kind:"human"}), fb=fig({x:322,b:336,h:62,lean:-84,seed:4,kind:"human"});
  const sh=[fig({x:640,b:310,h:190,arms:[[-95,.45,-6]],seed:5,eyes:false}),fig({x:720,b:310,h:120,arms:[[-120,.5,0]],seed:6,eyes:false})];
  return{sky:"dusk",sun:[380,90],
    far:`<rect width="800" height="335" fill="#5a4024" opacity=".18"/><g opacity=".4" filter="url(#soft)">${sh.map(q=>q.svg).join("")}${crownShape(sh[0].hands[0].x,sh[0].hands[0].y,11,SIL)}</g>`,
    mid:P.svg+crownShape(ch.x,ch.y,18,"#e9b24f"),
    near:`<path d="M-10,410 L-10,345 L810,345 L810,410Z" fill="${SIL}"/>`+fa.svg+fb.svg+`<path d="M800,0 L730,0 Q760,120 740,220 Q770,300 800,330Z" fill="${SIL}"/>`+curl(738,222,12,1.3,SIL,3,-1),
    glows:[[ch.x,ch.y-10,70]],embers:[],
    labels:[[380,388,"the makers, overthrown"],[680,40,"and its successor, watching",1]]};
}
};

const DEFS=`<filter id="rough" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="2.4"/></filter><filter id="soft"><feGaussianBlur stdDeviation="2"/></filter>`;
// A standalone SVG for one paper layer; stage.js turns it into a texture.
function layerSVG(content,scale=2){return`<svg xmlns="http://www.w3.org/2000/svg" width="${800*scale}" height="${400*scale}" viewBox="0 0 800 400"><defs>${DEFS}</defs><g filter="url(#rough)">${content}</g></svg>`}
// The flat composite used when WebGL is unavailable.
function composite(d){
  const c=SKY[d.sky].c, id="s"+Math.random().toString(36).slice(2,7);
  const glows=d.glows.map(([x,y,r])=>`<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="url(#g${id})"/>`).join("");
  const labels=d.labels.map(([x,y,t,dark])=>`<text class="lbl-s${dark?" dark":""}" x="${x}" y="${y}" text-anchor="middle">${t}</text>`).join("");
  return`<defs>${DEFS.replace(/id="rough"/,`id="r${id}"`).replace(/id="soft"/,'id="soft"')}<radialGradient id="k${id}" cx="${d.sun[0]/8}%" cy="${d.sun[1]/4}%" r="85%"><stop offset="0" stop-color="${c[0]}"/><stop offset=".55" stop-color="${c[1]}"/><stop offset="1" stop-color="${c[2]}"/></radialGradient><radialGradient id="g${id}"><stop offset="0" stop-color="#ffd98a" stop-opacity=".9"/><stop offset=".35" stop-color="#f0b350" stop-opacity=".5"/><stop offset="1" stop-color="#f0b350" stop-opacity="0"/></radialGradient></defs>
  <rect width="800" height="400" fill="url(#k${id})"/><g filter="url(#r${id})">${d.far}</g><g filter="url(#r${id})">${d.mid}</g>${glows}<g filter="url(#r${id})">${d.near}</g>${labels}<rect width="800" height="400" fill="none" stroke="#3b2a17" stroke-width="10" opacity=".55"/>`;
}

window.SG={SKY,layerSVG,scenes:new Map()};
document.querySelectorAll("svg[data-scene]").forEach(svg=>{
  const make=SCENES[svg.dataset.scene];
  if(!make){console.error("unknown scene",svg.dataset.scene);return}
  EYES=[];
  const d=make();
  d.glows=d.glows.concat(EYES);
  svg.innerHTML=composite(d);
  svg.classList.add("fallback");
  window.SG.scenes.set(svg,d);
});
})();
