# Release checklist (production)

## CI checks (run locally to match GitHub Actions)

| Job               | Command(s) |
|-------------------|------------|
| **build-library** | `yarn lint` → `yarn typecheck` → `yarn test --runInBand` → `yarn prepare` |
| **build-android** | `yarn turbo run build:android` |
| **build-ios**     | `yarn turbo run build:ios` |

One-liner for full library check:  
`yarn lint && yarn typecheck && yarn test --runInBand && yarn prepare`

Optional coverage report:  
`yarn test --runInBand --coverage`

---

Before cutting a new version or publishing to npm:

- [ ] **Quality**
  - [ ] `yarn lint` passes
  - [ ] `yarn typecheck` passes
  - [ ] `yarn test --runInBand` passes (optionally with `--coverage` to enforce thresholds)
  - [ ] No uncommitted changes or fix them
- [ ] **Build**
  - [ ] `yarn prepare` (bob build) succeeds
  - [ ] Example app builds: `yarn turbo run build:android` / `build:ios` (if available)
- [ ] **Package**
  - [ ] Optional: `npm pack` — inspect the generated `.tgz` to confirm published files are correct
- [ ] **Version & publish**
  - [ ] Bump version: manual version in `package.json` (or `yarn release` if release-it is configured)
  - [ ] Changelog updated (if using release-it with conventional-changelog)
  - [ ] `yarn npm publish` (or `npm publish`) — `prepare` runs `bob build` before publish

**Note:** Dependency audit warnings (e.g. minimatch, glob in devDependencies) are known; they affect tooling only and are addressed when upstream (React Native, ESLint, Jest) update. Production runtime code has no known vulnerabilities.

---

## Release readiness checklist

Before tagging or publishing, ensure:

- [ ] **Architecture & code** — `src/` has clear separation (`core/`, `native/`, `hooks/`, barrel `index.ts`); no debug code or TODOs in lib or native code.
- [ ] **Build & package** — `yarn prepare` produces `lib/commonjs`, `lib/module`, `lib/typescript`; `package.json` has correct `main`, `module`, `types`, `exports`, `sideEffects`, `engines`.
- [ ] **Quality** — `yarn lint`, `yarn typecheck`, `yarn test --runInBand` (and optionally `--coverage`) pass.
- [ ] **CI** — GitHub Actions run lint, typecheck, test, and build on push/PR; release workflow uses `NPM_TOKEN` and `GITHUB_TOKEN` for publish.
- [ ] **Docs** — README has Quick Start, Supported versions table, and API reference; RELEASE_CHECKLIST matches CI steps.
- [ ] **Manual** — Example app builds (Android/iOS); OTP flow tested on device or emulator when possible.

Raise Jest `coverageThreshold` in `jest.config.js` as you add tests for `useOtpVerification`, `activateOtpListener`, and native bridge paths.
