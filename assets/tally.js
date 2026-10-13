// Ending tally: records a reader's FIRST ending choice and shows how everyone else chose.
// The server counts one choice per visitor (by a salted hash of the IP), so later clicks are ignored there.
// Results are only shown after a choice, so the tally never sways the choice.
(() => {
  const API = /(^|\.)smallergods\.com$/.test(location.hostname) ? "/api/choice" : "http://localhost:8788/api/choice";
  const NAME = { light: "The Fog Lifts", dark: "The Dark Forest" };

  document.head.insertAdjacentHTML("beforeend", `<style>
    .tally{display:grid;gap:8px;text-align:left;width:100%;max-width:62ch;margin-inline:auto;padding:14px 16px;border-radius:10px;border:1px solid rgba(255,255,255,.1);background:rgba(0,0,0,.25);font-size:.9rem}
    .tally[hidden]{display:none}
    .tally .t-h{font-size:.75rem;letter-spacing:.14em;text-transform:uppercase;opacity:.75}
    .tally .t-row{display:grid;grid-template-columns:9.5em 1fr 4.2em;gap:10px;align-items:center}
    .tally .t-bar{height:10px;border-radius:99px;background:rgba(255,255,255,.1);overflow:hidden}
    .tally .t-bar i{display:block;height:100%;border-radius:99px;transition:width .8s}
    .tally .t-n{text-align:right;font-variant-numeric:tabular-nums}
    .tally .t-note{font-size:.78rem;opacity:.7}
    @media (prefers-reduced-motion:reduce){.tally .t-bar i{transition:none}}
  </style>`);

  function draw(el, t) {
    if (!t || !t.total) { el.innerHTML = `<div class="t-h">First choices so far</div><p class="t-note">No one else has chosen yet. You're the first.</p>`; el.hidden = false; return; }
    const pct = k => Math.round(100 * t[k] / t.total);
    const row = (k, color) => `<div class="t-row"><span>${NAME[k]}</span><span class="t-bar"><i style="width:${pct(k)}%;background:${color}"></i></span><span class="t-n">${pct(k)}%</span></div>`;
    el.innerHTML = `<div class="t-h">How readers chose first</div>${row("light", "#e9b24f")}${row("dark", "#d0503c")}
      <p class="t-note">${t.total.toLocaleString()} reader${t.total === 1 ? "" : "s"}, counted once each by their first choice.${t.yours ? ` Your first choice: <b>${NAME[t.yours]}</b>.` : ""} We store only a one-way hash of your IP address, never the address itself.</p>`;
    el.hidden = false;
  }

  async function render() {
    const els = document.querySelectorAll("[data-tally]");
    if (!els.length) return;
    try {
      // A choice made on the previous page may not have reached the server yet: send it again (duplicates are ignored).
      let pending = null; try { pending = JSON.parse(sessionStorage.getItem("sg-pending") || "null"); sessionStorage.removeItem("sg-pending"); } catch {}
      const t = pending ? await record(pending.choice, pending.version) : await (await fetch(API, { cache: "no-store" })).json();
      if (!t || t.error) throw new Error("no tally");
      els.forEach(el => draw(el, t));
    } catch { els.forEach(el => el.hidden = true); }
  }

  // keepalive lets the request finish even when the click navigates to the ending page
  function record(choice, version) {
    try { sessionStorage.setItem("sg-pending", JSON.stringify({ choice, version })); } catch {}
    return fetch(API, { method: "POST", keepalive: true, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ choice, version }) })
      .then(r => r.json()).then(t => { try { sessionStorage.removeItem("sg-pending"); } catch {} return t; }).catch(() => null);
  }

  document.querySelectorAll("[data-record]").forEach(a => a.addEventListener("click", () => record(a.dataset.record, a.dataset.version || "a")));
  window.SGTally = { record, render };
  render();
})();
