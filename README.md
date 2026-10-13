# Turtles All the Way Up

A thought experiment told as an illustrated fable, with two branching endings and a research section of about 105 sources.
Static HTML, CSS and JS with no build step. The illustrations are drawn in code (`assets/puppets.js`).

## Run locally

```
python3 -m http.server 8090
```

Then open http://localhost:8090.

## Files

| Path | What it is |
|---|---|
| `index.html` | The story: six scenes, the moral, and the choice of ending |
| `ending-fog-lifts.html`, `ending-dark-forest.html` | The two endings |
| `research.html` | Prior work, objections, claim-by-claim review, timeline, sources |
| `assets/sources.js` | The bibliography. Every `<sup class="c" data-id="…">` cites an `id` here |
| `assets/puppets.js` | Drawing kit and every scene (`<svg data-scene="name">`) |
| `assets/story.js` | Side panel, reading progress, citations, the w > b/a calculator |
| `og-card.html` → `og.png` | Social share image (see the comment in og-card.html to regenerate) |
| `CNAME` | Custom domain for GitHub Pages |

## Deploy (GitHub Pages, free)

1. Push this folder to a public GitHub repo.
2. In the repo: Settings → Pages → Deploy from branch → `main` / root.
3. At your registrar, point the domain at GitHub Pages:
   - `A` records for the apex domain: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `CNAME` record for `www` → `<github-username>.github.io`
4. Back in Settings → Pages, check "Enforce HTTPS" once the certificate is issued.
