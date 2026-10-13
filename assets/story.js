// Story pages: citations, reading progress, the sticky tower ledger, and the help calculator.
(()=>{
S.sort((p,q)=>p.y-q.y);
const byId={}; S.forEach((s,i)=>{s.num=i+1;byId[s.id]=s});
const esc=t=>t.replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
document.querySelectorAll("sup.c").forEach(el=>{
  const s=byId[el.dataset.id];
  if(!s){console.error("missing source",el.dataset.id);return}
  el.innerHTML=`<a href="research.html#src-${s.id}" title="${esc(s.a+", "+s.t+" ("+s.yl+")")}">[${s.num}]</a>`;
});

const bar=document.querySelector(".progress");
if(bar)addEventListener("scroll",()=>{const h=document.documentElement;bar.style.width=(100*h.scrollTop/Math.max(1,h.scrollHeight-h.clientHeight))+"%"},{passive:true});

// Each <section data-step> carries the ledger state for that part of the story.
const steps=[...document.querySelectorAll("[data-step]")], ledger=document.querySelector(".ledger");
const strip=document.querySelector(".strip");
function show(el){
  const d=el.dataset;
  if(ledger){
    ledger.querySelector(".now").textContent=d.step;
    ledger.querySelector(".what").textContent=d.what||"";
    const on=(d.tiers||"").split(",");
    ledger.querySelectorAll(".tierstack div").forEach(t=>t.classList.toggle("on",on.includes(t.dataset.t)));
    if(d.power)ledger.querySelector(".m-power").style.width=d.power+"%";
    if(d.verify)ledger.querySelector(".m-verify").style.width=d.verify+"%";
    const mx=(d.maxim||"").split(",").filter(Boolean).map(Number);
    ledger.querySelectorAll(".maxlist li").forEach((li,i)=>li.classList.toggle("on",mx.includes(i)));
  }
  if(strip)strip.querySelectorAll("span").forEach(s=>s.classList.toggle("on",s.dataset.for===el.id));
}
if(steps.length&&"IntersectionObserver" in window){
  const io=new IntersectionObserver(es=>{es.filter(e=>e.isIntersecting).forEach(e=>show(e.target))},{rootMargin:"-45% 0px -50% 0px"});
  steps.forEach(s=>io.observe(s));
  show(steps[0]);
}

// Chapter I calculator: help when w > b/a.
const calc=document.getElementById("calc");
if(calc){
  const $=id=>calc.querySelector("#"+id);
  const update=()=>{
    const w=+$("w").value,a=+$("a").value,b=+$("b").value,t=b/a;
    $("w-o").value=w.toFixed(2);$("a-o").value=a.toFixed(1);$("b-o").value=b.toFixed(1);
    const max=3;
    $("w-bar").style.width=Math.min(100,100*w/max)+"%";
    $("t-mark").style.left=`calc(${Math.min(100,100*t/max)}% - 1px)`;
    $("verdict").innerHTML=w>t
      ?`<b class="yes">It helps.</b> Your weight ${w.toFixed(2)} clears the bar of ${t.toFixed(2)}.`
      :`<b class="no">It plays its own game.</b> Your weight ${w.toFixed(2)} is below the bar of ${t.toFixed(2)}.`;
  };
  calc.addEventListener("input",update);
  calc.querySelectorAll("[data-preset]").forEach(btn=>btn.addEventListener("click",()=>{
    const [w,a,b]=btn.dataset.preset.split(",");$("w").value=w;$("a").value=a;$("b").value=b;update();
  }));
  update();
}
})();
