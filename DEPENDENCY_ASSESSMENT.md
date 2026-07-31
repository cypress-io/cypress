# Cypress Monorepo — Dependency Freshness Assessment

_Generated 2026-07-31 against the npm registry `latest` dist-tag. Scope: all 58 non-fixture `package.json` manifests (root, `cli`, `packages/*`, `npm/*`, `tooling/*`, `system-tests`, `scripts`). Fixture manifests under `system-tests/projects/**` and `*/test/**/fixtures/**` are intentionally excluded (frozen test inputs; Renovate `ignorePaths` skips them too)._

## Summary

**593 unique external packages** are referenced across the repo. Against the latest published versions:

| Dependency class | Major behind | Minor behind | Patch behind | Up to date |
|---|---|---|---|---|
| Runtime (`dependencies` / `peer` / `optional`) | 130 | 45 | 27 | 85 |
| Dev (`devDependencies`) | 137 | 55 | 26 | 88 |

> A dep counted once even if used by many packages; the "used by" column counts declaring manifests. The declared version shown is the **lowest floor** across manifests, which also surfaces internal version drift.

## Reading this report

- **Runtime deps ship** — they end up in the published `cypress` binary and `@cypress/*` npm packages, so they carry the most user-facing and security weight.
- **"Could be updated" ≠ "should be bumped blindly."** Several majors are ESM-only-in-latest while the consumer is CommonJS, or are pinned on purpose (see the last section).

---

## 1. Security- / correctness-sensitive runtime deps (upgrade first)

These are worth prioritizing regardless of major-version churn:

| Package | Current | Latest | Used by | Why it matters |
|---|---|---|---|---|
| `tough-cookie` | 4.1.3 | 6.0.2 | server | cookie parsing; older majors have had ReDoS/prototype advisories |
| `jose` | 4.15.5 | 6.2.5 | server, system-tests | JWT/JWK crypto in the server + system-tests auth |
| `ws` | 5.2.4 | 8.21.1 | data-context, server, system-tests | websocket lib; 5.x is many years and CVEs behind |
| `axios` | 1.15.1 | 1.19.0 | types, server, react | HTTP client; frequent security releases |
| `follow-redirects` | 1.15.9 | 1.16.0 | server | redirect handling; past SSRF/leak advisories |
| `better-sqlite3` | 12.4.1 | 13.0.2 | types, server | native module; must track Node/Electron ABI |
| `tar` | 7.5.21 | 7.5.22 | server, package.json | archive extraction; just patched for CVE-2026-59873 |
| `puppeteer-core` | 21.2.1 | 25.4.0 | puppeteer | drives Chrome in @cypress/puppeteer |
| `zod` | 3.22.5 | 4.4.3 | server, scaffold-config | runtime validation in server + scaffold-config |
| `send` | 0.19.0 | 1.2.1 | data-context, server | static file serving (path traversal surface) |
| `iconv-lite` | 0.6.2 | 0.7.3 | proxy | encoding of proxied traffic |
| `tldts` | 6.1.32 | 7.4.10 | network-tools | public-suffix logic for cookie domain scoping |

## 2. Coordinated clusters (upgrade together, not piecemeal)

**OpenTelemetry 1.x → 2.x** (`@packages/telemetry`) — the SDK packages must move in lockstep:

| Package | Current | Latest |
|---|---|---|
| `@opentelemetry/api` | 1.4.1 | 1.9.1 |
| `@opentelemetry/core` | 1.12.0 | 2.10.0 |
| `@opentelemetry/exporter-trace-otlp-http` | 0.38.0 | 0.221.0 |
| `@opentelemetry/otlp-exporter-base` | 0.38.0 | 0.221.0 |
| `@opentelemetry/resources` | 1.12.0 | 2.10.0 |
| `@opentelemetry/sdk-trace-base` | 1.12.0 | 2.10.0 |
| `@opentelemetry/sdk-trace-node` | 1.12.0 | 2.10.0 |
| `@opentelemetry/sdk-trace-web` | 1.12.0 | 2.10.0 |
| `@opentelemetry/semantic-conventions` | 1.12.0 | 1.43.0 |

**Babel 7 → 8** (19 packages: `server`, `config`, `web-config`, `data-context`, `webpack-batteries-included-preprocessor`, `system-tests`) — core, presets, plugins, and `@babel/eslint-parser` all pin 7.x and must jump together.

**GraphQL stack** (`data-context`, `frontend-shared`, `app`, `server`) — `graphql` 15→17 gates `@urql/*` 2→6, `@graphql-tools/*` 8→11/12, `graphql-ws` 5→6, `nexus`, and the root `@graphql-codegen/*` v2→v6/7 tooling.

**Vue 3.0/3.2 → 3.5** (`app`, `frontend-shared`, `launchpad`, `reporter`) — `vue` + `@vue/compiler-*` kept in lockstep; pulls `pinia` 2→4, `@intlify/unplugin-vue-i18n` 4→11, `vue-i18n` 9→11.

**Angular 18 → 22** (`npm/angular`, `npm/angular-zoneless`, `npm/cypress-schematic`) — `@angular/*` + `@angular/cli`; user-facing adapter, needs matrix testing.

**React 16/18 → 19** (`runner`, `reporter`, `npm/react`) — plus `react-dom`, `@types/react*`.

---

## 3. Runtime deps — full outdated list

### Major (125, pins excluded)

| Package | Current | Latest | Used by |
|---|---|---|---|
| `typescript` | 5.3.3 | 7.0.2 | 24 |
| `fs-extra` | 8.1.0 | 11.4.0 | 21 |
| `eslint` | 8.0.0 | 10.8.0 | 18 |
| `chalk` | 2.4.2 | 6.0.0 | 10 |
| `dedent` | 0.7.0 | 1.7.2 | 9 |
| `execa` | 4.1.0 | 10.0.1 | 8 |
| `express` | 4.21.0 | 5.2.1 | 8 |
| `@babel/core` | 7.28.0 | 8.0.1 | 7 |
| `cypress` | 7.0.0 | 15.19.0 | 7 |
| `react` | 16.13.1 | 19.2.8 | 7 |
| `@babel/preset-env` | 7.26.0 | 8.0.2 | 6 |
| `babel-loader` | 9 || ^10 | 10.1.1 | 6 |
| `globby` | 11.0.1 | 16.2.2 | 6 |
| `human-interval` | 1.0.0 | 2.0.1 | 6 |
| `p-defer` | 3.0.0 | 4.0.1 | 6 |
| `react-dom` | 18 || ^19 | 19.2.8 | 6 |
| `@angular/core` | 18.0.0 | 22.1.0 | 5 |
| `@urql/core` | 2.4.4 | 6.0.3 | 5 |
| `graphql` | 15.5.1 | 17.0.2 | 5 |
| `strip-ansi` | 6.0.1 | 7.2.0 | 5 |
| `tslib` | 1.14.1 | 2.8.1 | 5 |
| `@angular/common` | 18.0.0 | 22.1.0 | 4 |
| `@angular/platform-browser-dynamic` | 18.0.0 | 22.1.0 | 4 |
| `@typescript-eslint/eslint-plugin` | 7.0.0 | 8.65.0 | 4 |
| `@typescript-eslint/parser` | 7.0.0 | 8.65.0 | 4 |
| `eslint-plugin-mocha` | 8.0.0 | 12.0.1 | 4 |
| `@babel/code-frame` | 7.27.1 | 8.0.0 | 3 |
| `@babel/eslint-parser` | 7.28.0 | 8.0.1 | 3 |
| `@intlify/unplugin-vue-i18n` | 4.0.0 | 11.2.4 | 3 |
| `@types/mime` | 3.0.1 | 4.0.0 | 3 |
| `body-parser` | 1.20.3 | 2.3.0 | 3 |
| `buffer` | 5.7.1 | 6.0.3 | 3 |
| `chokidar` | 3.5.1 | 5.0.0 | 3 |
| `find-up` | 5.0.0 | 8.0.0 | 3 |
| `glob` | 7.1.3 | 13.0.6 | 3 |
| `lazy-ass` | 1.6.0 | 2.0.3 | 3 |
| `mime` | 3.0.0 | 4.1.0 | 3 |
| `source-map-js` | 0.6.2 | 1.2.1 | 3 |
| `temp-dir` | 2.0.0 | 3.0.0 | 3 |
| `ws` | 5.2.4 | 8.21.1 | 3 |
| `@babel/parser` | 7.28.0 | 8.0.4 | 2 |
| `@babel/plugin-proposal-decorators` | 7.28.0 | 8.0.2 | 2 |
| `@babel/plugin-transform-class-properties` | 7.27.1 | 8.0.1 | 2 |
| `@babel/plugin-transform-object-rest-spread` | 7.28.0 | 8.0.1 | 2 |
| `@babel/preset-react` | 7.27.1 | 8.0.1 | 2 |
| `@babel/preset-typescript` | 7.27.1 | 8.0.1 | 2 |
| `@babel/types` | 7.28.0 | 8.0.4 | 2 |
| `@cypress-design/vue-icon` | 1.18.0 | 3.3.0 | 2 |
| `@types/react` | 18 || ^19 | 19.2.18 | 2 |
| `@types/react-dom` | 18 || ^19 | 19.2.4 | 2 |
| `@types/sinonjs__fake-timers` | 8.1.1 | 15.0.1 | 2 |
| `@urql/exchange-graphcache` | 4.3.6 | 9.0.1 | 2 |
| `better-sqlite3` | 12.4.1 | 13.0.2 | 2 |
| `commander` | 6.2.1 | 15.0.0 | 2 |
| `duplexify` | 3.7.1 | 4.1.3 | 2 |
| `graphql-ws` | 5.5.5 | 6.2.0 | 2 |
| `hasha` | 5.2.2 | 7.0.0 | 2 |
| `image-size` | 1.2.1 | 2.0.2 | 2 |
| `is-html` | 2.0.0 | 3.2.0 | 2 |
| `jimp` | 0.22.12 | 1.6.1 | 2 |
| `jose` | 4.15.5 | 6.2.5 | 2 |
| `listr2` | 9.0.5 | 11.0.0 | 2 |
| `log-symbols` | 2.2.0 | 7.0.1 | 2 |
| `pinia` | 2.0.0-rc.14 | 4.0.2 | 2 |
| `prettier` | 2.8.8 | 3.9.6 | 2 |
| `pretty-bytes` | 5.6.0 | 7.1.1 | 2 |
| `proxy-from-env` | 1.0.0 | 2.1.0 | 2 |
| `send` | 0.19.0 | 1.2.1 | 2 |
| `untildify` | 4.0.0 | 6.0.0 | 2 |
| `webpack-bundle-analyzer` | 4.10.2 | 5.3.1 | 2 |
| `zod` | 3.22.5 | 4.4.3 | 2 |
| `@angular/cli` | 20.0.0 | 22.1.2 | 1 |
| `@babel/plugin-syntax-typescript` | 7.27.1 | 8.0.3 | 1 |
| `@babel/plugin-transform-runtime` | 7.28.0 | 8.0.1 | 1 |
| `@babel/plugin-transform-typescript` | 7.28.0 | 8.0.1 | 1 |
| `@babel/runtime` | 7.28.2 | 8.0.0 | 1 |
| `@babel/traverse` | 7.28.0 | 8.0.4 | 1 |
| `@cypress/webpack-preprocessor` | 6.0.4 | 7.1.1 | 1 |
| `@graphql-tools/batch-execute` | 8.4.6 | 10.0.9 | 1 |
| `@opentelemetry/core` | 1.12.0 | 2.10.0 | 1 |
| `@opentelemetry/resources` | 1.12.0 | 2.10.0 | 1 |
| `@opentelemetry/sdk-trace-base` | 1.12.0 | 2.10.0 | 1 |
| `@opentelemetry/sdk-trace-node` | 1.12.0 | 2.10.0 | 1 |
| `@opentelemetry/sdk-trace-web` | 1.12.0 | 2.10.0 | 1 |
| `ansi_up` | 5.0.0 | 6.0.6 | 1 |
| `arch` | 2.2.0 | 3.0.0 | 1 |
| `coffee-loader` | 4.0.0 | 5.0.0 | 1 |
| `color-string` | 1.5.5 | 2.1.4 | 1 |
| `concat-stream` | 1.6.2 | 2.0.0 | 1 |
| `content-type` | 1.0.4 | 2.0.0 | 1 |
| `conventional-commits-parser` | 3.2.4 | 7.1.1 | 1 |
| `convert-source-map` | 1.7.0 | 2.0.0 | 1 |
| `data-uri-to-buffer` | 2.0.1 | 8.0.0 | 1 |
| `ejs` | 3.1.10 | 6.0.1 | 1 |
| `electron-context-menu` | 3.6.1 | 4.1.2 | 1 |
| `find-process` | 1.4.7 | 2.1.1 | 1 |
| `get-port` | 5.1.1 | 7.2.0 | 1 |
| `getenv` | 1.0.0 | 2.0.0 | 1 |
| `is-installed-globally` | 0.4.0 | 1.0.0 | 1 |
| `isbinaryfile` | 4.0.8 | 6.0.0 | 1 |
| `istextorbinary` | 6.0.0 | 9.5.0 | 1 |
| `json-parse-even-better-errors` | 3.0.2 | 6.0.0 | 1 |
| `local-pkg` | 0.4.1 | 1.2.1 | 1 |
| `memfs` | 3.5.3 | 4.64.0 | 1 |
| `mocha-teamcity-reporter` | 3.0.0 | 4.2.0 | 1 |
| `node-html-parser` | 5.3.3 | 9.0.1 | 1 |
| `p-queue` | 6.1.0 | 9.3.3 | 1 |
| `parse5-html-rewriting-stream` | 5.1.1 | 8.0.1 | 1 |
| `picomatch` | 2.3.0 | 4.0.5 | 1 |
| `pidusage` | 3.0.2 | 4.0.1 | 1 |
| `plist` | 3.1.0 | 5.0.0 | 1 |
| `pumpify` | 1.5.1 | 2.0.1 | 1 |
| `puppeteer-core` | 21.2.1 | 25.4.0 | 1 |
| `react-docgen` | 6.0.4 | 8.0.3 | 1 |
| `serialize-error` | 7.0.1 | 13.0.1 | 1 |
| `stringify-object` | 3.0.0 | 7.0.0 | 1 |
| `supports-color` | 8.1.1 | 11.0.0 | 1 |
| `term-size` | 2.1.0 | 4.0.0 | 1 |
| `tldts` | 6.1.32 | 7.4.10 | 1 |
| `tough-cookie` | 4.1.3 | 6.0.2 | 1 |
| `trash` | 7.2.0 | 10.1.1 | 1 |
| `webpack-dev-server` | 5.1.0 | 6.0.0 | 1 |
| `webpack-merge` | 5.4.0 | 6.0.1 | 1 |
| `which` | 2.0.2 | 7.0.0 | 1 |
| `widest-line` | 3.1.0 | 6.0.0 | 1 |

### Minor (45)

| Package | Current | Latest | Used by |
|---|---|---|---|
| `debug` | 4.3.4 | 4.4.3 | 29 |
| `lodash` | 4.17.15 | 4.18.1 | 25 |
| `bluebird` | 3.5.3 | 3.7.2 | 12 |
| `semver` | 7.7.3 | 7.8.5 | 12 |
| `webpack` | 5 | 5.109.2 | 9 |
| `jiti` | 2.4.2 | 2.7.0 | 8 |
| `dayjs` | 1.9.3 | 1.11.21 | 7 |
| `tsx` | 4.22.4 | 4.23.1 | 7 |
| `vue` | 3.0.0 | 3.5.40 | 5 |
| `axios` | 1.15.1 | 1.19.0 | 4 |
| `systeminformation` | 5.27.7 | 5.33.1 | 4 |
| `ci-info` | 4.1.0 | 4.4.0 | 3 |
| `eslint-plugin-import` | 2.0.0 | 2.32.0 | 3 |
| `eslint-plugin-react` | 7.22.0 | 7.37.5 | 3 |
| `rxjs` | 7.5.0 | 7.8.2 | 3 |
| `shelljs` | 0.8.5 | 0.10.0 | 3 |
| `ts-loader` | 9.5.7 | 9.6.2 | 3 |
| `zone.js` | 0.14.0 | 0.16.2 | 3 |
| `coffeescript` | 2.6.0 | 2.7.0 | 2 |
| `get-tsconfig` | 4.10.0 | 4.14.0 | 2 |
| `json-stable-stringify` | 1.0.1 | 1.3.0 | 2 |
| `launch-editor` | 2.9.1 | 2.14.1 | 2 |
| `morgan` | 1.9.1 | 1.11.0 | 2 |
| `nexus` | 1.2.0-next.15 | 1.3.0 | 2 |
| `simple-git` | 3.32.3 | 3.36.0 | 2 |
| `svelte` | 5.0.0 | 5.56.8 | 2 |
| `@opentelemetry/api` | 1.4.1 | 1.9.1 | 1 |
| `@opentelemetry/exporter-trace-otlp-http` | 0.38.0 | 0.221.0 | 1 |
| `@opentelemetry/otlp-exporter-base` | 0.38.0 | 0.221.0 | 1 |
| `@opentelemetry/semantic-conventions` | 1.12.0 | 1.43.0 | 1 |
| `chrome-remote-interface` | 0.33.3 | 0.34.0 | 1 |
| `dataloader` | 2.0.0 | 2.2.3 | 1 |
| `find-test-names` | 1.28.18 | 1.29.19 | 1 |
| `follow-redirects` | 1.15.9 | 1.16.0 | 1 |
| `graphql-relay` | 0.9.0 | 0.10.2 | 1 |
| `graphql-scalars` | 1.10.0 | 1.25.0 | 1 |
| `iconv-lite` | 0.6.2 | 0.7.3 | 1 |
| `javascript-time-ago` | 2.3.8 | 2.6.4 | 1 |
| `mime-db` | 1.45.0 | 1.54.0 | 1 |
| `registry-js` | 1.15.0 | 1.16.1 | 1 |
| `terser` | 5.39.0 | 5.49.0 | 1 |
| `webdriver` | 9.28.0 | 9.30.0 | 1 |
| `webpack-virtual-modules` | 0.5.0 | 0.6.2 | 1 |
| `worker-nodes` | 2.3.0 | 2.7.0 | 1 |
| `yauzl` | 3.3.1 | 3.4.0 | 1 |

### Patch (27)

| Package | Current | Latest | Used by |
|---|---|---|---|
| `rimraf` | 6.1.1 | 6.1.3 | 17 |
| `@cypress/request` | 4.0.0 | 4.0.1 | 7 |
| `common-tags` | 1.8.0 | 1.8.2 | 6 |
| `compression` | 1.8.0 | 1.8.1 | 3 |
| `cookie-parser` | 1.4.5 | 1.4.7 | 3 |
| `cors` | 2.8.5 | 2.8.6 | 3 |
| `recast` | 0.23.11 | 0.23.17 | 3 |
| `cli-table3` | 0.6.1 | 0.6.5 | 2 |
| `errorhandler` | 1.5.1 | 1.5.2 | 2 |
| `eventemitter2` | 6.4.7 | 6.4.9 | 2 |
| `fluent-ffmpeg` | 2.1.2 | 2.1.3 | 2 |
| `mocha-junit-reporter` | 2.2.0 | 2.2.1 | 2 |
| `tar` | 7.5.21 | 7.5.22 | 2 |
| `@types/sizzle` | 2.3.2 | 2.3.10 | 1 |
| `@types/tmp` | 0.2.3 | 0.2.6 | 1 |
| `babel-plugin-add-module-exports` | 1.0.2 | 1.0.4 | 1 |
| `engine.io` | 6.6.7 | 6.6.9 | 1 |
| `engine.io-client` | 6.6.4 | 6.6.6 | 1 |
| `flatted` | 3.4.2 | 3.4.4 | 1 |
| `geckodriver` | 6.1.0 | 6.1.1 | 1 |
| `graceful-fs` | 4.2.9 | 4.2.11 | 1 |
| `randomstring` | 1.3.0 | 1.3.1 | 1 |
| `sanitize-filename` | 1.6.3 | 1.6.4 | 1 |
| `shell-env` | 4.0.1 | 4.0.3 | 1 |
| `socket.io-parser` | 4.2.6 | 4.2.7 | 1 |
| `squirrelly` | 9.1.0 | 9.1.1 | 1 |
| `tmp` | 0.2.4 | 0.2.7 | 1 |

---

## 4. devDependencies

Covered in detail per-area (root toolchain, driver, all packages, cli, system-tests). Headline dev-toolchain majors shared across many packages:

- `typescript` 5.3–5.9 → 7.0 *(24 manifests; the native compiler — a migration)*
- `vitest` 2/3 → 4 *(28 manifests)* and `eslint` 8 → 10 *(18)*
- `rollup` 3 → 4 *(8)*, `vite` 6 → 8, `cross-env` 7 → 10 *(7)*, `sinon` 5/7/8 → 22, `chai` 4 → 6
- Low-risk everywhere: `rimraf`, `jiti`, `tsx`, `webpack` 5.x minors, `@types/*` that just track their runtime.

## 5. Intentionally pinned — do NOT auto-bump

Locked via root `resolutions` or tied to the runtime/binary; their "outdated" status is deliberate:

| Package | Declared | Latest | Reason |
|---|---|---|---|
| `@electron/get` | 4.0.1 | 5.1.0 | root `resolutions` pin |
| `@graphql-tools/delegate` | 8.2.1 | 12.1.1 | root `resolutions` pin |
| `@graphql-tools/wrap` | 8.1.1 | 11.1.21 | root `resolutions` pin |
| `@types/node` | 22.18.7 | 26.1.2 | root `resolutions` pin |
| `devtools-protocol` | 0.0.1575685 | 0.0.1670834 | root `resolutions` pin |
| `jquery` | 3.7.1 | 4.0.0 | root `resolutions` pin |
| `minimatch` | 3.1.2 | 10.2.6 | root `resolutions` pin |
| `uuid` | 11.1.1 | 14.0.1 | root `resolutions` pin |
| `electron` | 37.6.0 | 43.2.0 | drives packaged Chromium; coordinated upgrade only |
| `react-15.*` / `react-16.*` aliases | — | — | deliberate multi-version driver test fixtures |

_(`@types/node` above is pinned specifically to match the Node engine `>=22.19.0`.)_

## 6. Recommended sequencing

1. **Patch + safe minors** (`debug`, `semver`, `lodash`, `rimraf`, `bluebird`, `webpack` 5.x, `dayjs`, `tsx`, `jiti`, all `@types/*` patch) — mostly Renovate auto-merge; batch and validate with `yarn check-ts` + `yarn lint`.
2. **Security-sensitive majors** (section 1) — one PR each, with targeted tests.
3. **Coordinated clusters** (section 2) — dedicated PRs per cluster.
4. **Repo-wide toolchain majors** (TypeScript 7, ESLint 10, Vitest 4) — large, scheduled migrations.

_Normalize internal version drift (e.g. `fs-extra` 8/9, `typescript` 5.3/5.4/5.9, `sinon` 5/7/8, `@types/mocha` 8.0.2/8.0.3) while touching each package — it shrinks the lockfile and removes duplicate installs._
