# Release checklist (production)

## CI checks (run locally to match GitHub Actions)

| Job             | Command(s) |
|-----------------|------------|
| **build-library** | `yarn typecheck` then `yarn prepare` |
| **test**        | `yarn test --maxWorkers=2` |
| **lint**        | `yarn lint` |
| **build-android** | `yarn turbo run build:android` |
| **build-ios**   | `yarn turbo run build:ios` |

One-liner for typecheck + lint + test + library build: `yarn typecheck && yarn lint && yarn test --maxWorkers=2 && yarn prepare`

---

Before cutting a new version or publishing to npm:

- [ ] **Quality**
  - [ ] `yarn typecheck` passes
  - [ ] `yarn lint` passes
  - [ ] `yarn test --maxWorkers=2` passes
  - [ ] No uncommitted changes or fix them
- [ ] **Build**
  - [ ] `yarn prepare` (bob build) succeeds
  - [ ] Example app builds: `yarn turbo run build:android` / `build:ios` (if available)
- [ ] **Package**
  - [ ] Optional: `npm pack` — inspect the generated `.tgz` to confirm published files are correct
- [ ] **Version & publish**
  - [ ] Bump version: manual version in `package.json` (or `yarn release` if release-it is configured)
  - [ ] Changelog updated (if using release-it with conventional-changelog)
  - [ ] `yarn npm publish` (or `npm publish`) — `prepublishOnly` runs `bob build` first

**Note:** Dependency audit warnings (e.g. minimatch, glob in devDependencies) are known; they affect tooling only and are addressed when upstream (React Native, ESLint, Jest) update. Production runtime code has no known vulnerabilities.
