# Cypress Monorepo — Repository Architecture & Tooling Scan

> Technical due-diligence pass. Every claim is grounded in a specific file, config, or directory cited by path. Where a signal is ambiguous or unconfirmed, it is called out in **§6 Gaps and uncertainties**.

## 1. Summary

Cypress is a **Yarn 1 + Lerna monorepo** (with Nx for task caching) that ships an Electron desktop test runner, the `cypress` CLI/npm package, an in-browser JavaScript test driver, a Node HTTP/proxy server, and a suite of publicly published npm adapters and plugins. Source is organized into four workspace roots — `cli/`, `packages/*` (34 internal packages), `npm/*` (published adapters/plugins), and `tooling/*` — declared in `package.json` (`workspaces`) and `lerna.json`. The runtime splits into three cooperating tiers: a **Node/server tier** (`@packages/server`) that launches browsers and hosts the proxy, a **browser/driver tier** (`@packages/driver` + `@packages/app` Vue GUI) that executes `cy.*` commands, and a **data/GraphQL tier** (`@packages/data-context`) that acts as the shared application brain. It is almost entirely **TypeScript**, uses **two communication planes** (GraphQL for GUI↔Node, WebSockets for driver↔server), and is built/released through a dynamic **CircleCI** multi-platform pipeline plus **semantic-release**, with binaries distributed via S3/CDN.

## 2. Languages and runtimes

- **Primary language: TypeScript** (`strict: true`, `noImplicitAny: false`) — shared base config at `packages/ts/tsconfig.json`, extended per package (e.g. `packages/server/tsconfig.json`). `typescript@5.3.3` (root `package.json`).
- **Secondary: JavaScript** — build/release scripts (`scripts/*.js`), some legacy runtime, and Node tooling. **Vue 3 SFCs** for the frontend (`@packages/app`, `@packages/launchpad`, `@packages/frontend-shared`). **GraphQL SDL** (`packages/data-context/schemas/schema.graphql`).
- **Runtime: Node.js** — pinned to `22.19.0` via `.node-version` and `.nvmrc`; enforced by `engines.node >= 22.19.0` (`package.json`) and `scripts/check-node-version.js`.
- **Electron runtime**: `electron@37.6.0` (root `package.json` devDependencies) — wraps the desktop app.
- **Package manager: Yarn 1**, pinned via `packageManager: "yarn@1.22.22"` and `engines.yarn >= 1.22.22` (`package.json`). npm/pnpm explicitly disallowed (`AGENTS.md`).
- **Browsers targeted at runtime**: Chrome, Firefox, Edge, WebKit, Electron (`@packages/launcher`). `playwright-webkit@1.61.0` supplies WebKit.
- **Version pinning surface**: `.node-version`, `.nvmrc`, `engines`, `packageManager`, `save-exact=true` (`.npmrc`), and a large `resolutions` block (`package.json`) for transitive-dep locking.

## 3. Architecture

**Shape:** monorepo of cooperating packages producing one Electron desktop app + a CLI + published npm libraries (evidence: `package.json` `workspaces`, `lerna.json`, `packages/AGENTS.md` package map). Not microservices — it is a single desktop product decomposed into internal packages, plus separately versioned public packages.

**Communication planes (two, deliberately separated):**
- **GraphQL (GUI ↔ Node backend)** — code-first schema built with **Nexus**: `packages/data-context/graphql/schema.ts` calls `makeSchema(...)`, emitting SDL to `packages/data-context/schemas/schema.graphql` and typegen to `src/gen/nxs.gen.ts`. Resolvers are Nexus `objectType`s receiving the central `ctx` (`graphql/schemaTypes/objectTypes/gql-Query.ts`). Remote-schema stitching for Cypress Cloud lives in `graphql/stitching/remoteSchema.ts`. Frontend client is **urql** (not Apollo): `@urql/vue`/`@urql/core` in `packages/app/package.json`, `@urql/exchange-graphcache` in `packages/frontend-shared/package.json`. VSCode/tooling introspection config is `apollo.config.js`.
- **WebSockets (driver/runner ↔ server)** — `@packages/socket` wraps **socket.io** (`packages/socket/lib/node/index.ts`, client `packages/socket/lib/client/browser.ts`). Server side: `packages/server/lib/socket-base.ts` (`SocketBase`, subclassed by `socket-e2e.ts`/`socket-ct.ts`). A **CDP-based transport** emulating the socket.io API exists at `packages/socket/lib/node/cdp-socket.ts`.
- **HTTP/S proxy interception** — `@packages/proxy` (`lib/http/index.ts`), TLS interception with generated CA in `@packages/https-proxy` (`lib/index.ts`, `ca.ts`, `node-forge`), `cy.intercept` in `@packages/net-stubbing`, source rewriting in `@packages/rewriter`.
- **Process isolation via child-process fork IPC** — user config + plugins run in a forked Node process: `packages/data-context/src/data/ProjectConfigIpc.ts` (`fork(...)` of `require_async_child.ts`). No Electron `ipcMain`/`ipcRenderer` usage was found; main↔renderer coordination goes through the socket + GraphQL layers.

**Data stores / persistence (deliberately lightweight):**
- JSON file cache for global user state: `packages/server/lib/cache.ts` (`USER`, `PROJECTS`, `PROJECT_PREFERENCES`, `COHORTS`). Per-project UI state: `packages/server/lib/saved_state.ts`.
- In-memory reactive store `coreData` (`packages/data-context/src/data/coreDataShape.ts`) backs GraphQL resolvers.
- **SQLite (`better-sqlite3`)** is scoped only to the Cloud/protocol and Studio subsystems: `packages/server/lib/cloud/protocol.ts`, `packages/server/lib/cloud/studio/studio.ts`.
- Frontend normalized cache via urql graphcache (`@urql/exchange-graphcache`).

**Module / service boundaries (top ~10):**

| Package | Path | Responsibility |
|---|---|---|
| `@packages/server` | `packages/server/` | Node orchestrator: HTTP server, browser launch, socket server, run/interactive modes, cache, cloud |
| `@packages/data-context` | `packages/data-context/` | Central `ctx` + GraphQL (Nexus) + sources/actions data layer — the app's brain |
| `@packages/driver` | `packages/driver/` | In-browser test engine: `cy.*` commands, command queue, assertions, retries |
| `@packages/proxy` | `packages/proxy/` | HTTP interception via staged middleware pipeline |
| `@packages/net-stubbing` | `packages/net-stubbing/` | `cy.intercept` request matching / response manipulation |
| `@packages/https-proxy` | `packages/https-proxy/` | TLS interception with generated CA |
| `@packages/socket` | `packages/socket/` | socket.io wrapper + CDP-socket transport for driver↔server |
| `@packages/app` | `packages/app/` | Vue 3 GUI (runner + launchpad host), Pinia/MobX stores, urql client |
| `@packages/runner` | `packages/runner/` | Hosts the AUT iframe and driver↔server bridge (legacy webpack) |
| `@packages/config` | `packages/config/` | Config types, defaults, validation, `defineConfig` API |

(Also notable: `@packages/reporter`, `@packages/launcher`, `@packages/frontend-shared`, `@packages/errors`, `@packages/telemetry`.)

## 4. Design patterns

- **DataSource / Actions / Context (`ctx`) — the dominant architecture.** `packages/data-context/src/DataContext.ts` is a central DI/context object instantiating every source and `DataActions`, passing `this` down. Read side = `sources/` (16 files, e.g. `FileDataSource.ts`, `ProjectDataSource.ts`, `CloudDataSource.ts`, `GitDataSource.ts`) — a **repository/query** pattern. Write side = `actions/` (19 files, e.g. `ProjectActions.ts`, `AuthActions.ts`) — a **CQRS-flavored** split (sources query, actions mutate).
- **Dependency injection at the seam.** `DataContextConfig` requires injected `appApi`/`authApi`/`projectApi`/`electronApi`/`browserApi`/`cohortsApi` (`DataContext.ts`, comment "Injected from the server") so the server supplies Electron/OS-bound implementations.
- **Event-driven (EventEmitter).** Global pub/sub in `packages/data-context/src/globalPubSub.ts`; typed emitter `packages/data-context/src/actions/DataEmitterActions.ts` drives GraphQL live-query invalidation.
- **Command pattern (driver).** `cy.*` commands are registered/queued/executed as command objects: registration in `packages/driver/src/cypress/commands.ts`, queue in `packages/driver/src/cypress/command_queue.ts` (`CommandQueue extends Queue<$Command>`), built-ins under `packages/driver/src/cy/commands/`.
- **Chain-of-responsibility / middleware pipeline (proxy).** `packages/proxy/lib/http/index.ts` defines staged stacks (`RequestMiddleware`/`ResponseMiddleware`/`ErrorMiddleware`) run by `_runStage()` with `this.next()`/`skipMiddleware()`; individual steps in `request-middleware.ts`. Mirrored in `net-stubbing/lib/server/middleware/`.
- **Frontend state.** Vue 3 + **Pinia** (`packages/app/src/store/index.ts`, `createPinia()`) with **MobX** co-existing for the legacy runner store (`packages/app/src/store/mobx-runner-store.ts`) — a partial migration.
- **Layered / tiered** overall (GUI → GraphQL/data-context → server → proxy/driver), with a hard **process-isolation boundary** around user plugin code (`ProjectConfigIpc`).

## 5. Toolchains

### Toolchain summary

| Category | Tool | Config file | Runs in CI |
|---|---|---|---|
| CI/CD | CircleCI (dynamic/continuation) | `.circleci/config.yml`, `.circleci/src/pipeline/**` | Yes |
| CI (supplementary) | GitHub Actions | `.github/workflows/*.yml` (12 files) | Yes |
| Release (npm) | semantic-release + semantic-release-monorepo | `.releaserc.js`, `scripts/npm-release.js` | Yes |
| Release (binary) | electron-builder + custom scripts → S3/CDN | `electron-builder.json`, `scripts/binary.js` | Yes |
| Dependency automation | Renovate | `renovate.json` | Yes (bot) |
| Unit tests (most pkgs) | Vitest | `vitest.config.ts` (root + ~30 pkgs) | Yes |
| Unit/integration (server, tooling) | Mocha | `packages/server/test/scripts/run.js`, `tooling/*/test/.mocharc.js` | Yes |
| E2E / component (self-test) | Cypress ("Cypress-in-Cypress") | `packages/app/cypress.config.ts`, `packages/driver/cypress.config.ts` | Yes |
| System / binary tests | Mocha harness | `system-tests/package.json` | Yes |
| HTTP/API tests | supertest + nock | `packages/server/test/spec_helper.js` | Yes |
| Coverage | @vitest/coverage-v8 | `vitest.config.ts` (`provider: 'v8'`) | Yes |
| Visual testing | Percy | `.percy.yml` | Yes |
| Linting | ESLint (`@cypress/dev`) | `.eslintrc.js`, `cli/eslint.config.ts` | Yes |
| Formatting | ESLint only (no Prettier) | `.prettierignore` (`**/*`) | Yes |
| Type checking | tsc `--noEmit` | `packages/ts/tsconfig.json`, `check-ts` scripts | Yes |
| Dead-code / health | Knip | `knip.json` (`yarn health-check`) | Yes |
| Bundler (frontend) | Vite | `packages/{app,launchpad,frontend-shared,driver}/vite.config.mjs` | Yes (build) |
| Bundler (runner/reporter) | webpack | `packages/{runner,reporter}/webpack.config.ts`, `packages/web-config/webpack.config.base.ts` | Yes (build) |
| Bundler (CLI + adapters) | Rollup | `cli/rollup.config.mjs`, `npm/*/rollup.config.mjs` | Yes (build) |
| Bundler (dep packing) | esbuild | `tooling/packherd/src/create-bundle.ts` | Yes (build) |
| Build orchestration | Lerna + Nx | `lerna.json`, `nx.json`, `scripts/lerna-build.js` | Yes |
| Startup optimization | V8 snapshot (mksnapshot) | `tooling/v8-snapshot/**`, `tooling/electron-mksnapshot` | Yes |
| Task runner (dev) | gulp | `gulpfile.js`, `scripts/gulp/gulpfile.ts` | Dev-mostly |
| Git hooks | Husky + lint-staged | `.husky/pre-commit`, `package.json` `lint-staged` | Local |
| Security scanning | Snyk (SCA + SAST) | `.github/workflows/snyk_*.yaml` | Yes |
| SBOM | anchore/sbom-action | `.github/workflows/upload_release_asset.yml` | Yes (on release) |
| Tracing/telemetry | OpenTelemetry (OTLP/HTTP) | `packages/telemetry/**` | Runtime (opt-in) |
| Logging | `debug` | pervasive (`Debug('cypress:...')`) | Runtime |

### 5.1 CI/CD

- **CircleCI (primary), dynamic-config model.** `.circleci/config.yml` (`setup: true`) uses the `circleci/continuation` orb. Modular source in `.circleci/src/pipeline/**` is **packed** to `.circleci/packed/pipeline.yml` at runtime via `./scripts/pack-ci.sh --all` (`packed/` is git-ignored). A two-job setup workflow (`pack-workflows` → `launch-primary-workflow`, `config.yml:7-13`) caches packed output by a checksum of `src/**/*.yml`, generates path-filter parameters (`.circleci/scripts/generate-pipeline-parameters.sh`), and continues into the primary pipeline.
- **Two workflow modes.** A **PR workflow** (`src/pipeline/workflows/pull-request.yml`) with path-based job filtering (`halt-if-skipped`), and **five platform "main" workflows** — `linux-x64`, `linux-arm64`, `darwin-x64`, `darwin-arm64`, `windows` (`workflows/@main.yml`) — gated by the shared `&full-workflow-filters` anchor. The **full-CI allowlist** (branches `develop`, `release/x.y.z`, `electron/x.y.z`, `update-v8-snapshot-cache-on-develop`, or `force-persist-artifacts`) is documented in `.circleci/AGENTS.md`.
- **Stages/jobs** (defs in `src/pipeline/@pipeline.yml`): install → build → static checks (`check-ts`, `lint`, `lint-types`, `health-check`) → unit/integration/performance tests → driver integration (Chrome/Firefox/Electron/WebKit + memory) → `system-tests-{chrome,electron,firefox,webkit,non-root}` → app/UI component & integration (many `percy: true`) → npm-package tests → V8 integration tests → binary build & verification (`create-build-artifacts`, mac/windows signing, kitchensink/recipes/staging/RWA verification).
- **Release gate.** `ready-to-release` (`@main.yml:261-312`) is a fan-in aggregating ~60 jobs; `npm-release` requires it and is filtered to `develop`. PR analog: `all-jobs-passed` (the only required GitHub status check). **External-PR gate**: `approve-contributor-pr` manual approval for `pull/[0-9]+` branches (`pull-request.yml:37-57`); draft PRs cancelled by `cancel-draft-prs`.
- **GitHub Actions (supplementary, 12 workflows in `.github/workflows/`):** `semantic-pull-request.yml` (PR title + changelog lint), `snyk_sca_scan.yaml` (dep vuln scan, fails on critical), `snyk_static_analysis_scan.yaml` (SAST, non-blocking), `auto_approve_low_risk.yml`, `stale_issues_and_pr_cleanup.yml`, five `triage_*.yml` project-board automations, `update-browser-versions.yml` (daily Chrome bump PRs), `update_v8_snapshot_cache.yml` (3-OS snapshot cache regen), `upload_release_asset.yml` (SPDX SBOM on release). Third-party actions are SHA-pinned (Renovate `helpers:pinGitHubActionDigests`).
- **Release automation.** semantic-release (`.releaserc.js`, angular preset, `semantic-release-monorepo`, branch `develop`); per-package `npm/*/.releaserc.js`; orchestrated by `scripts/npm-release.js`. Binaries built by `scripts/binary/build.ts` (electron-builder), triggered cross-project to `cypress-io/cypress-publish-binary`, uploaded to S3 bucket `cdn.cypress.io` (`scripts/binary/util/upload.js`, `upload-build-artifact.js`).
- **Dependency automation.** Renovate (`renovate.json`): auto-merge minor/patch/pin/digest, 7-day security cooldown on GitHub Actions, `prConcurrentLimit: 4`.
- **Visual testing.** Percy (`.percy.yml`, width 1280); jobs run `yarn percy exec --parallel`, finalized by `percy-finalize`.

### 5.2 Testing

Dual-track: most Node packages use **Vitest**; `@packages/server`, `tooling/*`, and `system-tests` remain on **Mocha**; frontend/UI is **Cypress-in-Cypress**.

- **Unit** — Vitest (~30 `vitest.config.*`, aggregated by root `vitest.config.ts` as `projects`; specs use native `expect`/`vi`, e.g. `packages/scaffold-config/test/detect.spec.ts`). Mocha for server (`packages/server/test/scripts/run.js`), tooling (`tooling/*/test/.mocharc.js`), and `npm/webpack-preprocessor/.mocharc.json`.
- **Assertion/mocking** — Vitest built-ins on the Vitest track; on the Mocha track `chai` + `chai-as-promised` + `sinon` + `sinon-chai` + `proxyquire` + `mock-fs` (root `package.json`), wired in `packages/server/test/spec_helper.js` (adds `chai-subset`, `@cypress/sinon-chai`, `chai-uuid`, `nock`, `supertest`, `mockery`).
- **Integration** — co-located `test/integration/` dirs (`packages/server/test/integration`, `.../proxy`, `.../https-proxy`, `.../network`); root `test-integration` via lerna.
- **E2E / component (self-test)** — Cypress configs define both `e2e` and `component` blocks (`packages/app/cypress.config.ts` uses Vite+Vue; `packages/driver/cypress.config.ts` uses webpack). Adapters use component-only configs (`npm/react/cypress.config.ts`).
- **System / binary** — `system-tests/` (`@tooling/system-tests`), a Mocha harness launching the real server per test against `system-tests/projects/*` fixtures; `system-tests/test-binary/` runs against the packaged binary (`system-tests/package.json`, `snap-shot-it`, `dockerode`, `execa`).
- **HTTP/API** — supertest + nock (`packages/server`, `system-tests`). No formal contract-test framework (e.g. Pact).
- **Coverage** — `@vitest/coverage-v8` (`vitest.config.ts`: `provider: 'v8'`, `reporter: ['clover']`). No repo-level nyc/istanbul.
- **Reporters** — `mocha-junit-reporter` + `mocha-multi-reporters` (`mocha-reporter-config.json`); Cypress self-tests use `cypress-multi-reporters`; Vitest `reporters: ['default', 'junit']`.
- **Location conventions** — Node packages: `test/**/*.spec.ts` (or `unit/`,`integration/`,`performance/`). UI packages: `cypress/{e2e,component}/` with `*.cy.{ts,tsx}`. System: `system-tests/test/*_spec.*` + fixtures under `system-tests/projects/*`.

### 5.3 Linting and formatting

- **ESLint** is the single style authority. Root `.eslintrc.js` extends `plugin:@cypress/dev/general` + `plugin:@cypress/dev/tests`, parser `@typescript-eslint/parser`, plus GraphQL rules validated against `schema.graphql`. Shared preset is `@packages/eslint-config` and `@cypress/eslint-plugin-dev`. The `cli/` package uses flat config (`cli/eslint.config.ts`).
- **No Prettier** — `.prettierignore` ignores `**/*`; formatting rules (single quotes, no semicolons, 2-space indent, trailing commas, `prefer-template`, `no-console`) are ESLint-enforced (`AGENTS.md`, `packages/eslint-config/src/baseConfig.ts`). Custom rules include a `no-restricted-syntax` ban on synchronous `fs` calls (except `existsSync`).
- **Type checking** — `tsc --noEmit` per package via `check-ts` (root `check-ts` = `lerna run check-ts`); `type-check` also covers system-tests + `scripts/type_check`. Base config `packages/ts/tsconfig.json` (`strict: true`, `noImplicitAny: false`, `importsNotUsedAsValues: "error"`).
- **Dead-code / health** — Knip (`knip.json`, `yarn health-check`).
- **Where they run** — CI (`lint`, `check-ts`, `health-check` jobs) and locally via **Husky** `.husky/pre-commit` → `lint-staged` (ESLint `--fix` per path globs) + CircleCI config validation on `.circleci/src/` changes.

### 5.4 Bundling and building

- **Orchestration** — Lerna (`lerna.json`) + Nx caching (`nx.json`, Nx Cloud read-only token). Top-level `build` = `scripts/lerna-build.js` (concurrency capped at `min(4, availableParallelism())` to avoid CI OOM) → `@packages/electron build-binary` → `lerna run build-cli`.
- **Bundlers** — **Vite** for Vue apps (`packages/{app,launchpad,frontend-shared,driver}/vite.config.mjs`, shared `makeConfig()` in frontend-shared); **webpack** for runner/reporter (`packages/{runner,reporter}/webpack.config.ts`, base `packages/web-config/webpack.config.base.ts` with babel-loader); **Rollup** for the `cypress` CLI (`cli/rollup.config.mjs`) and all published adapters (`npm/*/rollup.config.mjs`); **esbuild** for dependency packing (`tooling/packherd/src/create-bundle.ts`) and on-demand TS transpile (`packages/packherd-require/src/transpile-ts.ts`).
- **TypeScript** — shared base `packages/ts/tsconfig.json`; require-time transpile via `@packages/ts/register` (ts-node + `typescript-cached-transpile`). Most packages emit via `tsc`; CLI emits via Rollup (`tsconfig.json` `noEmit: true`).
- **Transpilation** — Babel is confined to the webpack UI pipeline (`packages/web-config/webpack.config.base.ts`: `@babel/preset-env`/`-typescript`/`-react`); no repo-wide Babel config.
- **Electron packaging** — `electron-builder.json` (per-OS targets, mac hardened runtime + entitlements, signing hooks); driven by `scripts/binary/build.ts` (`electronBuilder.build({ publish: 'never' })`, asar disabled to hand-copy nested `packages/*/node_modules`, Windows max-path guard).
- **V8 snapshot (startup optimization)** — `@tooling/v8-snapshot` (electron-link-derived snapshot-doctor) + `@tooling/electron-mksnapshot` (mksnapshot wrapper) produce a heap snapshot loaded at runtime by `@packages/v8-snapshot-require`. Setup via `build-v8-snapshot-{dev,prod}` scripts.
- **packherd** — `@tooling/packherd` packs all reachable deps into a bundle (esbuild + metafile); `@packages/packherd-require` loads bundled modules and transpiles TS on demand — the module-loading substrate under the V8 snapshot path.
- **Docker** — `docker-compose.yml` (`dev`, `watch`, `ci` services; `cypress/base-internal:22.19.0-trixie` mirrors CI). No first-party app `Dockerfile`.
- **gulp** — dev-time task runner (`gulpfile.js` shim → `scripts/gulp/gulpfile.ts`): `dev`, `dev:watch` (webpack watch + Vite dev servers), `codegen` (autobarrel + Nexus + GraphQL codegen).

### 5.5 Observability and monitoring

- **Tracing = OpenTelemetry** via `@packages/telemetry` (`@opentelemetry/api@1.4.1`, `sdk-trace-{base,node,web}`, exporter `exporter-trace-otlp-http` — OTLP/HTTP). Singleton `Telemetry` with a `TelemetryNoop` fallback (`src/telemetry/index.ts`); per-context entry points `src/node.ts` (NodeTracerProvider + BatchSpanProcessor, CircleCI/GitHub-Actions resource detectors) and `src/client.ts` (WebTracerProvider + SimpleSpanProcessor). Exporters in `src/span-exporters/` include a **JWE-encrypted cloud exporter**, an IPC exporter, a WebSocket exporter, and a dev-only Honeycomb-link console exporter. **Opt-in only** (`CYPRESS_INTERNAL_ENABLE_TELEMETRY=true`); spans route to Cypress Cloud `/telemetry` and are forwarded to Honeycomb only for Cypress's own internal project (`packages/telemetry/README.md`).
- **Logging = the `debug` library** (~314 uses across 312 files; namespaces like `Debug('cypress:server:...')`). No structured logger (winston/pino/bunyan absent). `no-console` enforced (`packages/eslint-config/src/baseConfig.ts`), off only for the CLI. Closest to a logging framework is `@packages/stderr-filtering` (`logError`, `WriteToDebug`).
- **Error tracking** — JS-level global handlers (`packages/server/lib/unhandled_exceptions.ts`) feed a crash-report pipeline to Cypress Cloud (`lib/errors.ts` `logException` → `lib/cloud/exception.ts` → `api.createCrashReport()`), production + auth gated, disabled by `CYPRESS_CRASH_REPORTS=0`. Sentry lives on the Cloud backend, not in the shipped client (no `@sentry/*`/`bugsnag` dependency).
- **Metrics/dashboards** — none (no Prometheus/StatsD/Datadog). Observability is trace + `debug`-log only.
- **Profiling** — `perf_hooks`-based Studio telemetry (`lib/cloud/studio/telemetry/TelemetryManager.ts`), process profiler (`lib/util/process_profiler.ts`, `systeminformation`), network profiler (`lib/util/net_profiler.ts`), browser memory monitoring (`lib/browsers/memory/`).

## 6. Gaps and uncertainties

- **Dual frontend state stack.** Pinia (`packages/app/src/store/index.ts`) and MobX (`packages/app/src/store/mobx-runner-store.ts`) co-exist — evidence of a partially completed migration off the legacy runner store, not a defect.
- **Two test runners mid-migration.** Vitest is dominant but `@packages/server` (the largest package), `tooling/*`, and `system-tests` remain on Mocha 7. Consolidation is incomplete.
- **No native Electron crash reporting.** `crashReporter`/minidump capture is not used anywhere; only JS-level `uncaughtException`/`unhandledRejection` handlers exist — native C++/renderer crashes are not captured.
- **No metrics stack and no structured logging.** Diagnostics depend on the `DEBUG` env var (off by default) and opt-in OTel traces; there is no leveled/structured application logger and no Prometheus/StatsD/Datadog.
- **Telemetry benefits only Cypress.** Traces are retained solely for Cypress's internal project; end users get no telemetry value from the instrumentation they ship.
- **No consumer-driven contract tests.** HTTP testing uses supertest/nock; there is no Pact-style contract framework despite multiple network/proxy service boundaries.
- **CircleCI packed pipeline is generated, not committed.** `.circleci/packed/` is git-ignored, so the authoritative compiled pipeline is not in-repo; review requires reading `.circleci/src/pipeline/**` and mentally packing it. The `@main.yml` line references above are from the source modules, not a compiled artifact.
- **Nx caching is `cache: false` for `build`/`lint`/`check-ts`** (`nx.json`) — Nx is used for the dependency graph but local build caching is largely disabled; the practical caching win comes from Nx Cloud + CircleCI caches. Worth confirming this is intentional.
- **`@packages/network` unit tests require privileged port 443** and fail with EACCES in unprivileged containers (`AGENTS.md`) — a local-environment caveat, not a code issue.
- **Path-dependent config tests.** Two `@packages/config` tests assert the workspace path contains `cypress` and fail when the checkout dir is named otherwise (`AGENTS.md`).
