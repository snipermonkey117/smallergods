// Research page: citations, predecessor cards, the filterable timeline, and the bibliography.
(()=>{
S.sort((p,q)=>p.y-q.y);
const byId={}; S.forEach((s,i)=>{s.num=i+1;byId[s.id]=s});
const esc=t=>t.replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const LABEL={P:"Parallel",C:"Contrary",Pre:"Precursor"};
const THREAD={ethics:"Ethics",cosmo:"Theology",fiction:"Fiction",games:"Game theory",sim:"Simulation arguments",safety:"AI safety"};

document.querySelectorAll("sup.c").forEach(el=>{
  const s=byId[el.dataset.id];
  if(!s){console.error("missing source",el.dataset.id);return}
  el.innerHTML=`<a href="#src-${s.id}" title="${esc(s.a+", "+s.t+" ("+s.yl+")")}">[${s.num}]</a>`;
});
const counts={P:0,C:0,Pre:0}; S.forEach(s=>counts[s.s]++);
document.getElementById("count").textContent=`${S.length} sources: ${counts.P} parallel, ${counts.C} contrary, ${counts.Pre} precursors.`;
document.getElementById("key-cards").innerHTML=S.filter(s=>s.key).map(s=>`<div class="card"><div class="who"><a href="${s.u}" target="_blank" rel="noopener">${esc(s.a)}</a><small>${esc(s.yl)} · ${esc(s.t)}</small></div><p>${esc(s.n)}</p></div>`).join("");
document.getElementById("bib").innerHTML=S.map(s=>`<li id="src-${s.id}"><span class="num">${s.num}</span><div>${esc(s.a)} (${esc(s.yl)}). <a href="${s.u}" target="_blank" rel="noopener"><i>${esc(s.t)}</i></a>. <span class="chip ${s.s}">${LABEL[s.s]}</span>${s.ck==="k"?' <span class="chip u">from memory</span>':s.ck==="u"?' <span class="chip u">unverified</span>':""}</div></li>`).join("");

const ERAS=[[-1e9,1600,"Antiquity to the middle ages"],[1600,1900,"The early modern age"],[1900,2000,"The twentieth century"],[2000,2017,"2000–2016 · the argument appears"],[2017,2023,"2017–2022 · the argument matures"],[2023,1e9,"2023–2026 · the age of evidence"]];
const state={stance:"all",thread:"all"};
function renderTL(){
  const rows=S.filter(s=>(state.stance==="all"||s.s===state.stance)&&(state.thread==="all"||s.th===state.thread));
  let html="";
  for(const [lo,hi,name] of ERAS){
    const r=rows.filter(s=>s.y>=lo&&s.y<hi);
    if(!r.length)continue;
    html+=`<div class="era">${name}</div>`+r.map(s=>`<div class="ev ${s.s}${s.key?" key-ev":""}"><div class="yr">${esc(s.yl)}</div><div class="tt"><b>${esc(s.a)}</b>, <a href="${s.u}" target="_blank" rel="noopener"><i>${esc(s.t)}</i></a> <sup class="c"><a href="#src-${s.id}">[${s.num}]</a></sup><span class="n">${esc(s.n)}</span></div></div>`).join("");
  }
  document.getElementById("tl").innerHTML=html||'<p class="empty">No sources match both filters.</p>';
}
document.querySelectorAll(".filters button").forEach(b=>b.addEventListener("click",()=>{
  state[b.dataset.f]=b.dataset.v;
  document.querySelectorAll(`.filters button[data-f="${b.dataset.f}"]`).forEach(x=>x.setAttribute("aria-pressed",String(x===b)));
  renderTL();
}));
renderTL();
})();
