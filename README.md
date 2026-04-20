# IT Cost Distortion Dashboard

Single-page React + TypeScript dashboard that compares blended IT MD costs versus real role-weighted costs.

## Local run

1. Install Node.js 20+
2. Install dependencies:
   - `npm install`
3. Start dev server:
   - `npm run dev`

## Production build

- `npm run build`
- `npm run preview`

## GitHub Pages

This repo includes an Actions workflow that deploys to GitHub Pages on every push to `main`.

Expected site URL:

- `https://vojikda.github.io/realcosts/`

If you still get 404:

1. Open repository **Settings** -> **Pages**
2. Under **Build and deployment**, set **Source** to **GitHub Actions**
3. Re-run the latest workflow in **Actions**
