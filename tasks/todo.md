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
- [x] Phase 2: Reproducible Runtime Baseline
- [x] Phase 3: CI, Dependabot, And Deployment Gates
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

## Working Notes

- Phase 1 helper command contract: existing `rtk-hook`, `safety-hook`, and `setup-environment` responsibilities remain available in `run.sh`; no helper was removed as no longer applicable.
- Phase 1 review addendum restored the legacy empty `ImageCard` click handlers and keeps `vue/valid-v-on` disabled until the planned cleanup phase can remove that production residue in scope.
- Phase 3 branch protection: remote branch protection was not applied. The user approved repository config changes only, so `.github/branch-protection.md` documents deferral until explicit approval.
- Phase 3 review-fix addendum did not remediate dependency vulnerabilities. Phase 3 only proves the `ci/audit-vulnerabilities` gate name and command exist; high-severity audit success remains scheduled for Phase 13 and final evidence.
- Phase 3 keeps `ci/format` only for Dependabot automerge parity with `/home/floyd/Projects/flickr-service/`; portfolio deploy and branch-protection requirements use the non-mutating `ci/check` gate.

## Results
