# Project Overview

This repository is a static Vue 3 portfolio SPA built with Vite and Vuetify. The production site is root-hosted at `https://floydkretschmar.com/`, with `/` serving the Flickr-backed gallery and `/about` serving the static About page.

## Modules

| Module                                       | Summary                                                                                                                                                                       |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/main.js`, `src/App.vue`, `src/plugins/` | Vue bootstrap plus router and Vuetify registration.                                                                                                                           |
| `src/router/`                                | Vue Router routes for the default layout, Home/gallery, and About pages. Router base handling comes from Vite.                                                                |
| `src/layouts/default/`                       | Shared application shell with the header and nested route content host.                                                                                                       |
| `src/views/`                                 | Page-level Home and About views. Home delegates gallery behavior to the gallery component tree.                                                                               |
| `src/components/home/`                       | Gallery rendering components: infinite-scroll host, CSS masonry layout contract, image cards, loading skeletons, and image dialog behavior.                                   |
| `src/services/gallery-service.js`            | DOM-free gallery behavior service for snapshots, pagination, cache restore, placeholder generation, duplicate-load prevention, failed-load recovery, and final-page handling. |
| `src/services/flickr-client.js`              | Native-fetch client for the external Flickr service request contract.                                                                                                         |
| `src/services/session-cache.js`              | Injected browser-storage cache boundary with TTL and invalid-data recovery.                                                                                                   |
| `src/services/observer-boundary.js`          | Injectable native `IntersectionObserver` boundary for infinite-scroll triggers and cleanup.                                                                                   |
| `config.js`                                  | Client runtime configuration for the Flickr service base URL, photoset, gallery page size, and cache TTL.                                                                     |
| `tests/`                                     | Node contract tests, Vitest behavior tests, and Playwright e2e tests with deterministic Flickr/image fixtures.                                                                |
| `.github/workflows/`                         | CI validation and GitHub Pages deployment automation.                                                                                                                         |

## Architecture

- The app is client-only. It has no local backend, database, or server-owned schema.
- Photo data comes from the external Flickr service at `GET /photos/{photoset}?page={page}&limit={limit}`. This repository depends on that contract but does not own the service.
- `gallery-service` is the deep behavior module. It accepts injected Flickr client, cache, and page-size boundaries, owns placeholder generation, and returns renderable gallery snapshots for the Vue layer.
- The Flickr client builds the existing service URL, uses native `fetch`, parses JSON, and propagates request failures to the gallery service.
- Browser storage is isolated behind `session-cache`; cache entries are internal client data and may change shape.
- Infinite scroll is isolated behind `observer-boundary`, which wraps native `IntersectionObserver` and disconnects on component unmount.
- Masonry is CSS-only behind the gallery layout contract. No masonry package or imperative masonry runtime is part of the production path.

## Validation And Operations

- `run.sh` is the canonical local and CI wrapper.
- `./run.sh check` is non-mutating and runs Prettier checks plus ESLint.
- `./run.sh format` is mutating and applies Prettier plus ESLint fixes.
- `./run.sh test` runs unit/integration tests and enforces behavior-unit coverage.
- `./run.sh e2e-tests` runs Playwright flows against mocked Flickr/image responses.
- `./run.sh build` runs the production Vite build.
- CI installs with `npm ci`, uses npm `11.13.0`, runs split validation gates, preserves the SPA fallback artifact, and deploys to GitHub Pages only from `main` after required checks pass.

## Runtime And Dependency Policy

- Runtime is pinned to Node `24.16.0` and npm `11.13.0`.
- Package management is npm-only with `package-lock.json`; direct dependencies are exact-pinned.
- `.npmrc` enforces strict engines, exact saves, and `min-release-age=7`.
- Browser support is modern evergreen only. The active project does not use TypeScript, runtime validation libraries, legacy polyfill packages, Axios, Vue Masonry, or old package-manager workflows.
