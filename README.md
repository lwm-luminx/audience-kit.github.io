# AudienceKit website

Astro source for [audiencekit.com](https://audiencekit.com/), deployed to Cloudflare Workers with Wrangler static assets.

## Local development

Use Node.js 24 (or `mise install`):

```sh
npm ci
npm run dev
```

`npm run check` checks Astro and TypeScript. `npm run build` generates the static site in `dist/`. `npm run preview` serves the build; `npm run preview:cloudflare` builds and previews Cloudflare routing locally.

## Deployment

```sh
npx wrangler login
npm run deploy
```

Wrangler runs the Astro build before deploying the `dist/` assets to the `audience-kit-github-io` Worker. Unknown URLs serve the custom 404 page with a 404 status. The configured canonical site URL is `https://audiencekit.com`.

The GitHub Actions workflow checks and builds pull requests, and deploys pushes to `main` or manual runs. Configure repository secrets `CLOUDFLARE_API_TOKEN` (Workers deployment access) and `CLOUDFLARE_ACCOUNT_ID` for automated deployments. Custom domains are managed in the Cloudflare Worker settings; deploying the Worker alone does not move an existing domain from GitHub Pages.

## Content and staff app links

Pages live in `src/pages/`, shared markup in `src/components/` and `src/layouts/`, and static assets in `public/assets/`. Site settings are in `src/data/config.json`; the featured audience preview is in `src/data/featured_audiences.json`.

`/apps/focus/`, `/apps/velvet/` and `/apps/backstage/` are stable links for QR codes and posters: phones go straight to the App Store, or TestFlight while an app is in beta (iPhone/iPad), or Google Play (Android), desktops see both buttons, and `?stay` shows the page on a phone. Store URLs live in `src/data/staff_apps.json`; change them there when an app leaves beta and printed codes keep working. `python3 scripts/qr.py` regenerates `public/assets/qr/*.svg` after adding an app (requires `segno`).

Onboarding invites: Focus shows QR codes for `audiencekit.com/v/<code>` (Velvet) and `/b/<code>` (Backstage). `public/.well-known/apple-app-site-association` lets the Velvet and Backstage App Clips and apps open them (served as JSON by `public/_headers`); anywhere else `public/_redirects` sends them to `/invite/velvet/` or `/invite/backstage/`, which say how to get the app. Keep the AASA's app IDs in step with the staff apps' bundle IDs (team `DWVXMLB45Y`).

Legal copy is Markdown in `src/pages/privacy/`, `src/pages/terms/`, and `src/pages/data-deletion/`. Google Analytics runs only in production builds.

## Link preview

The homepage share card is `public/assets/brand/audiencekit-social-v1.png` (1200 × 630). Its editable source is `design/share-card.html`, using local fonts and brand art. Render that HTML at 1200 × 630 with device scale factor 1 to regenerate the PNG. Increment the image filename and homepage reference when replacing a published card to refresh image caches.
