# Professional Audit Report: react-native-otp-auto-verify

**Auditor role:** Senior JavaScript/TypeScript library architect, open-source maintainer, security auditor  
**Date:** 2026  
**Scope:** Architecture, /lib build, ESM/CJS, security, performance, TypeScript, package health, CI/CD, testing, documentation  
**Ecosystem target:** Node 18+, 2026 standards, production-grade npm library

---

## 1. Critical Issues

### None identified

- No unsafe dynamic execution (`eval`, `new Function`, dynamic `import()` with user input).
- No prototype pollution or unsafe object merging in library code.
- No runtime dependency vulnerabilities in the published dependency graph (only peer + dev deps).
- Package entry points and `exports` are correctly set for ESM/CJS.

---

## 2. High Issues

### 2.1 CI setup action: cache/save key is invalid (broken cache save)

**Where:** `.github/actions/setup/action.yml`  
**Issue:** The “Cache dependencies” step uses `key: ${{ steps.yarn-cache.outputs.cache-primary-key }}`. The `actions/cache/restore` step does **not** output `cache-primary-key` (that was v2). So the save step runs with an empty key and does not reliably save the cache.

**Fix:** Use the same key expression for both restore and save (see “Improved CI Workflow Example” below).

---

### 2.2 Internal constant re-exported in public API

**Where:** `src/index.ts` exports `DEFAULT_DIGITS` from core; `src/native/bridge.ts` also re-exports `DEFAULT_DIGITS`.  
**Issue:** `DEFAULT_DIGITS` is an implementation detail (default for OTP length). Exporting it expands the public API surface and commits to it semantically. Prefer a single, intentional public API.

**Recommendation:** Export only from the barrel for a single source of truth, and consider not exporting `DEFAULT_DIGITS` at all unless you document it as a supported constant. If kept, export only from `src/index.ts` (from core); remove the re-export from `bridge.ts` (bridge should only use it internally).

---

### 2.3 Release workflow can run publish without NPM_TOKEN

**Where:** `.github/workflows/release.yml`  
**Issue:** On tag push or manual dispatch, the workflow runs `npx release-it --ci` with `NPM_TOKEN`. If `NPM_TOKEN` is not set, release-it may fail late or behave unexpectedly. There is no explicit guard to fail fast with a clear message.

**Fix:** Add a step that checks for `secrets.NPM_TOKEN` (or `env.NPM_TOKEN`) and fails the job with a clear error if missing when the event is a release (e.g. tag push). See “Improved CI Workflow Example” below.

---

## 3. Medium Issues

### 3.1 TypeScript: missing options for stricter and build-safe output

**Where:** `tsconfig.json` / `tsconfig.build.json`  
**Issue:**  
- `rootDir: "."` can pull in files outside `src` if not careful.  
- No `exactOptionalPropertyTypes` (stricter optional properties).  
- No `isolatedModules` (recommended when emitting for bundlers/Babel).  
- Build config extends root but doesn’t set `noEmit: false` or `declaration: true` (Bob uses its own emit; still good to document intent).

**Fix:** See “Improved tsconfig.json” below.

---

### 3.2 `files` includes `src` — larger and noisier package

**Where:** `package.json` → `"files": ["src", "lib", ...]`  
**Issue:** Shipping `src` increases tarball size and exposes full source. Many libraries ship only `lib` (+ native dirs, configs) so consumers use compiled output only. React Native libraries sometimes keep `src` for debugging or tooling; if you don’t need it, dropping it is cleaner.

**Recommendation:** For a “lib-only” publish, remove `"src"` from `files` and rely on `lib` and types. If you intentionally ship source for RN tooling, document that and keep it; otherwise remove it.

---

### 3.3 CI: no explicit coverage upload or enforcement

**Where:** `.github/workflows/ci.yml`  
**Issue:** Jest is run with `--runInBand` but there is no `--coverage` and no upload of coverage (e.g. to Codecov/Coveralls). Coverage thresholds in `jest.config.js` are low (23–38%); they pass but don’t enforce a quality bar.

**Recommendation:** Add a “Test with coverage” step that runs `yarn test --runInBand --coverage` and, optionally, uploads the report. Gradually raise `coverageThreshold` as you add tests for the hook and native bridge.

---

### 3.4 Spec type vs native: `removeListeners(count: number)` vs Double

**Where:** `src/NativeOtpAutoVerify.ts` → `removeListeners(count: number)`; Android Kotlin uses `Double`.  
**Issue:** Minor type asymmetry; React Native codegen often uses number. Not a runtime bug but worth aligning for clarity.

**Recommendation:** Keep `number` in the Spec; document that the native side may receive it as Double. No code change required unless you introduce a dedicated codegen type.

---

## 4. Low Issues

### 4.1 README: no ESM vs CJS usage examples

**Where:** `README.md`  
**Issue:** Installation and usage show only ESM-style `import`. Consumers using CJS or older bundlers may want a `require()` example.

**Fix:** Add a short “ESM and CJS” subsection with:

```ts
// ESM
import { useOtpVerification } from 'react-native-otp-auto-verify';

// CJS
const { useOtpVerification } = require('react-native-otp-auto-verify');
```

---

### 4.2 Redundant re-export of DEFAULT_DIGITS from bridge

**Where:** `src/native/bridge.ts`  
**Issue:** `export { DEFAULT_DIGITS } from '../core/extractOtp'` is redundant for the public API because `src/index.ts` already exports from `./core/extractOtp`. The bridge only needs to import it for internal use.

**Fix:** Remove the `export { DEFAULT_DIGITS }` line from `bridge.ts`; keep the import and use of `DEFAULT_DIGITS` inside the file.

---

### 4.3 Regex in extractOtp: ReDoS assessment

**Where:** `src/core/extractOtp.ts` — `/\b(\d{4})\b/`, etc.  
**Assessment:** Fixed character classes and bounded `\d{4}`; no user-controlled pattern; input is trimmed and length-limited by SMS. **ReDoS risk: very low.** No change required.

---

## 5. Refactored Code Examples

### 5.1 Remove redundant DEFAULT_DIGITS export from bridge

**File:** `src/native/bridge.ts`

```diff
- export { DEFAULT_DIGITS } from '../core/extractOtp';
-
  export interface OtpListenerSubscription {
```

Keep the import: `import { extractOtp, DEFAULT_DIGITS, type OtpDigits } from '../core/extractOtp';`.

---

### 5.2 index.ts: single source for public constants (optional)

If you decide **not** to expose `DEFAULT_DIGITS` as part of the public API:

**File:** `src/index.ts`

```ts
export {
  extractOtp,
  type OtpDigits,
  // DEFAULT_DIGITS only if you want it as a documented constant
} from './core/extractOtp';
```

Otherwise keep current export; just ensure it’s only exported once (from index from core).

---

## 6. Improved Folder Architecture Blueprint

Current layout is already good; below is a tightened blueprint that matches current structure and best practice.

```
package/
├── src/
│   ├── index.ts              # Single public entry; re-exports only intended API
│   ├── core/
│   │   └── extractOtp.ts     # Pure logic; no RN dependency
│   ├── native/
│   │   └── bridge.ts         # RN-native bridge (getHash, activateOtpListener, removeListener)
│   ├── hooks/
│   │   └── useOtpVerification.ts
│   ├── NativeOtpAutoVerify.ts  # TurboModule spec (codegen); keep at root if required by codegen
│   └── __tests__/
├── lib/                      # Build output only (generated)
│   ├── commonjs/
│   ├── module/
│   └── typescript/
├── android/                  # Native (include in files)
├── ios/
├── package.json
├── tsconfig.json
├── tsconfig.build.json
└── jest.config.js
```

**Principles:**

- Single entry: `src/index.ts` re-exports only the public API; internal modules are not directly importable by consumers (they get them via the barrel).
- Separation: core (pure), native (bridge), hooks (React).
- `lib` is the only compiled output; no test or dev artifacts in `lib`.
- Do not export internal paths in `package.json` `exports`; only the root entry.

---

## 7. Corrected package.json Template

Below are the fields that matter for a production, ESM+CJS, tree-shakeable React Native library. Keep your existing `name`, `version`, `description`, `keywords`, `license`, `repository`, `bugs`, `homepage`, `author`, `scripts`, `devDependencies`, `peerDependencies`, `react-native-builder-bob`, `codegenConfig`, and tooling configs; adjust as follows.

**Entries and exports:**

```jsonc
{
  "main": "./lib/commonjs/index.js",
  "module": "./lib/module/index.js",
  "types": "./lib/typescript/src/index.d.ts",
  "react-native": "./lib/module/index.js",
  "sideEffects": false,
  "engines": { "node": ">=18" },
  "files": [
    "lib",
    "android",
    "ios",
    "cpp",
    "*.podspec",
    "react-native.config.js",
    "!ios/build",
    "!android/build",
    "!android/gradle",
    "!android/gradlew",
    "!android/gradlew.bat",
    "!android/local.properties",
    "!**/__tests__",
    "!**/__fixtures__",
    "!**/__mocks__",
    "!**/.*"
  ],
  "exports": {
    ".": {
      "types": "./lib/typescript/src/index.d.ts",
      "react-native": "./lib/module/index.js",
      "import": "./lib/module/index.js",
      "require": "./lib/commonjs/index.js"
    }
  }
}
```

**Note:** Removed `"src"` from `files` so only `lib` and native/config are published. Add `"src"` back if you intentionally ship source.

---

## 8. Improved tsconfig.json

**Root config (development and type-checking):**

```json
{
  "compilerOptions": {
    "rootDir": ".",
    "rootDirs": ["src"],
    "paths": { "react-native-otp-auto-verify": ["./src/index"] },
    "allowUnreachableCode": false,
    "allowUnusedLabels": false,
    "customConditions": ["react-native-strict-api"],
    "esModuleInterop": true,
    "exactOptionalPropertyTypes": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "lib": ["ESNext"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "noEmit": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,
    "noImplicitUseStrict": false,
    "noStrictGenericChecks": false,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "strict": true,
    "target": "ESNext",
    "verbatimModuleSyntax": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "lib", "example"]
}
```

**Changes:**  
- `exactOptionalPropertyTypes: true` for stricter optionals.  
- `isolatedModules: true` for safe bundler/Babel emit.  
- `include: ["src"]`, `exclude` to avoid pulling in `lib`/example.  
- `rootDirs: ["src"]` optional; keeps resolution under `src`.

**Build config** (`tsconfig.build.json`): keep extending root and excluding `example` and `lib`; Bob controls emit.

---

## 9. Improved CI Workflow Example

### 9.1 Fix setup action cache key

**File:** `.github/actions/setup/action.yml`

Use the same key for both restore and save. Example:

```yaml
    - name: Restore dependencies
      id: yarn-cache
      uses: actions/cache/restore@v4
      with:
        path: |
          **/node_modules
          .yarn/install-state.gz
        key: ${{ runner.os }}-yarn-${{ hashFiles('yarn.lock') }}-${{ hashFiles('**/package.json', '!node_modules/**') }}
        restore-keys: |
          ${{ runner.os }}-yarn-${{ hashFiles('yarn.lock') }}
          ${{ runner.os }}-yarn-

    - name: Install dependencies
      if: steps.yarn-cache.outputs.cache-hit != 'true'
      run: yarn install --immutable
      shell: bash

    - name: Cache dependencies
      if: steps.yarn-cache.outputs.cache-hit != 'true'
      uses: actions/cache/save@v4
      with:
        path: |
          **/node_modules
          .yarn/install-state.gz
        key: ${{ runner.os }}-yarn-${{ hashFiles('yarn.lock') }}-${{ hashFiles('**/package.json', '!node_modules/**') }}
```

So “Cache dependencies” uses the same `key` expression as “Restore dependencies”, not `cache-primary-key`.

### 9.2 Release workflow: guard NPM_TOKEN

**File:** `.github/workflows/release.yml`

Add a step before “Release” that fails the job when publishing is intended but `NPM_TOKEN` is missing:

```yaml
      - name: Ensure NPM_TOKEN for publish
        if: github.event_name == 'push' && startsWith(github.ref, 'refs/tags/')
        run: |
          if [ -z "${{ secrets.NPM_TOKEN }}" ]; then
            echo "::error::NPM_TOKEN is required to publish from tag push."
            exit 1
          fi

      - name: Release
        run: npx release-it --ci
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## 10. Final Release Readiness Checklist

- [ ] **Architecture**  
  - [ ] Single entry point `src/index.ts`; no internal-only paths in `exports`.  
  - [ ] Clear split: core / native / hooks; no unintended re-exports (e.g. remove redundant `DEFAULT_DIGITS` from bridge if desired).

- [ ] **Build & /lib**  
  - [ ] `yarn prepare` produces `lib/commonjs`, `lib/module`, `lib/typescript`.  
  - [ ] No tests, fixtures, or `.ts` source in `lib`; only compiled JS and `.d.ts`.  
  - [ ] `main` (CJS), `module` (ESM), `types`, `react-native`, `exports` match the template above.  
  - [ ] `files` includes only what you intend to publish (e.g. `lib` + native + configs; drop `src` unless needed).  
  - [ ] `sideEffects: false`; `engines.node": ">=18"`.

- [ ] **Security**  
  - [ ] No `eval`/`Function`/unsafe dynamic import.  
  - [ ] No prototype pollution or unsafe merge in library code.  
  - [ ] Input validation in place for `extractOtp` (string, length); ReDoS risk for fixed regexes is low.  
  - [ ] `npm audit` (or equivalent) reviewed for dev deps; no known high/critical in runtime path.

- [ ] **TypeScript**  
  - [ ] `strict: true`; consider `exactOptionalPropertyTypes` and `isolatedModules`.  
  - [ ] No `any` in public API; Spec and hook types are explicit.

- [ ] **CI/CD**  
  - [ ] Install uses frozen lockfile (`yarn install --immutable`).  
  - [ ] Pipeline: lint → typecheck → test (e.g. `--runInBand`) → build.  
  - [ ] Setup action cache: same key for restore and save (no `cache-primary-key`).  
  - [ ] Release workflow: run only on tag push / manual dispatch; guard on `NPM_TOKEN` when publishing.

- [ ] **Testing**  
  - [ ] Unit tests for `extractOtp`, `getHash`, `removeListener`, and that `useOtpVerification` is callable.  
  - [ ] Coverage collected; thresholds set and gradually increased (e.g. 70%+ for core and bridge).

- [ ] **Documentation**  
  - [ ] README: installation, Quick Start, supported versions, ESM/CJS examples, API reference, troubleshooting.  
  - [ ] RELEASE_CHECKLIST aligned with CI steps and release workflow.

- [ ] **Publish**  
  - [ ] Version bumped (e.g. release-it or manual).  
  - [ ] `npm pack` inspected; only `files` entries in tarball.  
  - [ ] Changelog updated; then publish.

---

*End of audit report.*
