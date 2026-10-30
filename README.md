# raumklang-festival.de

Coming-soon page for the Raumklang festival: an audio-reactive 3D scene with four drifting sound sources you can move through space; each is panned and attenuated by its position.

Stack: Vite, React, React Three Fiber + drei, Elementary Audio, MUI, zustand.

## Development

```sh
npm install
npm run dev      # http://localhost:5173
npm run build    # outputs dist/
npm run preview  # serve the production build
```

## Project layout

- `src/audio/engine.ts` — Elementary Audio graph: one drone voice per emitter, spatialized (pan, distance gain/filter/delay send), start/stop, meters → store
- `src/scene/` — R3F scene: abstract line field (`Field.tsx`), draggable sound sources (`Emitters.tsx`), shared positions (`emitterState.ts`)
- `src/components/` — MUI overlay (title, language + sound toggles, mucca.org link)
- `src/store/useAppStore.ts` — zustand store (language persisted, audio state, level, sound params)
- `src/i18n/strings.ts` — DE/EN strings
- `src/config.ts` — external links (imprint/privacy still need real URLs)

Interaction: drag a light. Left/right → stereo pan; further away → quieter, darker, more echo. Released lights keep drifting from where they were dropped.

## Deployment (GitHub Pages)

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds and deploys `dist/`.

One-time setup:

1. Repo **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. **Settings → Pages → Custom domain**: `raumklang-festival.de` (`public/CNAME` already contains it), then tick **Enforce HTTPS** once the certificate is issued.
3. DNS at your registrar:

   | Type  | Name  | Value                   |
   |-------|-------|-------------------------|
   | A     | @     | 185.199.108.153         |
   | A     | @     | 185.199.109.153         |
   | A     | @     | 185.199.110.153         |
   | A     | @     | 185.199.111.153         |
   | AAAA  | @     | 2606:50c0:8000::153     |
   | AAAA  | @     | 2606:50c0:8001::153     |
   | AAAA  | @     | 2606:50c0:8002::153     |
   | AAAA  | @     | 2606:50c0:8003::153     |
   | CNAME | www   | `<github-user>.github.io` |

4. Optional: verify the domain under your GitHub account/org **Settings → Pages** to prevent takeover.

## Before launch

German sites need an Impressum (§5 DDG) and a privacy notice. Set `IMPRINT_URL` / `PRIVACY_URL` in `src/config.ts`.
The site sets no cookies and loads no third-party resources (fonts are self-hosted via `@fontsource`).
