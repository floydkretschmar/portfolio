# Repository Renovation

## Summary

Renovated the Vue/Vite portfolio repository while preserving the gallery and About page behavior. The branch replaced stale gallery infrastructure, moved gallery state into a DOM-free service, modernized dependencies and CI, aligned Dependabot automerge with the Flickr service structure, and removed unused code after behavior parity was proven.

## Key Decisions

- Behavior-first testing: Tests validate public behavior and observable outcomes; coverage remains enabled, but tests do not validate coverage mechanics, policy, dependency state, or architecture constraints.
- Gallery service ownership: `gallery-service` owns snapshots, pagination, cache restore, placeholder generation, duplicate-load prevention, failed-load recovery, and final-page handling.
- Native boundaries: Flickr access uses native `fetch`, infinite scroll uses an injectable `IntersectionObserver` boundary, and cache behavior is isolated behind `session-cache`.
- CSS-only masonry: The abandoned masonry dependency was replaced with a local CSS-column layout boundary without adding a replacement package.
- Automerge alignment: Dependabot automerge keeps the Flickr service workflow structure, with only npm security patch automerge added for this repository.

## Patterns Established

- Deep behavior services: Keep stateful behavior behind small DOM-free service interfaces, as used by `src/services/gallery-service.js`.
- Boundary injection: Inject network, cache, observer, time, randomness, and configuration dependencies where deterministic behavior tests need control.
- Command wrapper behavior: `run.sh` remains the shared local and CI command entry point; wrapper tests cover command dispatch and mutation behavior.
- Cleanup after green: Remove comments, stale styles, dead dependencies, placeholder scaffolding, and unused assets only after existing behavior tests are green.

## Files

- Implementation: `src/services/gallery-service.js`, `src/services/flickr-client.js`, `src/services/session-cache.js`, `src/services/observer-boundary.js`, `src/components/home/InfiniteScrollContainer.vue`, `src/components/home/ImageCard.vue`, `src/views/Home.vue`
- Tests: `tests/run-contract.test.js`, `tests/behavior/`, `tests/e2e/`
- Config: `package.json`, `package-lock.json`, `vitest.config.js`, `playwright.config.js`, `eslint.config.js`, `.github/workflows/`, `.github/dependabot.yml`, `.npmrc`
- Docs: `README.md`, `docs/PROJECT.md`, `docs/TESTING.md`, `docs/archive/2026-06-14-repository-renovation/SPEC.md`, `docs/archive/2026-06-14-repository-renovation/SCHEME.md`

## Future Considerations

- Branch protection remains an external repository setting and should only be applied with explicit user approval.
- Keep future tests behavior-only; do not add tests for removals, coverage mechanics, policy enforcement, dependency state, file layout, or architecture constraints.
