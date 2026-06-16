# Portfolio

Client-side Vue 3 portfolio SPA for `https://floydkretschmar.com/`. The main route is an infinite-scroll masonry photo gallery; `/about` is a static portfolio page. The app is built with Vite, Vue Router, Vuetify, plain JavaScript, and CSS-only masonry.

The gallery reads photo pages from the external Flickr service contract:

```text
GET https://flickr-service.fly.dev/photos/{photoset}?page={page}&limit={limit}
```

This repository owns only the static client. It does not own or deploy that backend service.

## Setup

Use the pinned runtime:

- Node `24.16.0`
- npm `11.13.0`

Install dependencies from the lockfile:

```bash
npm ci
```

For local development:

```bash
npm run dev
```

## Validation

`run.sh` is the local and CI validation entry point:

```bash
./run.sh check
./run.sh format
./run.sh test
./run.sh e2e-tests
./run.sh build
```

Run the relevant narrow command while developing, then restore the full baseline before marking work done:

```bash
npm ci
./run.sh format
./run.sh check
./run.sh test
./run.sh e2e-tests
./run.sh build
npm audit signatures --min-release-age=0
npm audit --audit-level=high
```

`check` must not rewrite files. Use `format` for intentional formatting and lint fixes.

## Build And Deploy

`./run.sh build` creates the static Vite output in `dist/`. CI also copies `dist/index.html` to `dist/404.html` so direct SPA routes work on GitHub Pages.

GitHub Actions installs with `npm ci`, runs the split validation gates, and deploys to GitHub Pages only from `main` after the required checks pass.

## Dependency Policy

Dependencies are npm-only, lockfile-backed, and exact-pinned. `.npmrc` enforces strict engines, exact saves, and a seven-day minimum package release age. The client targets modern evergreen browsers; it does not use TypeScript, runtime schema validation libraries, legacy polyfill packages, Axios, or a masonry runtime package.
