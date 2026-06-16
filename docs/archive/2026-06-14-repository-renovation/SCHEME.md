# Scheme: Repository Renovation

> Source spec: `docs/specs/2026-06-14-repository-renovation.md`

## Architectural decisions

Durable decisions that apply across all phases:

- **Routes**: `/` remains the Home/gallery route and `/about` remains the About route. Both routes remain inside the shared application shell. Production remains root-hosted at `/` for `https://floydkretschmar.com/`.
- **Schema**: No database schema exists and no backend schema is introduced. Browser cache data is internal app data and may change shape. The external Flickr service contract must stay exactly `GET /photos/{photoset}?page={page}&limit={limit}`.
- **Key models**: Durable data concepts are `FlickrPhoto`, `GallerySnapshot`, `GalleryCacheEntry`, and `GalleryPageResult`. These are documented with JSDoc in plain JavaScript, not TypeScript and not a runtime validation library.
- **Service boundaries**: The app uses a DOM-free `gallery-service`, a native-fetch Flickr client, an injected cache boundary, an injected clock/randomness boundary, a native `IntersectionObserver` browser boundary, and a local masonry/layout boundary.
- **Masonry**: The current abandoned masonry implementation must be replaced with CSS-only masonry. Do not add any masonry replacement package, including exact-pinned package alternatives. The CSS replacement should stay as close to current visitor behavior as possible with no major UX change.
- **Validation**: `run.sh` is the single local and CI validation entry point. Required commands are `format`, `check`, `test`, `e2e-tests`, and `build`.
- **Testing boundaries**: Tests validate behavior through public interfaces and observable outcomes. Coverage is collected from behavior tests, but tests must not validate coverage mechanics, repository policy, dependency state, or architecture constraints.
- **Refactor verification**: Every aggressive refactor step must rerun the same green command from that phase's verification step before the phase can be considered complete.
- **CI and governance**: CI uses `npm ci`, calls `run.sh`, splits validation gates like the reference service plus e2e, and deploys only after required checks pass. Branch protection changes require explicit user approval during execution.
- **Documentation**: Only `README.md` and `docs/PROJECT.md` are updated as planned documentation work.

---

## Phase 1: Truthful Local Validation

**User stories**: 1, 2, 4, 5, 6, 7, 8, 60, 61, 62, 63, 74

### What to build

Make local validation real before any behavior migration. This slice introduces the minimum package-backed command surface and wrapper contract so later slices can trust `run.sh`.

#### Step 1.1: Write failing test

- Wrapper command contract
  - Supported command dispatch
    - Happy path:
      - `check` command -> invokes non-mutating check command and returns success when checks pass
      - `format` command -> invokes mutating format command and returns success when formatting/fixable lint succeeds
      - `test` command -> invokes unit/integration behavior tests with coverage enabled
      - `e2e-tests` command -> invokes Playwright command
      - `build` command -> invokes production build command
    - Edge case: unknown command -> exits non-zero and prints usage
    - Edge case: supported command with failing package script -> exits non-zero
    - Edge case: `test` dispatch assertion -> uses a narrow wrapper-contract runner or fixture/stub package scripts and never proves `run.sh test` by recursively invoking `run.sh test`
  - Mutation split
    - Happy path: `check` on already formatted code -> no file changes
    - Edge case: formatting violation -> `check` fails without rewriting the file
    - Happy path: `format` on formatting violation -> rewrites the file and returns success
- Coverage reporting
  - Happy path: behavior tests run with coverage enabled
  - Edge case: missing behavior remains visible through the coverage report and behavior-test failures
- Helper command contract
  - Happy path: existing hook/setup helper responsibilities remain available where applicable
  - Edge case: a helper is no longer applicable -> the inspected removal decision is documented in the phase notes

**Run:** Execute the narrow wrapper-contract test command directly while proving dispatch behavior; use `rtk ./run.sh test` only after the contract test path cannot recurse into itself.
**Expect:** FAIL (red)

#### Step 1.2: Implement minimal code

Add the smallest real command harness and package scripts required for `run.sh` to dispatch meaningful `format`, `check`, `test`, `e2e-tests`, and `build` commands. Keep the test target tiny but real, with coverage collected from behavior tests.

#### Step 1.3: Verify test passes

**Run:** `rtk ./run.sh test`
**Expect:** PASS (green)

#### Step 1.4: Aggressive refactor

- Remove placeholder wrapper functions.
- Remove duplicated package-script aliases that are not called by `run.sh`.
- Consolidate wrapper usage output.
- Keep mutating and non-mutating command paths separate.
- Delete any temporary fake test target once a real contract test is green.

#### Step 1.5: Manual verification

1. Run `rtk ./run.sh check` on the clean tree and confirm it succeeds without changing files.
2. Introduce a harmless formatting-only edit, run `rtk ./run.sh check`, and confirm it fails without rewriting the file.
3. Run `rtk ./run.sh format` and confirm it fixes the formatting.
4. Run `rtk ./run.sh test`, `rtk ./run.sh e2e-tests`, and `rtk ./run.sh build`; confirm each executes real work.

### Acceptance criteria

- [ ] `run.sh` commands are real, package-backed, and non-placeholder.
- [ ] `check` is non-mutating and `format` is mutating.
- [ ] `test` runs behavior tests with coverage enabled.
- [ ] Unsupported wrapper commands fail clearly.
- [ ] Existing `run.sh` hook/setup helper responsibilities are preserved where applicable or deliberately documented as no longer applicable.

---

## Phase 2: Reproducible Runtime Baseline

**User stories**: 17, 18

### What to build

Pin the runtime and package-management contract before dependency modernization. The current app must still install and build from a clean checkout.

#### Step 2.1: Write failing command checks

- Repository command checks (`run.sh check`, not tests)
  - Happy path:
    - declared Node version -> matches `24.16.0`
    - declared npm package manager -> matches `npm@11.13.0`
    - engine policy -> rejects unsupported Node versions
    - release-age policy -> sets `min-release-age=7`, matching the reference service policy
  - Edge case: package manager missing -> validation fails
  - Edge case: loose direct dependency range -> validation fails
  - Edge case: release-age policy missing -> validation fails

**Run:** `rtk ./run.sh check`
**Expect:** FAIL (red command check)

#### Step 2.2: Implement minimal code

Add exact Node/npm runtime declarations, npm policy, exact direct dependency policy, and lockfile consistency while preserving the current production build.

#### Step 2.3: Verify test passes

**Run:** `rtk npm ci && rtk ./run.sh check && rtk ./run.sh build`
**Expect:** PASS (green)

#### Step 2.4: Aggressive refactor

- Remove obsolete package manager hints.
- Remove duplicated engine/version notes.
- Keep dependency policy in one canonical place where possible.

#### Step 2.5: Manual verification

1. Remove installed dependencies.
2. Run `rtk npm ci`.
3. Run `rtk ./run.sh build`.
4. If lockfile drift exists, confirm `rtk npm ci` fails rather than silently updating dependencies.
5. Preview the built app and confirm `/` loads.

### Acceptance criteria

- [ ] Node is pinned to `24.16.0`.
- [ ] npm is pinned to `11.13.0`.
- [ ] Direct dependency policy is exact.
- [ ] Release-age policy sets `min-release-age=7`, matching the reference service.
- [ ] Clean install plus build is green.

---

## Phase 3: CI, Dependabot, And Deployment Gates

**User stories**: 9, 10, 11, 12, 13, 14, 15, 16, 19, 21, 71, 72, 74

### What to build

Move repository automation to the same governance model as the reference service before app refactors begin. CI must call `run.sh`, use `npm ci`, include package signature and high-severity vulnerability audits, and gate deploys after validation.
This phase proves the `ci/audit-vulnerabilities` gate exists with the required name and command; high-severity audit success is proven after vulnerable dependency removal/upgrade in Phase 13 and again in final evidence. Branch protection is applied only after explicit user approval when required checks are green, or explicitly deferred.

#### Step 3.1: Write failing command checks

- Repository workflow checks (`run.sh check`, not tests)
  - Happy path:
    - npm setup gate -> installs and uses `npm@11.13.0`
    - install gate -> uses `npm ci`
    - audit signature gate -> runs `npm audit signatures --min-release-age=0`
    - audit vulnerability gate -> runs high-severity audit
    - check gate -> calls `run.sh check`
    - build gate -> calls `run.sh build`
    - test command -> calls `run.sh test`
    - e2e gate -> calls `run.sh e2e-tests`
    - deploy gate -> depends on required validation gates and runs only on `main`
    - GitHub Pages SPA fallback -> preserves the deploy artifact behavior that serves the app for direct static routes
  - Edge case: inline complex validation shell in CI -> validation fails
  - Edge case: required check name mismatch -> validation fails
- Dependabot/automerge checks (`run.sh check`, not tests)
  - Happy path: npm patch/minor update with green checks -> eligible for automerge
  - Happy path: npm security patch/minor update with green checks -> eligible for automerge
  - Edge case: npm major update -> PR opens but does not automerge
  - Edge case: npm security major update -> PR opens but does not automerge
  - Happy path: GitHub Actions major update with green checks -> eligible for automerge
  - Happy path: Dependabot schedule -> weekly with seven-day cooldown
  - Edge case: Docker ecosystem present -> validation fails
  - Edge case: missing metadata or required checks -> automerge does not enable
  - Edge case: unclassified update type -> automerge does not enable
- Secrets/credentials review (manual review, not tests)
  - Happy path: workflows use only least-privilege `GITHUB_TOKEN` permissions needed for GitHub Pages and validation unless separately approved
  - Edge case: new secret material, PAT dependency, or credential configuration appears -> manual/static review fails

**Run:** `rtk ./run.sh check`
**Expect:** FAIL (red command check)

#### Step 3.2: Implement minimal code

Split CI into required gates, add Dependabot npm/GitHub Actions config with weekly cooldown, add safe automerge rules, and prepare branch-protection steps for explicit user approval.

#### Step 3.3: Verify test passes

**Run:** `rtk ./run.sh check && rtk ./run.sh test && rtk ./run.sh e2e-tests && rtk ./run.sh build && rtk npm audit signatures --min-release-age=0`
**Expect:** PASS (green)

#### Step 3.4: Aggressive refactor

- Remove old monolithic deploy workflow logic.
- Remove duplicated CI shell fragments that belong in `run.sh`.
- Consolidate required check names in automerge workflow rules.

#### Step 3.5: Manual verification

1. Inspect CI job names and confirm they match required status checks.
2. Confirm deploy waits for validation gates on `main`.
3. Confirm Dependabot has npm and GitHub Actions only.
4. Confirm npm majors do not automerge.
5. Confirm no new secret material, PAT dependency, or credential configuration was added.
6. Pause for explicit approval before applying branch protection, or document approved deferral.

### Acceptance criteria

- [ ] CI calls `run.sh` and uses `npm ci`.
- [ ] CI installs and uses npm `11.13.0`.
- [ ] Required checks include install, signature audit, vulnerability audit, check, build, test, e2e, and deploy.
- [ ] GitHub Pages SPA fallback artifact behavior is preserved.
- [ ] Dependabot/automerge rules match the spec.
- [ ] CI/automerge changes introduce no new secrets or credential requirements.
- [ ] Branch protection is configured after approval or explicitly deferred by the user.

---

## Phase 4: Route And Production Preview Parity

**User stories**: 3, 30, 31, 32, 33, 65, 66, 75

### What to build

Lock the route shell and production preview behavior before changing gallery internals. Root hosting remains unchanged while base handling becomes Vite-native.

#### Step 4.1: Write failing test

- Route rendering
  - Happy path:
    - `/` -> renders the shared shell and Home/gallery surface
    - `/about` -> renders the shared shell and About content
    - in-app navigation from Home to About -> renders About without full page reload
    - in-app navigation from About to Home -> renders Home/gallery shell
  - Edge case: direct `/about` in built preview -> renders the app, not a static-host 404
  - Edge case: root base `/` in built preview -> assets and routes resolve
- Vite-native base
  - Happy path: router uses the Vite base value and still behaves as root-hosted
  - Edge case: old Vue CLI-style base access removed -> route behavior remains unchanged
- App bootstrap smoke
  - Happy path: real app bootstrap registers the router and Vuetify so `/` renders through the shared shell
  - Edge case: missing plugin registration -> route smoke test fails through rendered app behavior

**Run:** `rtk ./run.sh test` for route tests, then `rtk ./run.sh e2e-tests` for preview route flow.
**Expect:** FAIL (red)

#### Step 4.2: Implement minimal code

Add route/bootstrap and Playwright production-preview coverage, then move base handling to Vite-native configuration while preserving the root-hosted production contract.

#### Step 4.3: Verify test passes

**Run:** `rtk ./run.sh test && rtk ./run.sh e2e-tests && rtk ./run.sh build`
**Expect:** PASS (green)

#### Step 4.4: Aggressive refactor

- Remove obsolete environment shims only when tests prove behavior is unchanged.
- Consolidate route test fixtures.
- Keep route tests behavior-focused and avoid private router internals.

#### Step 4.5: Manual verification

1. Build and preview the app.
2. Open `/`.
3. Click About, then Home.
4. Open `/about` directly in the preview.
5. Run Browser visual checks for Home and About on desktop and mobile.
6. Confirm header/nav, About content, and root-hosted behavior match the current app.

### Acceptance criteria

- [ ] `/` and `/about` work in app navigation and direct production preview loads.
- [ ] Vite-native base handling preserves root production behavior.
- [ ] About content and shell are unchanged.
- [ ] Browser visual checks pass for Home and About on desktop and mobile after route/base/bootstrap changes.

---

## Phase 5: First Gallery Load Characterization

**User stories**: 25, 32, 34, 35, 43, 49, 64, 75

### What to build

Capture the first visible gallery path before refactoring. The visitor still sees skeletons first, then mocked Flickr photos, with no new error UI.

#### Step 5.1: Write failing test

- Initial load
  - Happy path:
    - delayed page-one response -> skeleton cards appear before photos
    - successful page-one response -> photo cards render after skeletons
    - first page request -> uses configured photoset with `page=1` and configured limit
    - rendered card -> includes title, date, views, image, and accessible text expectation
  - Edge case: delayed response -> no layout collapse before data arrives
  - Unhappy path: failed first page -> existing skeleton/loading presentation remains visible rather than a blank gallery
  - Unhappy path: failed first page -> no toast, modal, banner, alert, retry panel, or new error copy appears
- Deterministic e2e
  - Happy path: mocked Flickr data -> Home renders without live backend dependency
  - Edge case: image fixture delay -> skeleton-before-load behavior remains visible

**Run:** `rtk ./run.sh test` for component behavior, then `rtk ./run.sh e2e-tests` for Home first-load flow.
**Expect:** FAIL (red)

#### Step 5.2: Implement minimal code

Add deterministic fixtures and tests around the live Home route while preserving the existing gallery rendering path.

#### Step 5.3: Verify test passes

**Run:** `rtk ./run.sh test && rtk ./run.sh e2e-tests`
**Expect:** PASS (green)

#### Step 5.4: Aggressive refactor

- Share only local gallery fixtures within the gallery test area.
- Remove duplicate first-load assertions.
- Keep mocks at the network and image boundaries, not internal collaborators.

#### Step 5.5: Manual verification

1. Open Home with a delayed mocked response.
2. Confirm skeleton cards appear first.
3. Confirm photos replace the loading presentation.
4. Confirm no new error UI appears when the first mocked request fails.

### Acceptance criteria

- [ ] Initial skeleton behavior is locked by tests.
- [ ] First Flickr request shape is locked by observable tests.
- [ ] No new user-facing error UI is introduced.
- [ ] Home e2e uses mocked Flickr data.

---

## Phase 6: Gallery Continuation Characterization

**User stories**: 36, 37, 38, 39, 64, 75

### What to build

Lock infinite-scroll continuation before moving pagination logic. Page two appends, duplicate pending triggers are ignored, and partial final pages remain visible.

#### Step 6.1: Write failing test

- Infinite continuation
  - Happy path:
    - load-more trigger after page one -> requests page two
    - page two response -> appends cards without replacing page one
    - masonry/gallery flow after append -> keeps existing cards visible
  - Edge case: repeated trigger while page two pending -> sends only one page-two request
  - Edge case: partial final page -> renders exactly returned final photos
  - Edge case: after final page -> no duplicate fake final-page cards are added
- E2E continuation
  - Happy path: scroll to bottom -> page two appears
  - Edge case: repeated bottom trigger during pending request -> no duplicate page-two cards

**Run:** `rtk ./run.sh test && rtk ./run.sh e2e-tests`
**Expect:** FAIL (red)

#### Step 6.2: Implement minimal code

Add continuation tests around the current production gallery path without changing behavior yet.

#### Step 6.3: Verify test passes

**Run:** `rtk ./run.sh test && rtk ./run.sh e2e-tests`
**Expect:** PASS (green)

#### Step 6.4: Aggressive refactor

- Parameterize repeated pagination scenarios where possible.
- Remove duplicate scroll-trigger setup.
- Keep assertions centered on visible cards and request shape.

#### Step 6.5: Manual verification

1. Load Home with mocked page one.
2. Scroll to the bottom.
3. Confirm page two cards append.
4. Hold or repeat the bottom trigger while page two is pending.
5. Confirm only one page-two load occurs and final partial pages remain stable.

### Acceptance criteria

- [ ] Page two appends to page one.
- [ ] Duplicate pending loads are prevented.
- [ ] Partial final pages render correctly.
- [ ] Continuation behavior is covered by component/integration and e2e tests.

---

## Phase 7: Cache And Failed-Load Recovery

**User stories**: 40, 41, 42, 43, 50, 51

### What to build

Make cache and failed-load behavior explicit before extraction. Valid cache restores, expired cache refreshes, corrupted cache recovers, and failed loads clear pending state without new visible error UI.

#### Step 7.1: Write failing test

- Cache restore
  - Happy path: valid cache entry -> gallery restores visible photos without initial network wait
  - Edge case: expired cache entry -> cache is ignored and fresh page one is requested
  - Edge case: invalid JSON -> gallery recovers and requests fresh data
  - Edge case: incomplete cache shape -> gallery recovers and requests fresh data
- Failed load recovery
  - Unhappy path: failed request -> pending-load state clears
  - Unhappy path: failed request -> current visible skeleton/loading presentation is preserved rather than replaced by a blank gallery
  - Unhappy path: failed request -> no toast, modal, banner, alert, retry panel, or new error copy appears
  - Happy path after failure: future eligible load -> can proceed
- Cache boundary
  - Happy path: injected cache adapter writes and reads a cache entry through the public adapter contract
  - Happy path: injected cache adapter removes a cache entry through the public adapter contract
  - Edge case: invalid JSON from storage -> adapter returns recoverable empty state
  - Edge case: TTL metadata owned by the cache boundary -> expired entry is reported as expired
- Cache persistence through production path
  - Happy path: successful fresh page load -> writes a renderable snapshot/cache entry through the production-wired cache boundary

**Run:** `rtk ./run.sh test`
**Expect:** FAIL (red)

#### Step 7.2: Implement minimal code

Add behavior tests and the smallest cache/failure handling needed to make the current production path explicit and recoverable. Any cache boundary introduced in this phase must be wired into the current production gallery path in the same slice; do not leave tested-but-unwired cache code.

#### Step 7.3: Verify test passes

**Run:** `rtk ./run.sh test`
**Expect:** PASS (green)

#### Step 7.4: Aggressive refactor

- Consolidate cache fixtures local to gallery behavior tests.
- Remove ad hoc cache parsing duplication.
- Keep cache key/shape assertions out of tests unless externally visible.

#### Step 7.5: Manual verification

1. Load Home once to create cache.
2. Reload with valid cache and confirm photos restore.
3. Seed expired cache and reload; confirm fresh data loads.
4. Seed corrupted cache and reload; confirm the gallery reaches a usable state.
5. Mock a failed request; confirm no new error UI and later loading can proceed.

### Acceptance criteria

- [ ] Valid cache, expired cache, and invalid cache behavior are tested.
- [ ] Cache adapter read/write/remove, invalid JSON, and owned TTL metadata behavior are tested directly.
- [ ] Successful fresh loads persist through the production-wired cache boundary.
- [ ] Failed loads clear pending state.
- [ ] Failed loads do not introduce new visible error UI.

---

## Phase 8: Image Card Interaction Contract

**User stories**: 44, 45, 46, 47, 48, 49

### What to build

Preserve the card-level interaction contract before framework and layout changes. Cards keep skeleton transition, hover overlay, metadata, dialog open/close, fallback image, and alt behavior.

#### Step 8.1: Write failing test

- Card loading and metadata
  - Happy path: image not loaded -> skeleton presentation visible
  - Happy path: image load event -> card switches to loaded image presentation
  - Happy path: loaded card -> title, date, and views render
  - Happy path: image -> accessible text expectation is present
  - Edge case: displayed image failure -> fallback image URL is used
- Card interaction
  - Happy path: hover -> overlay behavior and metadata remain visible as expected
  - Happy path: click loaded card -> dialog opens with selected image/details
  - Happy path: close dialog -> gallery remains usable
  - Edge case: modal image failure -> fallback behavior remains intact
- Playwright dialog flow
  - Happy path: click a loaded image -> dialog opens, close action returns to a usable gallery
- Playwright fallback flow
  - Edge case: mocked displayed-image request failure -> browser flow switches the displayed image source to the fixture fallback URL

**Run:** `rtk ./run.sh test && rtk ./run.sh e2e-tests`
**Expect:** FAIL (red)

#### Step 8.2: Implement minimal code

Add component and e2e coverage around the existing image-card behavior without redesigning card UI.

#### Step 8.3: Verify test passes

**Run:** `rtk ./run.sh test && rtk ./run.sh e2e-tests`
**Expect:** PASS (green)

#### Step 8.4: Aggressive refactor

- Remove empty handlers only after tests are green.
- Remove unused card state only when it has no behavior.
- Consolidate repeated card fixtures.

#### Step 8.5: Manual verification

1. Open Home with loaded cards.
2. Hover a card and confirm overlay/metadata behavior.
3. Click a card and confirm the dialog opens.
4. Close the dialog and continue scrolling.
5. Force an image failure and confirm fallback behavior.

### Acceptance criteria

- [ ] Card skeleton, metadata, hover, dialog, fallback, and alt behavior are covered.
- [ ] No card UX redesign occurs.
- [ ] Gallery remains usable after dialog close.

---

## Phase 9: Native Fetch Flickr Client

**User stories**: 24, 25, 26, 27, 73

### What to build

Replace Axios with a production-used native-fetch client while preserving the exact Flickr API contract and current gallery behavior.

#### Step 9.1: Write failing test

- Flickr request contract
  - Happy path:
    - page and limit input -> request uses `/photos/{photoset}?page={page}&limit={limit}`
    - configured photoset -> appears in the path
    - successful JSON response -> returns the same data shape expected by the gallery
  - Edge case: non-OK HTTP status -> propagates failure to caller
  - Edge case: invalid JSON -> propagates failure to caller
  - Edge case: missing fetch dependency -> fails clearly in construction or setup
- Gallery integration
  - Happy path: native-fetch client wired into Home -> first page renders same visible cards
  - Unhappy path: failed fetch -> no new visible error UI

**Run:** `rtk ./run.sh test && rtk ./run.sh e2e-tests`
**Expect:** FAIL (red)

#### Step 9.2: Implement minimal code

Introduce the native-fetch client boundary with injected fetch/config and wire it into the live gallery path. Remove Axios only after the production path no longer uses it.

#### Step 9.3: Verify test passes

**Run:** `rtk ./run.sh test && rtk ./run.sh e2e-tests && rtk ./run.sh build`
**Expect:** PASS (green)

#### Step 9.4: Aggressive refactor

- Remove Axios-specific assumptions.
- Remove the old TypeScript service surface once replaced.
- Keep JSDoc contracts concise and behavior-oriented.

#### Step 9.5: Manual verification

1. Load Home with mocked Flickr responses.
2. Confirm the first page and page two render.
3. Inspect the mocked request path and query params.
4. Confirm failed mocked requests do not add new error UI.

### Acceptance criteria

- [ ] Native fetch is used for the production Flickr client.
- [ ] The external Flickr request contract is unchanged.
- [ ] Flickr client public contracts are documented with lightweight JSDoc.
- [ ] Axios is no longer required by the production path.
- [ ] Gallery behavior remains unchanged.

---

## Phase 10: Deep Gallery Service

**User stories**: 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 50, 51, 52, 62, 63

### What to build

Move gallery behavior into a DOM-free deep service under the service layer. The live gallery consumes renderable snapshots while visitor behavior remains unchanged.

#### Step 10.1: Write failing test

- Gallery snapshot service
  - Happy path:
    - initial restore with no cache -> returns renderable loading/skeleton snapshot
    - first page load -> returns renderable photo snapshot
    - raw Flickr page data -> normalizes to renderable card fields, including title, date, views, image source, alt text, and fallback-relevant image data
    - next page load -> appends photos to existing snapshot
    - valid cache restore -> returns cached photo snapshot
  - Edge case: expired cache -> requests fresh data
  - Edge case: invalid cache -> recovers and requests fresh data
  - Edge case: repeated load while pending -> returns unchanged or guarded snapshot with no duplicate request
  - Edge case: partial final page -> includes all returned photos and marks no further eligible load
  - Unhappy path: request failure -> clears pending state and preserves current visible failed-load presentation
- Dependency injection
  - Happy path: injected cache -> controls persistence in tests
  - Happy path: injected clock -> controls TTL in tests
  - Happy path: injected placeholder/random provider -> deterministic skeletons
  - Happy path: injected Flickr client -> no live network dependency
  - Happy path: injected page-size config -> controls request limit and page sizing behavior
  - Happy path: injected cache-TTL config -> controls cache expiry behavior without hardcoded timing
- Coverage reporting
  - Happy path: service behavior tests run with coverage enabled
  - Edge case: missing service behavior is covered by behavior tests, not tests for coverage tooling

**Run:** `rtk ./run.sh test`
**Expect:** FAIL (red)

#### Step 10.2: Implement minimal code

Create the deep gallery service with injected boundaries and wire the live Home gallery to consume its renderable snapshot. Keep all previously characterized UI flows green.

#### Step 10.3: Verify test passes

**Run:** `rtk ./run.sh test && rtk ./run.sh e2e-tests`
**Expect:** PASS (green)

#### Step 10.4: Aggressive refactor

- Remove duplicated pagination/cache logic from the component.
- Reduce service interface to the smallest behavior-level surface.
- Consolidate local service fixtures.
- Remove temporary adapter code that is no longer production-used.

#### Step 10.5: Manual verification

1. Load Home from empty state.
2. Scroll to load more.
3. Reload with valid cache.
4. Try expired and corrupted cache.
5. Mock a failed request.
6. Run Browser visual checks for Home desktop, Home mobile, and Home after page-two append.
7. Confirm all visible behavior matches the earlier characterized flows.

### Acceptance criteria

- [ ] `gallery-service` owns gallery behavior and is DOM-free.
- [ ] Dependencies are injected for storage, time, placeholders, and API access.
- [ ] Page size and cache TTL are injected through configuration, not hardcoded.
- [ ] Gallery snapshot, cache entry, and page-result public contracts are documented with lightweight JSDoc.
- [ ] The live Home route uses the service.
- [ ] Browser visual checks pass for Home desktop, Home mobile, and append flow after service wiring.
- [ ] Behavior tests run with coverage enabled.

---

## Phase 11: Observer Boundary

**User stories**: 36, 37, 51, 52, 53, 54

### What to build

Replace global scroll orchestration with a native `IntersectionObserver` boundary. The user still experiences infinite scroll near the bottom of the gallery.

#### Step 11.1: Write failing test

- Observer behavior
  - Happy path: observed sentinel intersects -> load-more behavior is requested
  - Edge case: sentinel does not intersect -> no load is requested
  - Edge case: repeated intersect while service says load is pending -> no duplicate load
  - Happy path: component unmount -> observer disconnects
  - Edge case: navigate away and back -> one active observer controls the current gallery
- UI integration
  - Happy path: scrolling to bottom in e2e -> next page appends
  - Edge case: About navigation after Home -> no stale load trigger appears

**Run:** `rtk ./run.sh test && rtk ./run.sh e2e-tests`
**Expect:** FAIL (red)

#### Step 11.2: Implement minimal code

Add the injectable browser observer boundary and wire it to the production gallery sentinel and gallery service load behavior.

#### Step 11.3: Verify test passes

**Run:** `rtk ./run.sh test && rtk ./run.sh e2e-tests`
**Expect:** PASS (green)

#### Step 11.4: Aggressive refactor

- Remove global scroll listener code.
- Remove scroll-math helpers that are no longer production-used.
- Keep observer setup isolated from gallery behavior logic.

#### Step 11.5: Manual verification

1. Open Home.
2. Scroll to the bottom and confirm more photos load.
3. Navigate to About and back.
4. Scroll again and confirm loading still works once, without duplicated behavior.
5. Run Browser visual checks for Home desktop, Home mobile, and Home after append with the observer boundary active.

### Acceptance criteria

- [ ] Infinite scroll uses the observer boundary.
- [ ] Observer cleanup is tested.
- [ ] Existing continuation tests and e2e flows remain green with no duplicate loads.
- [ ] Route changes leave no stale observer that can trigger future loads.
- [ ] Browser visual checks pass for Home desktop, Home mobile, and append flow after observer wiring.

---

## Phase 12: CSS Masonry Layout Boundary

**User stories**: 55, 56, 57, 58, 75

### What to build

Replace the current masonry implementation with CSS-only masonry behind a local layout boundary. Do not add any masonry package, including an exact-pinned package alternative; the CSS replacement must stay as close to current behavior as possible without a major UX change.

#### Phase 12 precondition: Capture pre-replacement Browser baseline

Before writing the red checks or changing masonry, capture Browser baselines for Home desktop, Home mobile, and Home after page-two append while the current masonry path is still active. Record viewport sizes, rendered card count, horizontal-overflow result, approximate column/card density, appended-page visibility, and a note of current spacing/card-size rhythm.

#### Step 12.1: Write failing behavior tests and command checks

- Rendered CSS masonry behavior
  - Happy path: initial gallery -> cards render in a multi-column visual flow matching the recorded baseline criteria
  - Edge case: page two append -> existing cards remain visible and new cards enter the masonry flow
  - Edge case: mobile viewport -> layout remains usable and not horizontally broken
  - Edge case: desktop viewport -> layout has no horizontal overflow and renders the expected card count
- Declarative layout boundary contract
  - Happy path: gallery renders through the public layout container contract used by CSS masonry
  - Happy path: appended cards enter the same public layout contract
  - Edge case: missing layout contract -> rendered gallery behavior test fails
- Repository command checks (`run.sh check`, not tests)
  - Happy path: no masonry package dependency of any kind is added
  - Happy path: no imperative JavaScript layout-control path remains attached to masonry behavior
  - Edge case: abandoned current implementation remains -> check fails
  - Edge case: imperative JavaScript masonry layout control remains -> check fails

**Run:** `rtk ./run.sh check && rtk ./run.sh test && rtk ./run.sh e2e-tests`
**Expect:** FAIL (red)

#### Step 12.2: Implement minimal code

Introduce the layout boundary, remove the old abandoned masonry path from the final production path, and implement the replacement with CSS-only masonry.

#### Step 12.3: Verify test passes

**Run:** `rtk ./run.sh check && rtk ./run.sh test && rtk ./run.sh e2e-tests && rtk ./run.sh build`
**Expect:** PASS (green)

#### Step 12.4: Aggressive refactor

- Remove old masonry directives/plugin registration if unused.
- Remove obsolete imperative layout-control calls.
- Remove duplicate gallery spacing styles.
- Keep only one canonical layout strategy.

#### Step 12.5: Manual verification

1. After CSS masonry replacement, capture the same Browser views as the Phase 12 precondition.
2. Compare viewport sizes, expected card count, absence of horizontal overflow, preservation of already loaded cards after append, appended-page visibility, approximate column/card density, and card spacing/size rhythm.
3. Require explicit reviewer acceptance for any visible spacing, density, or card-size difference from the baseline.
4. Iterate on the CSS strategy if the comparison shows an unaccepted regression in spacing, density, card sizing, loaded-card visibility, or append behavior.

### Acceptance criteria

- [ ] The abandoned current masonry implementation is not the final production path.
- [ ] CSS-only masonry is the final production path.
- [ ] No masonry replacement package of any kind is added, including exact-pinned package alternatives.
- [ ] Browser before/after evidence covers desktop, mobile, and page-two append.
- [ ] Home desktop/mobile visual checks pass with no major UX change, expected card counts, no horizontal overflow, and preserved loaded-card visibility.

---

## Phase 13: Framework And JavaScript Modernization

**User stories**: 20, 22, 23, 28, 29, 30, 31, 58, 59, 60, 61

### What to build

Modernize Vite, Vue, router, Vuetify, lint, and JavaScript tooling behind the locked behavior tests. Remove `core-js`, TypeScript residue, and legacy assumptions.

#### Step 13.1: Write failing behavior tests and command checks

- Framework parity
  - Happy path: Home route -> renders after dependency upgrades
  - Happy path: About route -> renders after dependency upgrades
  - Happy path: image dialog -> opens and closes after dependency upgrades
  - Happy path: build preview -> `/` and direct `/about` work
  - Edge case: root base -> assets resolve at `/`
- Repository modernization checks (`run.sh check`, not tests)
  - Happy path: direct dependency targets, removals, and additions match the verified target table in the spec
  - Happy path: public data contracts -> documented with JSDoc
  - Edge case: TypeScript source/config residue in active runtime path -> check fails
  - Edge case: `core-js` remains as a direct dependency -> check fails
  - Edge case: runtime validation library is introduced -> check fails
  - Edge case: direct dependency target drifts from the spec table without planning update -> check/review fails
- Evergreen browser checks (`run.sh check`, not tests)
  - Happy path: no legacy browser build path, legacy polyfill tooling, or stale ES5 target remains active
  - Edge case: legacy browser/polyfill tooling is configured -> check fails
- Lint/format
  - Happy path: modern flat lint config -> `check` verifies without mutation
  - Happy path: fixable lint/format issue -> `format` mutates

**Run:** `rtk ./run.sh check && rtk ./run.sh test && rtk ./run.sh e2e-tests && rtk ./run.sh build && rtk npm audit --audit-level=high`
**Expect:** FAIL (red)

#### Step 13.2: Implement minimal code

Upgrade framework/tooling dependencies to the exact target table from the spec, remove legacy polyfill and TypeScript residue, add JSDoc contracts, and preserve all existing route/gallery/card behavior.

#### Step 13.3: Verify test passes

**Run:** `rtk ./run.sh check && rtk ./run.sh test && rtk ./run.sh e2e-tests && rtk ./run.sh build && rtk npm audit --audit-level=high`
**Expect:** PASS (green)

#### Step 13.4: Aggressive refactor

- Remove obsolete resolver extensions.
- Remove unused compatibility shims.
- Remove old scaffold comments.
- Consolidate lint and format configuration.

#### Step 13.5: Manual verification

1. Run the full wrapper suite.
2. Open Home in production preview.
3. Scroll the gallery and open an image dialog.
4. Open About directly.
5. Run Browser visual checks for Home initial state, Home after infinite scroll, image dialog open/close, and About on desktop and mobile.
6. Confirm the app remains root-hosted and visually equivalent except for Phase 12 Browser-baseline-approved CSS-only masonry differences.

### Acceptance criteria

- [ ] Framework/tooling dependencies match the verified target table in the spec, including required removals and additions.
- [ ] `core-js` is removed.
- [ ] TypeScript is removed completely from active project configuration and source.
- [ ] Home, About, infinite scroll, and dialog flows remain green.
- [ ] Browser visual checks pass for Home, About, infinite scroll, and dialog flows on desktop and mobile.

## Phase 14: Repository Docs

**User stories**: 67, 68, 69

### What to build

Rewrite repository operator documentation to match the renovated app and validation model. Only `README.md` and `docs/PROJECT.md` are planned documentation targets.

#### Step 14.1: Establish documentation verification

- Markdown/format validation
  - Happy path: README and project docs pass non-mutating markdown/format checks through `run.sh check`
  - Edge case: markdown/format issue -> `check` fails without rewriting files
- Manual documentation review checklist
  - README explains what the app is
  - README lists the real local commands through `run.sh`
  - README explains test, e2e, check, format, build, and deployment expectations
  - project overview lists the renovated architecture and durable service boundaries
  - docs mention the external Flickr service without claiming backend ownership
  - docs do not reference removed commands or imply TypeScript/runtime validation/polyfills are active
  - process docs outside approved scope are not changed without need

**Run:** `rtk ./run.sh check`
**Expect:** PASS or FAIL based only on markdown/format validation, not custom documentation content assertions. Manual review remains open until the docs are updated.

#### Step 14.2: Implement minimal code

Rewrite `README.md` concisely and update `docs/PROJECT.md` to reflect the final architecture, commands, dependency policy, and deployment model.

#### Step 14.3: Verify test passes

**Run:** `rtk ./run.sh check`
**Expect:** PASS (green markdown/format validation, followed by completed manual documentation review)

#### Step 14.4: Aggressive refactor

- Remove scaffold README text.
- Remove duplicated documentation between README and project overview.
- Keep only operationally useful documentation.

#### Step 14.5: Manual verification

1. Read the README as a new maintainer.
2. Follow the listed setup and validation commands.
3. Confirm `docs/PROJECT.md` matches the implementation.
4. Confirm no About/portfolio user-facing copy was rewritten.

### Acceptance criteria

- [ ] README is concise and complete.
- [ ] `docs/PROJECT.md` reflects the renovated repository.
- [ ] Other process docs are not changed except tiny unavoidable corrections.

---

## Phase 15: Final Cleanup And Parity Closure

**User stories**: 70, 72, 73, 74, 75

### What to build

After behavior parity is green, remove everything unused: handlers, stale comments, duplicate styles, scaffold residue, stale config, dead dependencies, and migration leftovers.

#### Step 15.1: Establish cleanup verification baseline

- Cleanup verification
  - Happy path: existing behavior tests remain green after deletions
  - Happy path: dependency audit remains clear at high severity
  - Happy path: Home visual checks pass on desktop and mobile
  - Happy path: About visual checks pass on desktop and mobile
  - Happy path: image dialog still opens/closes
  - Happy path: infinite scroll still appends
  - Edge case: cleanup removes production-used behavior -> existing tests fail
  - Edge case: cleanup leaves unused dependency/config -> check or review fails

**Run:** No new cleanup-only tests. Run the existing full validation suite before cleanup to establish the green baseline, then run it again after cleanup deletions.
**Expect:** PASS before cleanup; PASS again after cleanup. Any failure means cleanup broke existing behavior or left configured checks failing.

#### Step 15.2: Implement minimal code

Delete unused artifacts only after all replacement paths are production-used and tested. Do not add new behavior.

#### Step 15.3: Verify test passes

**Run:** `rtk npm ci && rtk ./run.sh format && rtk ./run.sh check && rtk ./run.sh test && rtk ./run.sh e2e-tests && rtk ./run.sh build && rtk npm audit signatures --min-release-age=0 && rtk npm audit --audit-level=high`
**Expect:** PASS (green)

#### Step 15.4: Aggressive refactor

- Remove unused handlers and state.
- Remove duplicate style declarations.
- Remove obsolete comments and scaffold residue.
- Remove stale config and dependency remnants.
- Prefer deleting over adding.
- Rerun the full Phase 15 verification command after cleanup deletions.

#### Step 15.5: Manual verification

1. Open Home on desktop and mobile.
2. Confirm skeletons, loaded cards, infinite scroll, and masonry behavior remain equivalent to the Phase 12 accepted CSS-only behavior with no major UX change.
3. Open and close an image dialog.
4. Open About on desktop and mobile.
5. Confirm branch protection evidence exists or approved deferral is documented.

### Acceptance criteria

- [ ] Full local validation evidence is green.
- [ ] Browser visual checks pass for Home and About on desktop and mobile.
- [ ] No backend/API/secrets scope changed.
- [ ] Unused code, config, styles, comments, and dead dependencies are removed.

<!-- Repeat for each phase -->
