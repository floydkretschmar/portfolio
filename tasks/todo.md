# Repository Renovation Tasks

**Branch:** feature/repository-renovation
**Scheme:** docs/schemes/2026-06-14-repository-renovation.md
**Spec:** docs/specs/2026-06-14-repository-renovation.md

## Acceptance Criteria

- [ ] Home/gallery and About behavior remain visually and behaviorally equivalent to the current production experience.
- [ ] The external Flickr service contract remains exactly `GET /photos/{photoset}?page={page}&limit={limit}`.
- [ ] `run.sh` exposes and backs `format`, `check`, `test`, `e2e-tests`, and `build`.
- [ ] `run.sh test` runs unit/integration tests only and enforces at least 90% line coverage for behavior-tested units.
- [ ] Playwright e2e covers the mandatory core UI flows with deterministic mocked Flickr/image responses.
- [ ] CI defers to `run.sh`, uses `npm ci`, and gates deploy after required validation.
- [ ] Dependabot covers npm and GitHub Actions only, with automerge rules matching the spec.
- [ ] `gallery-service` is extracted under the service layer with injected dependencies.
- [x] Axios, `core-js`, TypeScript support, and the abandoned masonry dependency are removed after replacement/parity is proven.
- [ ] Masonry is replaced with CSS-only behavior; no masonry replacement package of any kind is added, including exact-pinned package alternatives.
- [x] README and `docs/PROJECT.md` are updated; other process docs stay untouched except tiny unavoidable corrections.
- [ ] Cleanup removes unused handlers, state, comments, styles, scaffold residue, stale config, and dead dependencies after parity is green.
- [ ] Required done evidence is green: `rtk npm ci`, `rtk ./run.sh format`, `rtk ./run.sh check`, `rtk ./run.sh test`, `rtk ./run.sh e2e-tests`, `rtk ./run.sh build`, `rtk npm audit signatures --min-release-age=0`, and `rtk npm audit --audit-level=high`.
- [ ] Browser visual checks pass for Home/gallery and About on desktop and mobile.
- [ ] Branch protection evidence exists on `main`, or a user-approved deferral is documented.

## Phases

- [x] Phase 1: Truthful Local Validation
- [x] Phase 2: Reproducible Runtime Baseline
- [x] Phase 3: CI, Dependabot, And Deployment Gates
- [x] Phase 4: Route And Production Preview Parity
- [x] Phase 5: First Gallery Load Characterization
- [x] Phase 6: Gallery Continuation Characterization
- [x] Phase 7: Cache And Failed-Load Recovery
- [x] Phase 8: Image Card Interaction Contract
- [x] Phase 9: Native Fetch Flickr Client
- [x] Phase 10: Deep Gallery Service
- [x] Phase 11: Observer Boundary
- [x] Phase 12: CSS Masonry Layout Boundary
- [x] Phase 13: Framework And JavaScript Modernization
- [x] Phase 14: Repository Docs
- [ ] Phase 15: Final Cleanup And Parity Closure
- [ ] Final verification

## TDD Slice Log (Required)

- [x] Slice 1: Truthful local validation
  - RED command + failure: `rtk node --test tests/run-contract.test.js` failed because `run.sh check` exited through unsupported-command usage instead of dispatching package-backed validation; the mutation split also failed because `format` was still a placeholder and did not rewrite the fixture file.
  - GREEN command + pass: `rtk ./run.sh test` passed with wrapper contract coverage and Vitest behavior-unit coverage at 100% lines, above the 90% gate.
- [x] Phase 1 review addendum: truthful local validation contract
  - RED command + failure: `rtk node --test tests/run-contract.test.js` failed because `run.sh format` left the auto-fixable ESLint `no-regex-spaces` issue unchanged after `run.sh check` reported it without mutating the fixture.
  - GREEN command + pass: `rtk node --test tests/run-contract.test.js` passed after `format` ran ESLint `--fix` over the same target set as `check`.
- [x] Slice 2: Reproducible runtime baseline
  - RED command + failure: `rtk ./run.sh check` failed after the new repository policy gate was wired in because `scripts/check-repository-policy.js` did not exist yet; `rtk node --test tests/run-contract.test.js` also failed on the public policy-checker fixture contract.
  - GREEN command + pass: `rtk ./run.sh check && rtk npm ci && rtk ./run.sh build` passed after pinning Node `24.16.0`, npm `11.13.0`, exact direct dependencies, `.npmrc` release-age/engine/exact-save policy, and lockfile root consistency.
- [x] Phase 2 review addendum: repository policy checker validation coverage
  - RED command + failure: `rtk node --test tests/run-contract.test.js` failed because `run.sh check` passed even when `scripts/validation-target.js` in the package-script fixture had a formatting violation, proving `scripts/**/*.js` was not covered by the package validation targets.
  - GREEN command + pass: `rtk node --test tests/run-contract.test.js` passed after adding `scripts/**/*.js` to the Prettier and ESLint target sets for both `check` and `format`.
- [x] Slice 3: CI, Dependabot, and deployment gates
  - RED command + failure: `rtk ./run.sh check` failed after the Phase 3 repository policy gate was added because `.github/workflows/ci.yml` did not exist and the old Pages-only workflow still used the pre-governance deployment path.
  - GREEN command + pass: `rtk ./run.sh check && rtk ./run.sh test && rtk ./run.sh e2e-tests && rtk ./run.sh build && rtk npm audit signatures --min-release-age=0` passed after splitting CI into required `run.sh`/audit gates, adding npm and GitHub Actions Dependabot policy, adding safe Dependabot automerge, preserving the Pages SPA fallback artifact, and documenting branch-protection deferral.
- [x] Phase 3 automerge alignment addendum
  - RED command + failure: `rtk ./run.sh check` failed while the policy checker still accepted the drifted one-job `pull_request_target` automerge workflow with a separate helper script.
  - GREEN command + pass: `rtk ./run.sh check` passed after matching the Flickr service `Dependabot Automerge` workflow structure, keeping only the npm `security-update:semver-patch` allowance as the intentional difference.
- [x] Phase 3 review-fix addendum: privileged automerge no-checkout policy
  - RED command + failure: `rtk node --test tests/run-contract.test.js` failed because the repository policy checker returned success when the Dependabot automerge workflow fixture used `actions/checkout@v5`.
  - GREEN command + pass: `rtk node --test tests/run-contract.test.js` passed after `scripts/check-repository-policy.js` rejected checkout usage in `.github/workflows/dependabot-automerge.yml`.
- [x] Phase 3 review-fix addendum: non-mutating required checks
  - RED command + failure: spec review found `ci/format` was being promoted into branch-protection and deploy-required checks even though the scheme requires non-mutating `ci/check`; the automerge workflow still needs `ci/format` to remain structurally aligned with the Flickr service reference.
  - GREEN command + pass: `rtk node --test tests/run-contract.test.js` passed after deploy and branch-protection policy rejected requiring `ci/format` while preserving it in the automerge required-check list.
- [x] Phase 4: Route and production preview parity
  - RED command + failure: `rtk ./run.sh test` failed because the real app/bootstrap route smoke could not parse `src/App.vue` without the Vite Vue transform; `rtk ./run.sh e2e-tests` failed because the new production-preview route flow had no preview `baseURL`.
  - GREEN command + pass: `rtk ./run.sh test && rtk ./run.sh e2e-tests && rtk ./run.sh build` passed after reusing Vite config in Vitest, switching router history to `import.meta.env.BASE_URL`, removing the obsolete `process.env` Vite shim, and running Playwright against a fresh built preview with deterministic Flickr route data.
  - Browser visual check: built preview on `127.0.0.1:4174` passed for Home and direct `/about` at 1280x720 and 390x844 with deterministic Flickr data; headers, gallery image, About copy, root URLs, and no horizontal overflow were confirmed, with zero console errors during the mocked visual pass.
- [x] Phase 5: First gallery load characterization
  - RED command + failure: `rtk ./run.sh test` failed after adding the first Home/gallery characterization because the rendered thumbnail image had no accessible `alt` text; the failed first-page slice later failed with an unhandled Flickr rejection while skeletons remained visible.
  - GREEN command + pass: `rtk ./run.sh format && rtk ./run.sh test && rtk ./run.sh e2e-tests && rtk ./run.sh build` passed after adding local gallery fixtures, locking skeleton-before-photo behavior, first request shape, rendered photo details, no new error UI, mocked Home e2e data, delayed image skeleton behavior, thumbnail accessible text, and local failed-load recovery.
- [x] Phase 6: Gallery continuation characterization
  - RED command + failure: `rtk ./run.sh test && rtk ./run.sh e2e-tests` failed after adding continuation coverage because the third returned final-page photo never rendered; the existing partial-page trim removed one returned photo.
  - GREEN command + pass: `rtk ./run.sh test && rtk ./run.sh e2e-tests` passed after fixing the final-page trim boundary and adding component/integration plus e2e coverage for page-two append, visible page-one preservation, pending duplicate-trigger suppression, and exact partial final-page rendering.
- [x] Phase 7: Cache and failed-load recovery
  - RED command + failure: `rtk ./run.sh test` failed because corrupted `home-data` threw during gallery creation, incomplete cache data crashed before a fresh load, and the new cache adapter contract did not exist.
  - GREEN command + pass: `rtk ./run.sh test` passed with valid/expired/invalid cache restore behavior, direct cache adapter read/write/remove/invalid JSON/TTL coverage, production fresh-load persistence, and failed continuation recovery without new error UI.
  - REFACTOR command + pass: `rtk ./run.sh test` passed after consolidating local cache fixtures and removing component-side cache parsing duplication.
  - REVIEW FIX command + pass: `rtk ./run.sh test` passed after rejecting parseable but incomplete gallery snapshot data in the cache boundary and proving the fresh-load recovery path.
- [x] Phase 8: Image card interaction contract
  - RED command + failure: `rtk ./run.sh test -- tests/behavior/gallery/image-card.test.js` failed because the displayed card image stayed on the broken thumbnail URL instead of switching to the fixture fallback URL.
  - GREEN command + pass: `rtk ./run.sh test -- tests/behavior/gallery/image-card.test.js` passed after adding displayed-image fallback behavior and component coverage for skeleton transition, loaded metadata, accessible image text, hover overlay, dialog open/close, and modal fallback.
  - PLAYWRIGHT command + pass: `rtk ./run.sh e2e-tests` passed with browser coverage for clicking a loaded image to open/close the dialog and for a mocked displayed-image request failure switching to the fixture fallback URL.
  - REFACTOR command + pass: `rtk ./run.sh test && rtk ./run.sh e2e-tests` passed after removing empty card click handlers and unused card state.
  - REVIEW FIX command + pass: `rtk ./run.sh test -- tests/behavior/gallery/image-card.test.js && rtk ./run.sh e2e-tests` passed after using the existing service-shaped `picture.fallback` field for displayed image failures.
- [x] Phase 9: Native Fetch Flickr Client
  - RED command + failure: `rtk ./run.sh test && rtk ./run.sh e2e-tests` failed because `src/services/flickr-client.js` did not exist for the new native-fetch Flickr contract test.
  - RED command + failure: `rtk ./run.sh test && rtk ./run.sh e2e-tests` failed because Home still used the Axios path and the native `fetch` spy received zero calls for `/photos/{photoset}?page=1&limit=20`.
  - GREEN command + pass: `rtk ./run.sh test && rtk ./run.sh e2e-tests && rtk ./run.sh build` passed after wiring Home to the injected native-fetch Flickr client, preserving visible gallery behavior, covering non-OK/invalid JSON/missing fetch failures, deleting the old TypeScript service surface, and removing Axios.
  - REFACTOR command + pass: `rtk ./run.sh format && rtk ./run.sh test && rtk ./run.sh e2e-tests && rtk ./run.sh build` passed after replacing the stale behavior-unit coverage include with `src/services/flickr-client.js`.
- [x] Phase 10: Deep Gallery Service
  - RED command + failure: `rtk ./run.sh test -- tests/behavior/services/gallery-service.test.js` failed because `src/services/gallery-service.js` did not exist for the new DOM-free gallery snapshot service behavior.
  - GREEN command + pass: `rtk ./run.sh test -- tests/behavior/services/gallery-service.test.js` passed after `restore()` returned a deterministic renderable skeleton snapshot using injected cache, page-size, and placeholder boundaries.
  - RED command + failure: `rtk ./run.sh test -- tests/behavior/services/gallery-service.test.js` failed because `service.loadNext` did not exist for first-page loading and normalization.
  - GREEN command + pass: `rtk ./run.sh test -- tests/behavior/services/gallery-service.test.js` passed after `loadNext()` requested the injected Flickr client with injected page size, normalized raw page data into renderable card fields, advanced pagination, and wrote the snapshot through the injected cache.
  - RED command + failure: `rtk ./run.sh test -- tests/behavior/services/gallery-service.test.js` failed because a repeated `loadNext()` while the first request was pending issued a duplicate Flickr request.
  - GREEN command + pass: `rtk ./run.sh test -- tests/behavior/services/gallery-service.test.js` passed after the service guarded pending loads and returned the current renderable loading snapshot without duplicate requests.
  - RED command + failure: `rtk ./run.sh test -- tests/behavior/services/gallery-service.test.js` failed because a rejected Flickr request escaped from `loadNext()` instead of preserving the current visible failed-load snapshot.
  - GREEN command + pass: `rtk ./run.sh test -- tests/behavior/services/gallery-service.test.js` passed after request failures cleared pending state, skipped cache writes, preserved the current renderable snapshot, and allowed a later load to succeed.
  - RED command + failure: `rtk ./run.sh test -- tests/behavior/services/gallery-service.test.js` failed because cached final-page snapshots were restored as load-eligible.
  - GREEN command + pass: `rtk ./run.sh test -- tests/behavior/services/gallery-service.test.js` passed after restore derived load eligibility from cached pagination state.
  - RED command + failure: `rtk ./run.sh test -- tests/behavior/gallery/first-load.test.js` failed because Home still passed raw Flickr fields directly to `ImageCard`, causing `image.thumbnail.height` to be missing and the raw photo not to render.
  - GREEN command + pass: `rtk ./run.sh test -- tests/behavior/gallery/first-load.test.js` passed after Home consumed gallery service snapshots, page size moved to injected config, component-side pagination/cache logic was removed, and the synchronous scroll guard preserved characterized continuation behavior.
  - RED command + failure: `rtk ./run.sh test` failed after `src/services/gallery-service.js` was added to behavior-unit coverage and branch coverage was enforced; the report showed gallery service branch coverage at 95.83% with the missing branch on title fallback normalization.
  - GREEN command + pass: `rtk ./run.sh test` passed with 100% statements, branches, functions, and lines after adding the untitled raw-photo normalization behavior case.
  - REFACTOR command + pass: `rtk ./run.sh test` passed after trimming duplicated snapshot state from the component, consuming snapshot alt text in `ImageCard`, removing duplicate continuation snapshot application, cleaning up the scroll listener on unmount, and documenting the gallery contracts with JSDoc.
- [x] Phase 11: Observer Boundary
  - RED command + failure: `rtk ./run.sh test && rtk ./run.sh e2e-tests` failed after adding the active-gallery observer sentinel behavior because the mounted Home gallery created zero `IntersectionObserver` instances; the old scroll-listener implementation also leaked a failed mounted app into the next continuation test when the new RED assertion stopped before cleanup.
  - GREEN command + pass: `rtk ./run.sh test && rtk ./run.sh e2e-tests` passed after wiring Home to an injectable native observer boundary, observing the production sentinel, requesting gallery continuation only on intersecting entries, preserving pending duplicate-load suppression, and disconnecting on route/component unmount.
  - REFACTOR command + pass: `rtk ./run.sh test && rtk ./run.sh e2e-tests` passed after removing production scroll listener orchestration and scroll-math helpers, adding behavior-unit coverage for the observer boundary, keeping the previous 200px preload distance as observer `rootMargin`, and extending the production-preview route e2e check to prove About navigation leaves no stale page-two request.
- [x] Phase 12: CSS Masonry Layout Boundary
  - PRE-REPLACEMENT Browser/Chromium baseline: captured on 2026-06-14 before red tests or production masonry edits while `vue-masonry` directives/plugin were still active.
  - Desktop Home baseline at `1365x900`: 40 `.item` elements from the live page load, no horizontal overflow (`scrollWidth=clientWidth=1365`), 3 visual columns at x `138/508/878`, column density `13/14/13`, cards keep the old 350px width rhythm with roughly 20px vertical gutter between non-zero cards.
  - Mobile Home baseline at `390x844`: 40 `.item` elements, no horizontal overflow (`scrollWidth=clientWidth=390`), 1 visual column at x `20`, 350px card width, same roughly 20px vertical rhythm.
  - Page-two append baseline at `1365x900` with deterministic mocked Flickr pages using the current masonry path: card count grew from 20 to 23, no horizontal overflow, 3 columns with density `8/8/7`, first-page card `baseline-first-page photo 1` remained in the DOM, and appended cards `baseline-second-page photo 1..3` entered the masonry flow and were visible near the bottom.
  - RED command + failure: `rtk ./run.sh check && rtk ./run.sh test && rtk ./run.sh e2e-tests` failed after adding the Phase 12 policy/layout checks because `package.json` still declared `vue-masonry` and `src` still contained the abandoned directive/plugin/redraw path.
  - GREEN command + pass: `rtk ./run.sh check && rtk ./run.sh test && rtk ./run.sh e2e-tests && rtk ./run.sh build` passed after replacing the production path with a local `[data-gallery-layout="masonry"]` CSS-column boundary, removing `VueMasonryPlugin`, removing `v-masonry`/`v-masonry-tile` usage and `$redrawVueMasonry()`, and uninstalling `vue-masonry`.
  - REFACTOR command + pass: `rtk ./run.sh check && rtk ./run.sh test && rtk ./run.sh e2e-tests && rtk ./run.sh build` passed after deleting the obsolete masonry directive test shim and moving card width/gap usage to the CSS layout boundary variables.
  - POST-REPLACEMENT Browser/Chromium evidence: desktop `1365x900` rendered 40 `.item` elements/20 non-zero loaded cards, no horizontal overflow, 3 columns at x `138/508/878`, density `7/6/7`, 350px cards, container x `138` width `1090`, and the card spacing/size rhythm stayed at the baseline-like 350px card width with roughly 20px vertical gutter; mobile `390x844` rendered 40 `.item` elements/20 non-zero loaded cards, no horizontal overflow, 1 column at x `20`, 350px cards with the same roughly 20px rhythm; deterministic page-two append grew from 20 to 23 cards, no horizontal overflow, 3 columns with density `8/7/8`, first-page card `baseline-first-page photo 1` remained in the DOM, and appended `baseline-second-page photo 1..3` were visible in the CSS masonry flow with the same spacing rhythm.
- [x] Phase 13: Framework and JavaScript modernization
  - RED command + failure: `rtk ./run.sh check && rtk ./run.sh test && rtk ./run.sh e2e-tests && rtk ./run.sh build && rtk npm audit --audit-level=high` failed after adding the Phase 13 policy checks because the repo still declared old framework/tooling targets, direct `core-js`, TypeScript validation globs, Vite TypeScript resolver extensions, and legacy `.eslintrc.cjs` lint config.
  - GREEN command + pass: `rtk ./run.sh check`, `rtk ./run.sh test`, `rtk ./run.sh e2e-tests`, `rtk ./run.sh build`, and `rtk npm audit --audit-level=high` passed after upgrading to the exact target dependency table, removing `core-js`, deleting stale browser/TypeScript config, adding flat ESLint config, preserving dialog close behavior under Vuetify 4, and generating the lockfile with the approved one-time `--min-release-age=0` override before normal `npm ci`.
  - REFACTOR command + pass: `rtk ./run.sh format && rtk ./run.sh check && rtk ./run.sh test && rtk ./run.sh e2e-tests && rtk ./run.sh build && rtk npm audit --audit-level=high` passed after removing obsolete scaffold comments, webpack chunk comments, old resolver assumptions, and the temporary `vue/valid-v-on` compatibility rule.
- [x] Phase 14: Repository Docs
  - RED baseline + stale-doc evidence: `rtk ./run.sh check` passed before documentation changes, so markdown/format validation was already green; manual stale-doc review remained red because `README.md` still contained scaffold package-manager/lint commands and `docs/PROJECT.md` still referenced stale TypeScript and Vue Masonry architecture.
  - GREEN command + pass: `rtk ./run.sh check` passed after rewriting `README.md` and `docs/PROJECT.md` to describe the renovated Vue/Vite client, `run.sh` command surface, validation/e2e/build/deploy expectations, pinned npm runtime policy, and the external Flickr service contract without claiming backend ownership.
  - REFACTOR command + pass: `rtk ./run.sh check` passed after removing duplicated scaffold/operator text and keeping the README focused on operations while `docs/PROJECT.md` carries the durable module and service-boundary overview.
  - REVIEW FIX command + pass: `rtk npm exec -- prettier docs/PROJECT.md --check && rtk ./run.sh check && rtk node --test tests/run-contract.test.js` passed after adding `docs/PROJECT.md` to the wrapper format/check targets and formatting the project overview.

## Working Notes

- Phase 1 helper command contract: existing `rtk-hook`, `safety-hook`, and `setup-environment` responsibilities remain available in `run.sh`; no helper was removed as no longer applicable.
- Phase 1 review addendum restored the legacy empty `ImageCard` click handlers and keeps `vue/valid-v-on` disabled until the planned cleanup phase can remove that production residue in scope.
- Phase 3 branch protection: remote branch protection was not applied. The user approved repository config changes only, so `.github/branch-protection.md` documents deferral until explicit approval.
- Phase 3 review-fix addendum did not remediate dependency vulnerabilities. Phase 3 only proves the `ci/audit-vulnerabilities` gate name and command exist; high-severity audit success remains scheduled for Phase 13 and final evidence.
- Phase 3 keeps `ci/format` only for Dependabot automerge parity with `/home/floyd/Projects/flickr-service/`; portfolio deploy and branch-protection requirements use the non-mutating `ci/check` gate.
- Phase 12 baseline capture used the available Playwright Chromium surface after the in-app Browser plugin refused navigation twice with a browser-runtime guard. The page-two append baseline used deterministic mocked Flickr responses because the live configured photoset did not append a second page during the capture window.

## Results
