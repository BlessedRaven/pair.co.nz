# pair.co.nz — PAIR Portal

Static GitHub Pages hub: animated sacred-geometry SVG. Each node opens a **coin brief**. pump.fun links stay empty until a mint exists.

## Add / edit a coin

1. Edit `coins.json` (name, ticker, blurb, optional `pumpfun` URL).
2. Ensure `index.html` hotspot `href` points at `coins/<slug>.html`.
3. Regenerate or hand-edit the brief page under `coins/`.
4. Push to `main` — Pages deploys from repo root (`CNAME` → `pair.co.nz`).

## Local preview

```bash
python3 -m http.server 8080 --directory .
```

Open `http://localhost:8080`.

## Notes

- Sigil: `assets/landing-hub.svg`
- Motion: breathe + outer orbit; respects `prefers-reduced-motion`
- Distinct from [blessedraven.com](https://www.blessedraven.com) (Crow’s white landing)
