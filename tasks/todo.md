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
- [ ] Axios, `core-js`, TypeScript support, and the abandoned masonry dependency are removed after replacement/parity is proven.
- [ ] Masonry is replaced with CSS-only behavior; no masonry replacement package of any kind is added, including exact-pinned package alternatives.
- [ ] README and `docs/PROJECT.md` are updated; other process docs stay untouched except tiny unavoidable corrections.
- [ ] Cleanup removes unused handlers, state, comments, styles, scaffold residue, stale config, and dead dependencies after parity is green.
- [ ] Required done evidence is green: `rtk npm ci`, `rtk ./run.sh format`, `rtk ./run.sh check`, `rtk ./run.sh test`, `rtk ./run.sh e2e-tests`, `rtk ./run.sh build`, `rtk npm audit signatures --min-release-age=0`, and `rtk npm audit --audit-level=high`.
- [ ] Browser visual checks pass for Home/gallery and About on desktop and mobile.
- [ ] Branch protection evidence exists on `main`, or a user-approved deferral is documented.

## Phases

- [x] Phase 1: Truthful Local Validation
- [ ] Phase 2: Reproducible Runtime Baseline
- [ ] Phase 3: CI, Dependabot, And Deployment Gates
- [ ] Phase 4: Route And Production Preview Parity
- [ ] Phase 5: First Gallery Load Characterization
- [ ] Phase 6: Gallery Continuation Characterization
- [ ] Phase 7: Cache And Failed-Load Recovery
- [ ] Phase 8: Image Card Interaction Contract
- [ ] Phase 9: Native Fetch Flickr Client
- [ ] Phase 10: Deep Gallery Service
- [ ] Phase 11: Observer Boundary
- [ ] Phase 12: CSS Masonry Layout Boundary
- [ ] Phase 13: Framework And JavaScript Modernization
- [ ] Phase 14: Repository Docs
- [ ] Phase 15: Final Cleanup And Parity Closure
- [ ] Final verification

## TDD Slice Log (Required)

- [x] Slice 1: Truthful local validation
  - RED command + failure: `rtk node --test tests/run-contract.test.js` failed because `run.sh check` exited through unsupported-command usage instead of dispatching package-backed validation; the mutation split also failed because `format` was still a placeholder and did not rewrite the fixture file.
  - GREEN command + pass: `rtk ./run.sh test` passed with wrapper contract coverage and Vitest behavior-unit coverage at 100% lines, above the 90% gate.
- [x] Phase 1 review addendum: truthful local validation contract
  - RED command + failure: `rtk node --test tests/run-contract.test.js` failed because `run.sh format` left the auto-fixable ESLint `no-regex-spaces` issue unchanged after `run.sh check` reported it without mutating the fixture.
  - GREEN command + pass: `rtk node --test tests/run-contract.test.js` passed after `format` ran ESLint `--fix` over the same target set as `check`.
- [ ] Slice 2: Reproducible runtime baseline
  - RED command + failure:
  - GREEN command + pass:

## Working Notes

- Phase 1 helper command contract: existing `rtk-hook`, `safety-hook`, and `setup-environment` responsibilities remain available in `run.sh`; no helper was removed as no longer applicable.
- Phase 1 review addendum restored the legacy empty `ImageCard` click handlers and keeps `vue/valid-v-on` disabled until the planned cleanup phase can remove that production residue in scope.

## Results
