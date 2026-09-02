# ESM Migration Guide: Monorepo Alignment

Last audited against `develop` @ `7f7584d`.

## How to read this checklist

A package is **complete** for a phase when the phase's criteria hold for its own source and
unit tests. Two categories of file are deliberately out of scope everywhere and should not
block a checkbox:

* **Build and release configuration** — `vite.config.mjs`, `rollup.config.mjs`,
  `tailwind.config.cjs`, `postcss.config.js`, `.releaserc.js`. These are consumed by tools that
  expect JS and are not part of the shipped module graph.
* **Fixtures** — anything under a `fixtures/` directory, `system-tests/projects`,
  `project-fixtures`, and generated `__snapshots__`. Several of these exist specifically to prove
  Cypress works against plain JavaScript projects.

Files that must stay JavaScript permanently are listed under [Permanent exceptions](#permanent-exceptions).

## Suggested order of work

Ordered easiest to hardest. The numbering is a difficulty ranking, not a dependency chain —
see the note after the list.

| # | Task | Phase |
|---|---|---|
| 1 | Keep this checklist current as items land | — |
| 2 | Repair the dual builds that emit nothing (see [Phase 3](#phase-3-bundle-esmcjs-versions-of-npm-packages)) | 3 |
| 3 | Finish `packages/app` and `packages/example` | 1 |
| 4 | Sweep leftover static `require()` calls in completed packages | 1 |
| 5 | Drop the `index.js` ts-node shims from `proxy`, `data-context`, `frontend-shared` | 1 |
| 6 | Convert `npm/eslint-plugin-dev` | 1 |
| 7 | Move `tooling/*` off mocha | 2 |
| 8 | Port `packages/server` snapshots off `snap-shot-it` | 2 |
| 9 | Convert the Cypress specs in `packages/driver`, `npm/react`, `npm/vue` | 1 |
| 10 | Convert `system-tests` and `scripts` | 1, 2 |
| 11 | Replace `packages/server`'s 131 `require()` calls | 1 |
| 12 | Migrate `packages/server` from mocha to vitest | 2 |
| 13 | Dual-build the CJS-only npm packages | 3 |
| 14 | Move module resolution to `node16` | 3, 4 |
| 15 | Run the server as ESM | 4 |
| 16 | Delete `@packages/ts` | 4 |

Item 14 is a one-line change to `packages/ts/tsconfig.json` with wide fallout, and it gates
item 13 outright. It is ranked late by difficulty, but it unblocks more work than anything else
on the list — worth spiking early on a branch to size the fallout, even if the easy tier is
being worked first.

Items 11 and 12 both touch `packages/server/test` heavily and will collide. Landing item 12
first means the `require()` sweep happens against vitest specs that are cheaper to re-run.

### Phase 1: Convert Packages to TypeScript

#### Criteria

- No require statements are to be used in `.ts` files
- Unit tests in package are written in TypeScript
- Does not include scripts or system test migrations

#### Notes

When migrating some of these projects away from the `ts-node` entry [see `@packages/scaffold-config` example](https://github.com/cypress-io/cypress/blob/v15.2.0/packages/scaffold-config/index.js), it is somewhat difficult to make separate browser/node entries as the v8-snapshot [tsconfig.json](https://github.com/cypress-io/cypress/blob/v15.2.0/tooling/v8-snapshot/tsconfig.json) is using an older style of module resolution where the `exports` key inside a package's `package.json` is not well supported. Because of this, we need to find ways to bundle code that is needed internally in the browser vs in node without them being a part of the same bundle. This is a temporary work around until we are able to get every package being able to build as an ES Module, which as that point we can re assess how the Cypress binary is being built as well as v8-snapshots, and will allow us to reconfigure this packages to export content in a more proper fashion. We are currently doing something similar in the following packages:

* `@packages/scaffold-config`
* `@packages/socket`
* `@packages/telemetry`

The three packages that still ship an `index.js` ts-node shim — `proxy`, `data-context` and
`frontend-shared` — should adopt that same split-tsconfig pattern. `packages/proxy` is the
smallest starting point: one file, with no build scripts hanging off it.

#### Status

##### NPM Packages

- [x] cli ✅ **COMPLETED**
- [x] npm/angular ✅ **COMPLETED**
- [x] npm/cypress-schematic ✅ **COMPLETED**
- [ ] npm/eslint-plugin-dev — 11 files under `lib/`; test fixtures stay JS
- [x] npm/grep ✅ **COMPLETED**
- [x] npm/mount-utils ✅ **COMPLETED**
- [x] npm/puppeteer ✅ **COMPLETED**
- [ ] npm/react **PARTIAL** — source complete; 120 `.jsx` component specs remain
- [x] npm/svelte ✅ **COMPLETED**
- [x] npm/vite-dev-server ✅ **COMPLETED**
- [x] npm/vite-plugin-cypress-esm ✅ **COMPLETED**
- [ ] npm/vue **PARTIAL** — source complete; 39 `.js` component specs remain
- [x] npm/webpack-batteries-included-preprocessor ✅ **COMPLETED**
- [x] npm/webpack-dev-server ✅ **COMPLETED**
- [x] npm/webpack-preprocessor ✅ **COMPLETED**

##### Binary Packages

- [x] packages/agent-info ✅ **COMPLETED**
- [ ] packages/app **PARTIAL** — only `src/components/Blank.jsx` remains, and it contains no JSX
- [x] packages/config ✅ **COMPLETED**
- [x] packages/cypress-sessions ✅ **COMPLETED**
- [ ] packages/data-context **PARTIAL** — entry point is JS (`index.js`, `scripts/build.js`); the `.jsx` files under `test/` are codegen fixtures
- [ ] packages/driver **PARTIAL** — source complete; 114 `.js` specs under `cypress/e2e` plus 5 support/plugin files
- [x] packages/electron ✅ **COMPLETED**
- [x] packages/errors ✅ **COMPLETED**
- [x] packages/eslint-config ✅ **COMPLETED**
- [ ] packages/example — 6 files, ~90 lines
- [x] packages/extension ✅ **COMPLETED**
- [ ] packages/frontend-shared **PARTIAL** — entry point is JS, plus 4 files under `script/`
- [x] packages/https-proxy ✅ **COMPLETED**
- [x] packages/icons ✅ **COMPLETED**
- [x] packages/launcher ✅ **COMPLETED**
- [x] packages/launchpad ✅ **COMPLETED**
- [x] packages/net-stubbing ✅ **COMPLETED**
- [x] packages/network ✅ **COMPLETED**
- [x] packages/network-interception ✅ **COMPLETED**
- [x] packages/network-tools ✅ **COMPLETED**
- [x] packages/packherd-require ✅ **COMPLETED**
- [ ] packages/proxy **PARTIAL** — entry point is JS (`index.js`)
- [x] packages/reporter ✅ **COMPLETED**
- [x] packages/resolve-dist ✅ **COMPLETED**
- [x] packages/root ✅ **COMPLETED**
- [ ] packages/runner **PARTIAL** — 6 files under `src/` and `injection/`, ~290 lines
- [x] packages/scaffold-config ✅ **COMPLETED**
- [ ] packages/server **PARTIAL** — highest priority. 131 `require()` calls across 70 `.ts` files (28 in `lib/`, 42 in `test/`); 6 remaining `.js` specs under `test/integration` and `test/performance`; 4 bootstrap files covered under [Permanent exceptions](#permanent-exceptions)
- [x] packages/socket ✅ **COMPLETED**
- [x] packages/stderr-filtering ✅ **COMPLETED**
- [x] packages/telemetry ✅ **COMPLETED**
- [ ] packages/ts **PARTIAL** — ultimate goal is removal; see [Phase 4](#phase-4-run-cypress-server-as-an-esm-package)
- [x] packages/types ✅ **COMPLETED**
- [x] packages/v8-snapshot-require ✅ **COMPLETED**
- [ ] packages/web-config **PARTIAL** — `node-register.js`
- [x] tooling/electron-mksnapshot ✅ **COMPLETED**
- [x] tooling/packherd ✅ **COMPLETED**
- [ ] tooling/v8-snapshot **PARTIAL** — the 4 files under `src/blueprint/` are snapshot runtime sources and stay JS

##### Not covered by the criteria above

Tracked here because the work is real even though the phase excludes it:

- [ ] system-tests — 71 `.js` specs under `test/` (78 already TS), plus 5 helpers under `lib/`
- [ ] scripts — 74 `.js` files to 23 TS

#### Leftover `require()` in completed packages

These packages pass every other criterion but still have static `require()` calls that convert
cleanly to imports: `config` (`ast-utils`), `errors` (`pluralize`), `launcher` (`test/log.ts`),
`socket` (`socket.io-client/package.json`), `electron` and `runner` (`@packages/icons`),
`reporter` (`express`).

Leave the genuinely dynamic ones alone — `scaffold-config`'s `require(modulePath)` for
third-party component-testing detection is doing real work and has no static equivalent.

### Phase 2: Convert Package tests from Mocha to Vitest

#### Notes

No package that has migrated retains `sinon`, `chai`, `proxyquire` or `mockery` — they all use
`vi.mock` / `vi.mocked` / `vi.fn`. `packages/launcher` and `packages/proxy` are the clearest
references for replacing `proxyquire`.

For snapshots, two in-repo patterns exist: `packages/config` uses named `toMatchSnapshot()`,
which maps almost one-to-one onto `snap-shot-it`'s named form, and `packages/errors` uses
`toMatchFileSnapshot()` for large golden files.

#### Status

##### NPM Packages

- [x] cli ✅ **COMPLETED**
- [x] npm/cypress-schematic ✅ **COMPLETED**
- [x] npm/eslint-plugin-dev ✅ **COMPLETED**
- [x] npm/grep ✅ **COMPLETED**
- [x] npm/puppeteer ✅ **COMPLETED**
- [x] npm/vite-dev-server ✅ **COMPLETED**
- [x] npm/webpack-batteries-included-preprocessor ✅ **COMPLETED**
- [x] npm/webpack-dev-server ✅ **COMPLETED**
- [x] npm/webpack-preprocessor ✅ **COMPLETED**
- N/A npm/angular, npm/mount-utils, npm/react, npm/svelte, npm/vite-plugin-cypress-esm, npm/vue — no unit test suite; these are covered by Cypress component tests

##### Binary Packages

- [x] packages/agent-info ✅ **COMPLETED**
- [x] packages/config ✅ **COMPLETED**
- [x] packages/cypress-sessions ✅ **COMPLETED**
- [x] packages/data-context **COMPLETED** (migrated from `mocha`/`sinon`/`chai` to `jest`). See package README for more details as to why `jest` over `vitest`
- [x] packages/driver ✅ **COMPLETED**
- [x] packages/electron ✅ **COMPLETED**
- [x] packages/errors ✅ **COMPLETED**
- [x] packages/extension ✅ **COMPLETED**
- [x] packages/https-proxy ✅ **COMPLETED**
- [x] packages/icons ✅ **COMPLETED**
- [x] packages/launcher ✅ **COMPLETED**
- [x] packages/net-stubbing ✅ **COMPLETED**
- [x] packages/network ✅ **COMPLETED**
- [x] packages/network-interception ✅ **COMPLETED**
- [x] packages/network-tools ✅ **COMPLETED**
- [x] packages/packherd-require ✅ **COMPLETED**
- [x] packages/proxy ✅ **COMPLETED**
- [x] packages/scaffold-config ✅ **COMPLETED**
- [ ] packages/server — see cost breakdown below
- [x] packages/socket ✅ **COMPLETED**
- [x] packages/stderr-filtering ✅ **COMPLETED**
- [x] packages/telemetry ✅ **COMPLETED**
- [ ] packages/ts - ultimate goal is removal and likely not worth the effort to convert
- [x] packages/types ✅ **COMPLETED**
- [x] packages/v8-snapshot-require ✅ **COMPLETED**
- [ ] tooling/electron-mksnapshot — `mocha --config ./test/.mocharc.js`
- [ ] tooling/packherd — `mocha --config ./test/.mocharc.js`
- [ ] tooling/v8-snapshot — `mocha --config ./test/.mocharc.js`; `express.spec.ts` uses `snap-shot-it`
- N/A packages/app, packages/frontend-shared, packages/launchpad, packages/reporter, packages/runner, packages/eslint-config, packages/resolve-dist, packages/root, packages/web-config — no unit test suite

Each `tooling/*` `.mocharc.js` pulls in `@packages/ts/register`, so clearing those three removes
three consumers ahead of Phase 4.

The root `test-scripts` script also still runs mocha, over `scripts/unit/**/*spec.js`.

#### `packages/server` cost breakdown

164 specs total: 154 under `test/unit` (all `.ts`), 8 under `test/integration` (5 still `.js`),
2 under `test/performance` (1 still `.js`). In descending order of cost:

1. **sinon → `vi`** — 123 files, ~2,350 stub and spy sites. The dominant cost.
2. **chai → vitest `expect`** — 161 files, ~5,100 `.to.` assertion chains. `chai-subset`,
   `chai-as-promised`, `chai-uuid` and `sinon-chai` matchers need hand-mapping.
3. **proxyquire (31 specs) and mockery (5) → `vi.mock`.**
4. **`test/spec_helper.js` → `setupFiles`.** It installs root-level hooks plus seven globals and
   enables mockery once process-wide. No migrated package has a setup file near this size, and
   29 specs consume those globals without importing the helper — those will break under vitest's
   isolated workers.
5. **Mocha API** — 284 `context()` calls, 27 `before`/`after` hooks needing `beforeAll`/`afterAll`,
   29 `this.timeout` / `this.retries` sites.
6. **Rename** the 158 `*_spec.ts` files to `*.spec.ts` to match the `include` glob every other
   package uses.
7. **`snap-shot-it` → `toMatchSnapshot`** — 11 files, 21 call sites. The smallest piece, and
   worth landing on its own first. Snapshots move from `packages/server/__snapshots__/` to
   `test/__snapshots__/`, and `SNAPSHOT_UPDATE=1` becomes `vitest -u`. The `it.only` monkey-patch
   in `spec_helper.js` exists solely to feed `snap-shot-it` and can be deleted with it.
8. **Replace `test/scripts/run.js`.** There is no `.mocharc` — the script hand-assembles every
   flag: xvfb wrapping, `--max-http-header-size=1048576`, inspect-brk handling, and substring
   globbing via `--glob-in-dir`. Four CircleCI jobs assert on its junit output, so that contract
   has to survive.

### Phase 3: Bundle ESM/CJS versions of NPM packages

`cli/package.json` is the reference implementation: a conditional `exports` map with
`import`/`require`/`types` per subpath, built by rollup. It is the only fully correct dual
package in the repo.

#### Broken today

Eight packages advertise a `module` entry point that is never built — their `tsconfig.esm.json`
sets `"noEmit": true`, so the ESM build is a type-check pass that emits nothing:
`https-proxy`, `network`, `network-tools`, `resolve-dist`, `scaffold-config`, `socket`
(via `build:node:esm`), `telemetry`, `icons`. All but `icons` also `rimraf` the output directory
first, so the advertised path does not exist at all.

The packages whose ESM output is real: `config`, `errors`, `types` and `network-interception`
via `tsc`, and `root` via rollup. `packages/electron` emits ESM but advertises no `module`
field, so nothing resolves to it.

Two more entry-point mismatches:

* `@cypress/angular` builds ESM only (`rollup.config.mjs` sets `formats: ['es']`) but points
  both `main` and `module` at it, so `require('@cypress/angular')` resolves to an ES module.
* `@cypress/mount-utils` emits `es2022` output under a CJS-shaped `main`.

#### Status

- **Correct dual build:** `cli`
- **Dual via rollup:** `@cypress/react`, `@cypress/vue`, `@cypress/svelte`
- **ESM-only (intentional):** `@cypress/vite-dev-server`, `@cypress/vite-plugin-cypress-esm`
- **CJS-only, needs dual:** `@cypress/webpack-dev-server`, `@cypress/webpack-preprocessor`,
  `@cypress/webpack-batteries-included-preprocessor`, `@cypress/puppeteer`,
  `@cypress/schematic`, `@cypress/grep`, `@cypress/eslint-plugin-dev`

#### Blocker: `moduleResolution`

`packages/ts/tsconfig.json` sets `"moduleResolution": "node"`, and it is inherited by `server`,
`data-context`, `proxy`, `net-stubbing`, `launcher`, all three `tooling/*` packages,
`eslint-config` and `system-tests`. Under `node10` resolution TypeScript ignores the `exports`
key entirely — which is the constraint described in the Phase 1 notes above.

The evidence: no first-party `packages/*` or `tooling/*` package declares `exports`. Only `cli`
and `npm/grep` do, and both escape because the monorepo's tsconfigs never resolve them. Every
`tsconfig.esm.json` under `packages/` emits `module: ES2022` while still resolving as `node10`,
which is precisely the combination that cannot see `exports`.

Moving to `node16` is one line plus fallout across 38 tsconfigs. It also turns the dangling
`module` fields and the `@cypress/angular` mismatch above into hard errors rather than silent
misconfiguration.

### Phase 4: Run Cypress server as an ESM package

Blocked on the V8 snapshot pipeline, which assumes CommonJS at five independent layers:

1. **The bundle format is esbuild's `__commonJS` map.** `create-snapshot-script.ts` closes the
   bundle with `customRequire.definitions = __commonJS`, and the stack-trace rewriter in
   `utils.ts` matches on the `at Object.__commonJS.` frame name. A package marked
   `"type": "module"` produces `__esm()` wrappers instead and drops out of that registry
   entirely.
2. **`customRequire` is a synchronous reimplementation of `require`** inside the snapshot
   (`tooling/v8-snapshot/src/blueprint/custom-require.js`). It fabricates `NodeModule` objects
   and invokes the CJS wrapper signature. ESM evaluation is async with no synchronous
   equivalent, and `customRequire.resolve` has no ESM analogue.
3. **`packherd-require` replaces `Module._load` wholesale** and reads and writes `require.cache`
   directly. The ESM loader never consults either.
4. **`transpile-ts.ts` hard-codes `format: 'cjs'`** with `'dynamic-import': false`, so `import()`
   is not available inside snapshotted code at all. This also constrains the `require()` sweep
   in Phase 1 for `packages/server`.
5. **Verification runs in `vm.runInNewContext`**, which cannot evaluate ES modules. That needs
   `vm.SourceTextModule` and is asynchronous.

Two hard ceilings sit outside this repo:

* The bundler is `@cypress/snapbuild-*`, a Go fork of esbuild shipped as a binary. Its config
  contract (`write-config-json.ts`) has no `format` option, so ESM support means changing that
  fork.
* `bytenode` only compiles CJS module wrappers to V8 bytecode. `packages/server/index.js` is
  compiled to `index.jsc` and HMAC'd by the binary integrity check, so the binary entry point
  stays CommonJS regardless of how the rest lands.

Deleting `@packages/ts` closes out this phase. Twelve workspaces still depend on it, with 23
references to `@packages/ts/register` across entry points, mocharc files, gulp tasks and CI
scripts. Most fall away as earlier items land; the last holdout is
`packages/server/hook-require.js`, which chooses between ts-node and the snapshot at runtime.

## Permanent exceptions

These stay JavaScript and should not be counted against any phase:

* `packages/server/lib/privileged-commands/privileged-channel.js` — read as a string and
  injected into the spec frame. It is not a module, and it deliberately avoids syntax the
  minimum supported browsers lack. Kept in sync with
  `packages/driver/src/cross-origin/origin_fn.ts`.
* `packages/server/hook-require.js` — the module that makes `.ts` requireable. It cannot itself
  be TypeScript.
* `packages/server/index.js` — esbuild-bundled, compiled to bytecode via `bytenode`, and HMAC'd
  by the binary integrity check. Only convertible if that entire chain changes.
* `packages/server/start-cypress.js` and `packages/server/v8-snapshot-entry.js` — the V8
  snapshot roots, referenced by the committed `snapshot-meta.json` manifests and marked
  `external` in both esbuild passes in `scripts/binary/binary-cleanup.js`.
* `tooling/v8-snapshot/src/blueprint/*.js` — snapshot runtime sources, evaluated inside the
  snapshot context.
* Fixtures: `system-tests/projects/**`, `system-tests/project-fixtures/**`,
  `npm/eslint-plugin-dev/test/fixtures/**`, `packages/data-context/test/**/*.jsx`.
