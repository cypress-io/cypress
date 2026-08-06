# Spike: Angular CT on `@angular/build` instead of `@angular-devkit/build-angular` (#30903)

Branch: `spike/30903-angular-build` (targets `release/16.0.0`) · Prototype app: `spike-app` (Angular 21.2, scratchpad)

## TL;DR

**Angular component testing works on pure `@angular/build` projects via `@cypress/vite-dev-server` + `@analogjs/vite-plugin-angular`, and this branch implements it end to end**: a dev-server preset, wizard/scaffold support, and `ng add` support, verified against an Angular 21 zoneless app on Vite 8 with zero deprecated dependencies. It is the same architecture Storybook shipped as `@storybook/angular-vite` (preview, Storybook 10.5, 2026-07-10). A first-party "Cypress as an Angular test runner" design (`buildApplicationInternal`) is the validated hedge; Angular's officially endorsed path (`executeDevServerBuilder`) is architecturally unusable for CT.

## Why now

- `ng new` since v17 defaults to esbuild/Vite; the v18→19 migration actively removes `@angular-devkit/build-angular`. Our `angularHandler` crashes on such projects (#30903).
- The webpack builders are maintenance-only since v17; our current handler survives only because the devkit package still exists as a compat shim.
- The "install `@angular-devkit/build-angular` as a devDependency" workaround is being rejected on compliance grounds — it carries two GHSAs ([comment](https://github.com/cypress-io/cypress/issues/30903#issuecomment-5195754005)).
- Agentic AI lowers the cost of spiking dramatically — exploring `@angular/build` internals, prototyping three integration architectures, and validating an end-to-end PoC is days of work instead of weeks or months.
- On [angular-cli#31931](https://github.com/angular/angular-cli/issues/31931) the Angular team replied once and redirected the conversation to Slack; the follow-up Slack messages in `#angular-team` (Nov 2025 and Apr 2026) have not received a response so far. Plan assuming no upstream cooperation in the near term.

## The core architectural fact

In `@angular/build`, **Vite never compiles Angular code**. `serveWithVite` runs `buildApplicationInternal` (the esbuild pipeline, Angular compiler inside) in watch mode and keeps outputs in in-memory maps; internal, unexported Vite plugins merely *serve* those artifacts. The Angular Team at Google confirmed the Vite config is "internal and cannot be extracted or accessed via any public or private API" and rejected exposing Vite plugin injection (angular-cli#27951). So the analog of today's `generateBrowserWebpackConfigFromContext` trick cannot exist — every option is a different answer to "who compiles Angular, and who serves it."

Reachable surface: **public** — `buildApplication`, `executeDevServerBuilder`, `executeUnitTestBuilder`, `ApplicationBuilderExtensions` (esbuild `codePlugins` + `indexHtmlTransformer`, documented as unsupported); **`@angular/build/private`** (explicit no-SemVer) — `buildApplicationInternal`, `serveWithVite`, `createAngularCompilation`, `createCompilerPlugin`, `JavaScriptTransformer`, …

## Options

### Option 1 (chosen, implemented spike): `@cypress/vite-dev-server` + `@analogjs/vite-plugin-angular` preset

Analog's Vite plugin compiles per-file in the transform pipeline (via `createAngularCompilation` from `@angular/build/private`, with its own fallback); our Vite server serves, model unchanged.

- **Precedent**: `@storybook/angular-vite` (preview in Storybook 10.5) is exactly this — built by the Analog and Storybook teams, Angular ≥21 + Vite ≥8, webpack framework kept alive alongside. The Angular team's "Vite plugin prototype with Storybook" (mentioned on #31931) never materialized publicly; Storybook uses no official Angular API. Their post-release friction list mirrors ours: an unneeded `@angular/platform-browser-dynamic` peer (their #35457 ≈ our #33006) and `angular.json` styles fidelity.
- **Risks / drift to document**: Analog leans on `/private` (no SemVer; shared blast radius with Storybook/Nx); **AOT vs today's forced JIT** — template-string `mount()` and `TestBed.overrideTemplate` need a JIT escape hatch (Analog `jit` option or `import '@angular/compiler'`); `justInTimeCompile` stays webpack-only; `stylePreprocessorOptions`/tsconfig-paths fidelity is partial — the same cost Storybook accepted.

### Option 2 (validated hedge): first-party runner mirroring `@angular/build:unit-test`

`buildApplicationInternal` with a fabricated `BuilderContext` and specs as entry points; our Vite server serves the in-memory artifacts (a ~200-line port of Angular's `angular:test-in-memory-provider` plugin). Perfect `angular.json` fidelity, no third-party dep, incremental watch built in — but everything load-bearing is `/private`, and it's more code. Keep as the v2 evolution if Analog becomes a liability.

### Option 3 (rejected): `executeDevServerBuilder` — Angular's endorsed path

The builder owns the port, the index.html, and bootstraps `main.ts`; Cypress must own the server, serve `component-index.html`, and load specs. The only injection points are documented as "NOT supported and may cause unexpected build output or build failures". Custom-builder wrappers inherit the same inversion. This is the answer to "why didn't you do what Angular recommended."

### Upstream asks (parallel track, not blocking)

1. **Pluggable `TestRunner`** in `@angular/build:unit-test` — it already loads runners through a clean two-method interface, just refuses to resolve them from outside the package. A small RFC would make Cypress a first-class `ng test` runner (Option 2 with official support).
2. **Stabilize `createAngularCompilation`/`createCompilerPlugin`** — the APIs Analog (and therefore Storybook) already depend on; a joint Cypress + Storybook + Analog ask is stronger than "give us a Vite config".
3. GHSA patches for `@angular-devkit/build-angular` (asked on #30903).

## What this branch implements

`framework: 'angular'` + `bundler: 'vite'` works with nothing else in the config:

- **Dev-server preset** — `npm/vite-dev-server/src/helpers/angularHandler.ts`: resolves `@analogjs/vite-plugin-angular` from the user's project (clear error naming the required installs), reads `angular.json` (defaultProject/first application + `development` configuration merge, same semantics as the webpack handler), generates a tsconfig into `tmpdir/cypress-angular-ct/<hash>` covering specs/support/sources, and injects `angular.json` global styles via a `cypress:angular-global-styles` virtual module + `transformIndexHtml`. `resolveConfig.ts` no longer requires a vite config file for Angular; the preset merges under any user `viteConfig`, so user config wins. `cli/types/cypress.d.ts` allows `framework: 'angular'` on the vite union member.
- **Setup wizard** — `@packages/scaffold-config`: Angular advertises `supportedBundlers: ['webpack', 'vite']` (the launchpad bundler dropdown appears automatically); `dependencies(bundler)` is bundler-aware — webpack keeps today's list, vite scaffolds `vite`, `@analogjs/vite-plugin-angular`, `@angular/cli`, `@angular/build`, `@angular/core`, `@angular/common`, `@angular/platform-browser`; a new optional `detectBundler?(projectPath)` hook on the framework definition infers the bundler for multi-bundler templates, and `initializeFramework` preselects it.
- **`ng add @cypress/schematic`** — `getComponentBundler(tree)` applies the same inference to the scaffolded `cypress.config.ts` (`bundler: '<%= bundler %>'`), and the vite path adds `vite` + `@analogjs/vite-plugin-angular` as devDependencies before the install task runs. The schematic's builder half (`ng e2e`/`cypress-run`/`cypress-open`) needs no changes — it schedules `devServerTarget` through Architect by name, agnostic to which dev-server builder backs it.

### Decisions

- **Bundler inference**: devkit installed → `webpack`; else `@angular/build` → `vite`; else `webpack`. Devkit-first is load-bearing — everyone who applied the #30903 workaround has both packages installed and must keep webpack until they opt in. The flex resolves once at detection/scaffold time; the config's `bundler` stays the runtime source of truth (no `node_modules` sniffing at run time).
- **Signal is package presence, not `angular.json`'s `builder` field**: devkit 17+ re-exports the esbuild pipeline, so devkit-installed projects on the `application` builder are served over webpack today — and keep being served over webpack. Reading `architect.build.builder` instead would flip the workaround population to vite; it remains a possible v2 refinement (the schematic holds `angular.json` and could use it).
- **`@analogjs/vite-plugin-angular` is a scaffolding dependency**, the same model as `vite`/`webpack` themselves: the wizard and `ng add` install it into the user's project; `@cypress/vite-dev-server` resolves it from `projectRoot` with no dependency/peer declaration of its own.

### Verification

- Dev-mode Cypress on this branch against `spike-app` (Angular 21 zoneless, Vite 8.2, v16 `cypress/angular` adapter, **no** devkit / zone.js / `@angular/platform-browser-dynamic` installed): **2/2 passing**, including a computed-style assertion proving the global-styles virtual module loads through the Cypress proxy.
- Unit suites: vite-dev-server 65/65 (10 new), scaffold-config 58/58 (3 new inference cases), data-context wizard 8/8 (2 new `packagesToInstall` cases), schematic ng-add 8/8 (4 new); lint, check-ts, and cli dtslint clean across the touched packages.
- Live `detectFramework(spike-app)` → `angular` + `vite` with every dependency satisfied; wizard flow and open-mode HMR confirmed working in the launchpad.
- Both architectures were also proven standalone against the app before implementation: driving `buildApplicationInternal` from a fabricated `BuilderContext` yields servable in-memory AOT artifacts (Option 2), and the Analog plugin compiles components with external templates/styles through a bare `vite.createServer` with no `vite.config` or `angular.json` involvement (Option 1).
- The v16 base removes the last released-version blocker: `cypress/angular` there is the merged zoneless adapter on `@angular/platform-browser/testing`, so #33006's deprecated-package requirement is gone. (On released Cypress 15.x the same architecture passes with an inline `viteConfig`, a hand-written tsconfig, and `@angular/platform-browser-dynamic` installed — the shape of a workaround comment for #30903.)

## Remaining work / open questions

- **JIT/AOT decision for the vite path.** Today's webpack CT forces `aot: false`: the JIT compiler ships to the browser and compiles templates at runtime. The vite path is AOT by default (like `ng serve`, prod, Storybook, and Angular's vitest builder) — plain `cy.mount(Component)` is unaffected, but anything that compiles a template **string at runtime** breaks with "JIT compiler unavailable": our string-mount overload (`cy.mount('<app-x/>')` → `TestBed.overrideTemplate`), and users' own `overrideTemplate`/`overrideComponent({ set: { template } })`. The escape hatch is one support-file line — `import '@angular/compiler'` — which coexists fine with AOT output (dev builds keep `ɵsetClassMetadata` so TestBed can re-compile; the compiler package is already in every Angular scaffold, just not loaded now that the v16 adapter uses `platform-browser/testing` instead of `platform-browser-dynamic/testing`, which pulled it in implicitly). Decide one of: (a) scaffold the angular+vite support file with the compiler import (zero drift for migrating users, always ships the JIT compiler to the test runtime); (b) scaffold without it, document the line, and improve the error to point at it; (c) expose a preset `jit: true` passthrough to Analog for whole-suite compat (matches today's semantics, diverges from prod, slower). Recommendation: AOT default + (b); pin the choice with a string-mount spec in the system-test fixture and a docs note on the string-mount overload.
- Tests to add/update before this merges: a new `angular-22-vite` system-test project wired into `component_testing_spec.ts` (exercising the preset end to end against the binary), updated launchpad `scaffold-component-testing.cy.ts` expectations (Angular now has a bundler step in the wizard), and a schematic case covering the vite scaffold in the sandbox e2e. Plus the `cli/CHANGELOG.md` entry.
- Schematic support can be split into its own issue when productizing (the schematic hunk lifts out of the commit cleanly).

## Sequencing

1. **Now**: post the validated workaround config on #30903 (no devkit anywhere in it — unblocks the compliance-blocked users on released Cypress).
2. **After v16.0 releases**: land this branch's path as the vite option alongside webpack (webpack stays default for devkit projects) in a 16.x minor — it is additive (new framework+bundler combo, new wizard option, no behavior change for existing configs), so it does not need to ride the major. The branch is based on `release/16.0.0` today only to build against the v16 world (Vite-8-only dev server, merged `cypress/angular` adapter); once v16 ships it rebases onto `develop`, plus the remaining-work list above.
3. **Background**: file the pluggable-runner ask upstream; keep Option 2's prototype as the hedge.

## Artifacts

- `spike-app` (scratchpad, not part of this branch): Angular 21 app running CT through this branch.
- Research inputs: [cypress#30903](https://github.com/cypress-io/cypress/issues/30903), [angular-cli#31931](https://github.com/angular/angular-cli/issues/31931), [angular-cli#27951](https://github.com/angular/angular-cli/issues/27951) (vite-plugin rejection), [storybook#34012](https://github.com/storybookjs/storybook/issues/34012) (`@storybook/angular-vite` tracking), Analog `vite-plugin-angular` source, `@angular/build@21.2.20` internals (`builders/unit-test/runners/vitest/*`, `builders/dev-server/vite/*`).
