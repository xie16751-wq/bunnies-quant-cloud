# Bunnies Quant Cloud

Static cloud mirror of the Bunnies quantitative research homepage and terminal.

The live data API currently bridges to the local Bunnies data service.

## Layout

- `index.html`, `_next/`, `sites/`: the homepage, built from `web/` (Next.js static export).
- `ashare-quant.html`: the quant terminal.
- `site/config.js`: data service address and the published account snapshot, shared by the homepage and the terminal.
  `start-cloud.ps1` (one level up) rewrites `apiBase` here when the tunnel address changes.
- `strategies.html`, `method.html`, `start.html`, `desk.html`: redirects to sections of the homepage.

## Updating the homepage

```bash
cd web
npm ci
npm run dev          # local preview on http://localhost:3000
npm run export-site  # builds and copies the static files into this folder
```

Then commit and push; Vercel serves the folder as static files (`web/` is excluded by `.vercelignore`).
