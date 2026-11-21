# @packages/eslint-config

A monorepo-wide ESLint flat-config package providing standardised linting rules across JavaScript, TypeScript, React, Vue, and Cypress test files. Consumed by most other packages in the `packages/` workspace as their ESLint configuration base.

## Key Commands

```bash
# Lint the package itself
yarn workspace @packages/eslint-config lint
```

## Architecture

```
src/
  baseConfig.ts         Core flat-config with TypeScript, import, and stylistic rules
  cliOverrides.ts       Overrides applied for CLI/Node.js contexts
  compatConfig.ts       Opt-in browser-API compatibility checks (eslint-plugin-compat) for the browser bundles' shipped source
  eslint-plugin-mocha.d.ts
                        Ambient types for eslint-plugin-mocha, which `node` resolution can't find (see Dependency pins)
  frontendOverrides.ts  Rules shared by app, launchpad and frontend-shared, such as type-only imports from data-context in .vue files
  graphqlConfig.ts      `graphqlConfig()`: opt-in linting of `gql` templates against data-context's schema, for app, launchpad, frontend-shared and data-context. Requires graphqlBlocks on call
  graphqlBlocks.ts      The blocks and processors behind `graphqlConfig()`, built on @graphql-eslint/eslint-plugin. Never import it statically: that loads the plugin for every consumer
  jsonConfig.ts         Opt-in JSON linting (eslint-plugin-jsonc, eslint-plugin-package-json), including package.json ordering
  mochaConfig.ts        eslint-plugin-mocha's rules, which `baseConfig` applies to Cypress specs and mocha workspaces add for their Node-side suites
  nodeConfig.ts         Opt-in Node runtime-floor and dependency checks (eslint-plugin-n) for Node-side workspaces, plus `userNodeConfig` for code on the user's Node
  reactConfig.ts        `reactConfig(files)`: opt-in React rules (@eslint-react/eslint-plugin), scoped to the React files given. Requires the plugin on call
  regexpConfig.ts       Opt-in regular expression checks (eslint-plugin-regexp) for every workspace's JS, TS and .vue scripts
  typeAwareConfig.ts    `noFloatingPromisesConfig(files)`: opt-in `@typescript-eslint/no-floating-promises` with a project service, scoped to the files given
  vitestConfig.ts       Opt-in linting of Vitest specs (@vitest/eslint-plugin), for workspaces whose unit tests run on Vitest
  rules/                Cypress-authored rules, registered under the `@cypress/dev` namespace
  index.ts              Main entry: composes and exports the full flat-config array
```

## Gotchas / Notes

- Uses ESLint **flat config** format (`eslint.config.*`). Targets ESLint v10.14+ as a peer dependency. ESLint 10 still loads `eslint.config.ts` through jiti: its native TypeScript config loading is behind an unstable flag and fails on the repo's extensionless imports.
- There is no `test` script — the config is validated implicitly by running `lint` across consumer packages.
- Fill gaps in the config with off-the-shelf rules. Don't hand-write a rule for a cosmetic gap that no existing rule covers; record the gap in this file instead (see [Known gaps](#known-gaps)).
- Prefer adding an override here over repeating it in several packages. A rule only one package needs goes in that package's `eslint.config.ts`, after the shared configs.
- Flat config replaces a rule's options rather than merging them. A package that redefines a rule already set here drops the shared options, so extend the shared block instead. `frontendOverrides`'s `no-restricted-imports` is the usual case.
- `baseConfig`, `jsonConfig` and the other blocks are named exports; `src/index.ts` has no default export.
- Test files lint unused expressions with `chai-friendly/no-unused-expressions` instead of `@typescript-eslint/no-unused-expressions`, so chai property assertions like `expect(x).to.be.true` pass. Test code outside the shared test globs (`test/`, `cypress/`, `*.spec.*`, `*.cy.*`) opts in with `chaiFriendlyConfig([...globs])` after `baseConfig`, as `scripts` and `system-tests` do. A disable comment in a test file has to name the `chai-friendly` rule.
- The repo root has its own `eslint.config.ts`, which lints only repo-root files and ignores every subdirectory except the top level of `.claude/` and `.cursor/`, whose settings files belong to no workspace. Each workspace lints itself. `lerna run lint` only reaches workspaces, so the root `lint` and `lint:fix` scripts run `lint:root` first, which is how CI's `linux-lint` job covers the root files.

## Adding a workspace

A new workspace lints itself with its own config:

1. Create `eslint.config.ts` at the workspace root, spreading `baseConfig`, then `regexpConfig` (see [`regexpConfig`](#regexpconfig)), then `jsonConfig` to lint JSON, then `nodeConfig` unless the workspace is a browser bundle (see [`nodeConfig`](#nodeconfig)), or `compatConfig` if it is one that ships to the supported browsers (see [`compatConfig`](#compatconfig)), `vitestConfig` if its unit tests run on Vitest, and `mochaConfig` narrowed to its specs if they run on mocha (see [`mochaConfig`](#mochaconfig)):

   ```ts
   import { baseConfig, jsonConfig, nodeConfig, regexpConfig, vitestConfig } from '@packages/eslint-config'

   export default [
     ...baseConfig,
     ...regexpConfig,
     ...jsonConfig,
     ...nodeConfig,
     ...vitestConfig,
   ]
   ```

2. Add `@packages/eslint-config` (`0.0.0-development`), `eslint` (`^10.14.0`) and `jiti` (`^2.4.2`) to `devDependencies`, and set the `lint` script to plain `eslint`, which finds the config and file extensions itself. ESLint loads `eslint.config.ts` through jiti at runtime, so no source file imports it. Declaring it keeps Yarn from resolving an older hoisted copy, which fails with `You are using an outdated version of the 'jiti' library`. Knip treats jiti as config infrastructure, so `yarn health-check` does not flag it.
3. Add a `lint-staged` key to its `package.json`: `"**/*.{js,jsx,ts,tsx,json}": "eslint --fix"`, plus `vue` for a Vue package. Drop `json` if the workspace leaves out `jsonConfig`, or staged `.json` files only produce a "File ignored" warning. lint-staged hands each staged file to the nearest `package.json` with a `lint-staged` key. Without one, the workspace's files fall through to the root config, which reports them as `File ignored because of a matching ignore pattern` and lints nothing. `scripts/unit/lint-staged-spec.ts` fails if a workspace with an `eslint.config.*` has no `lint-staged` key.
4. Add the workspace to the `--scope` list of the root `lint:fix` script.

If the parser reports a file `was not found by the project service`, add the file to the workspace's `tsconfig.json` `include` (or `cypress/tsconfig.json` for Cypress specs), or set `parserOptions.allowDefaultProject` for those files in the workspace's config.

## Ignores

The `ignores` block in `baseConfig.ts` holds build output (`cjs/`, `esm/`, `dist/`) for every consumer, so don't repeat it per package. Its globs are package-relative because each workspace lints from its own directory: a new emitter is covered as soon as it uses one of those directory names at its root, while output nested deeper, or under another name, needs its own pattern. The globs are anchored (`esm/**/*`, not `**/esm/**`) because system-tests fixtures ship handwritten sources under `esm/` directories, which an unanchored pattern would silently stop linting.

Flat config does not read `.eslintignore`. An ignore only one package needs is an `ignores` entry in that package's `eslint.config.ts`.

## `jsonConfig`

`baseConfig` matches no `.json` files, so a package lints JSON only when it spreads `jsonConfig` after `baseConfig`. `jsonConfig` relies on the `@stylistic` plugin and the `@stylistic/eol-last` rule that `baseConfig` brings. `@packages/errors` is the reference opt-in.

It is built on `eslint-plugin-jsonc` and `eslint-plugin-package-json`, and every rule autofixes:

- Files must parse as strict JSON (`jsonc/recommended-with-json`: no comments, trailing commas or duplicate keys), laid out as `JSON.stringify(value, null, 2)` with a final newline.
- `package.json` top-level keys follow `sort-package-json`'s standard order. `scripts` and the dependency maps are sorted, with `pre`/`post` hooks and `name:variant` scripts kept next to their base script. `exports` is not sorted, because the order of its conditions is significant.
- `tsconfig*.json`, `.vscode/**` and `package-lock.json` are skipped: the first two are JSONC and the last is generated.

The first `eslint --fix` after a package opts in reorders its `package.json` top-level keys. That diff is expected.

`jsonConfig` takes only the rules from `eslint-plugin-jsonc`'s `recommended-with-json`, merged across the preset's blocks. Spreading the preset would add its own `files` globs, which make ESLint lint `tsconfig*.json` and `.vscode/**` regardless of the `ignores` above. `eslint-plugin-jsonc`, `eslint-plugin-package-json` and `jsonc-eslint-parser` share one `jsonc-eslint-parser` major, so move them together. The plugin no longer re-exports the parser, so `jsonConfig` imports it directly.

`eslint-plugin-package-json` lists `@eslint/json` as an optional peer, which `jsonConfig` doesn't install. `@eslint/json` doesn't fit: it is a separate ESLint language, so every `baseConfig` rule without a `files` glob would need fencing off, it has no formatting rules, and its `sort-keys` can't express the `package.json` order.

## `nodeConfig`

`nodeConfig` checks the [runtime floors](../../AGENTS.md#runtime-targets) and declared dependencies of Node-side code. Spread it after `baseConfig` and `jsonConfig`. It is built on `eslint-plugin-n` and turns on:

- `n/no-unsupported-features/node-builtins`, `n/no-unsupported-features/es-builtins` and `n/no-unsupported-features/es-syntax`: no Node API, built-in or syntax newer than the floor. They are off for `.d.ts` files, which emit no runtime code and whose DOM globals, such as `Storage`, the rules would read as Node's.
- `n/no-extraneous-import` and `n/no-extraneous-require`: every package a file imports is declared in the nearest `package.json`. Declare a missing package rather than disabling the rule, and declare a sibling workspace the way the repo already does, as `"0.0.0-development"` in `devDependencies`. Never declare one that would close a dependency cycle: nx breaks a cycle by dropping one of its edges, and the next fresh `lerna run build` can then compile a package before one it imports (`https-proxy` built before `network` is the case that caught this). Spread `undeclaredWorkspaceImports(files, workspaces)` after `nodeConfig` instead, scoped to the files that import it. To check for a cycle, follow the other workspace's own dependencies back to yours. Use a hoisted package's existing version range so the lockfile doesn't resolve a second copy. A `require.resolve` that deliberately finds a package through another one, such as the user's project or `playwright-webkit`, gets an `eslint-disable-next-line` with the reason.

`nodeConfig` also declares `globals.node`. The plugin only checks a global such as `process` or `Buffer` that resolves in scope, so without them a workspace that never declared Node globals, like `cli`, would skip every global-based check silently.

`n/no-extraneous-*` also skips imports it can't resolve, which includes every workspace whose `main` points at build output that isn't built yet. Run `yarn lint` on a built tree, as CI does, or those hits stay hidden.

The floor is set in `settings.n.version`, not read from each workspace's `engines`, because most workspaces declare none. `nodeConfig.ts` reads both floors from the files that own them:

- **Bundled floor** (the default): `>=` the version in `.node-version`. Dev tooling runs on it, and the Electron main process runs on Electron's embedded Node, which for the pinned Electron is the same version. If an Electron bump ever leaves its Node below `.node-version`, lower this floor to it.
- **User floor**: `engines.node` from `cli/package.json`. Spread `userNodeConfig` after `nodeConfig`, scoped with `files`, for code that runs on the user's Node. `cli` applies it to everything but `test/**`, whose specs CI runs on the dev Node. `server` applies it to `lib/plugins/child/**`, the config child process. Modules the child imports from outside that directory are still checked against the bundled floor.

Every workspace opts in except the browser bundles, whose floor is the supported browsers rather than a Node version: `app`, `launchpad`, `frontend-shared`, `driver`, `reporter`, `runner`, `extension` and `example`, and the mount adapters `npm/react`, `npm/vue`, `npm/angular`, `npm/svelte` and `npm/mount-utils`. A Node package that also ships browser code keeps `nodeConfig` off those files by adding them to each block's `ignores`. Otherwise they would get Node globals, which stops `no-undef` from catching Node-only names in browser JS, and the Node floor. The browser files are `vite-dev-server`'s and `vite-plugin-cypress-esm`'s `client/**`, and `webpack-dev-server`'s `src/browser.ts` and `src/aut-runner.ts`. `system-tests` uses the same pattern to keep it out of `projects/**` and `project-fixtures/**`: fixtures are user projects with their own dependencies, and `n/no-extraneous-import` crashes resolving their `tsconfig.json` files.

`n/no-process-exit` is left off: almost all of its hits are CLIs and scripts that exit on purpose. The plugin's optional `ts-declaration-location` peer is only needed by `n/no-sync`, which isn't enabled.

`nodeConfig.ts` loads the plugin with `require` rather than `import`. Its types export a string-named `"module.exports"`, which TypeScript only parses from 5.6 and import-x's parser not at all. An `import` fails `check-ts` in every workspace whose `tsconfig` takes in its `eslint.config.ts`.

## `compatConfig`

`compatConfig` checks the browser bundles against the browser [runtime floor](../../AGENTS.md#runtime-targets), the counterpart of `nodeConfig` for code that ships to the browser. Spread it after `baseConfig` and `jsonConfig`. It is built on `eslint-plugin-compat` and turns on `compat/compat`, which reports a browser or ES API that one of the target browsers lacks.

- **Targets** come from `browser-bundles.browserslistrc` at the repo root, through `settings.browserslistOpts.config`. The file's name keeps browserslist from discovering it: any `.browserslistrc`, `browserslist` file or `browserslist` key in a `package.json` above a build switches webpack's default target from `web` to `browserslist`, which breaks `@packages/extension`'s build, and changes the output of the `autoprefixer: {}` PostCSS configs in app, launchpad, frontend-shared and reporter. Read the file by path from anything else that needs the floor. A missing file fails the lint run instead of falling back to browserslist's defaults. A `BROWSERSLIST` environment variable takes precedence over the file, so unset it before trusting a clean run.
- **Files**: shipped source only, `src/**` and `injection/**`, minus `*.cy.*`, `*.spec.*`, `*.test.*` and `.d.ts`. Specs run in whatever browser Cypress launches for them, so the floor doesn't apply. A workspace with shipped entry points outside those directories adds them when it spreads the config, as `runner` does for `unified-runner.tsx` and `driver` for `index.ts`:

  ```ts
  ...compatConfig.map((block) => ({ ...block, files: [...(block.files ?? []), 'unified-runner.tsx'] })),
  ```
- **`lintAllEsApis`** is on, so ES built-ins are checked as well as web APIs. The plugin would otherwise skip them in any directory with a babel config.

The bundlers don't read the file yet. Their targets are set separately in `packages/web-config/webpack.config.base.ts` (`preset-env` at `chrome: 64`), app's `vite.config.mjs` (`build.target: 'ES2022'`, plugin-legacy at `last 3 major versions`), and the PostCSS configs (browserslist's defaults). Moving them onto this file would change shipped output, so it is a change of its own.

Opted in: `driver`, `app`, `frontend-shared`, `reporter` and `runner`. Not opted in:

- `launchpad` only renders in Electron's own window, so its floor is the pinned Electron's Chromium, not the supported browsers. The components it shares with `app` are checked through `frontend-shared`.
- `extension` only ever loads in Chrome and Firefox, so the Safari part of the floor doesn't apply to it.
- `example` is generated from `cypress-example-kitchensink`, where it would have to be fixed.
- The mount adapters (`npm/react`, `npm/vue`, `npm/angular`, `npm/svelte`, `npm/mount-utils`) and the browser files of `vite-dev-server`, `vite-plugin-cypress-esm` and `webpack-dev-server` also run on the floor but haven't been opted in yet.

**The check has coverage gaps, so it doesn't replace verifying a new API on caniuse or MDN.** A clean run only means the plugin knows of no problem:

- Its ES built-ins come from an old `@mdn/browser-compat-data` snapshot (through `ast-metadata-inferer`), so newer ones such as `Promise.withResolvers`, `Promise.try`, `Map.groupBy`, `Iterator.from` and `Set.prototype.union` are never reported, even below the version that added them.
- Some web APIs are missing too: `window.showOpenFilePicker()` passes, though Safari and Firefox lack it.
- It checks API calls, not syntax, and treats an API behind a feature check (`if ('getBattery' in navigator)`) as guarded.

A hit that is intentional, such as an API used only behind a feature check the plugin doesn't recognise, takes `// eslint-disable-next-line compat/compat -- <reason>`.

## `regexpConfig`

`regexpConfig` applies `eslint-plugin-regexp`'s `recommended` rules to every `.js`, `.jsx`, `.mjs`, `.cjs`, `.ts`, `.tsx`, `.mts`, `.cts` and `.vue` file a workspace lints. Spread it after `baseConfig`. It reports regexes that are wrong, slower than they need to be, or written in a longer form than necessary:

- **Mistakes**: alternatives or character class members that duplicate each other, assertions that can never match, backreferences that can be empty, obscure ranges such as `A-z`, and flags that change nothing (a `g` on a regex passed to `split`).
- **Run time**: `regexp/no-super-linear-backtracking` reports quantifiers that can trade characters with each other, which makes matching polynomial or exponential on crafted input. Treat a hit as a real bug when the regex runs on user, network or file content.
- **Capturing groups**: `regexp/no-unused-capturing-group` reports a group nothing reads; make it non-capturing (`(?:…)`). The rule follows match results it can see, so check by hand that no caller reads the group by index before converting one whose result leaves the function. `regexp/no-misleading-capturing-group` reports a group that captures less than its pattern suggests, because a neighbouring quantifier takes the characters first.
- **Style**, all autofixed: `\d` over `[0-9]`, `\w` over its class, `i` over `[aA]`, sorted flags, and no redundant classes, groups or lazy quantifiers.

The preset also turns on the core rules `no-control-regex`, `no-misleading-character-class`, `no-regex-spaces` and `prefer-regex-literals`, and turns off `no-invalid-regexp`, `no-useless-backreference` and `no-empty-character-class`, whose `regexp/` counterparts cover the same ground.

A hit that is intentional takes `// eslint-disable-next-line <rule> -- <reason>`.

Every workspace opts in. Not covered:

- The repo root's `eslint.config.ts`, which lints only the config and tool files at the top of the repo.
- `packages/proxy`'s `lib/http/util/regex-rewriter.ts` and `lib/http/util/rewriter.ts`. They rewrite every script the proxy serves, so changes to their regexes are reviewed on their own against the rewriter's specs, and `proxy` passes them in the block's `ignores`.

`eslint-plugin-regexp` is ESM-only and needs ESLint 9.38 or later.

## `noFloatingPromisesConfig`

`noFloatingPromisesConfig(files)` turns on `@typescript-eslint/no-floating-promises` for `files`: a promise must be awaited, returned, or given a rejection handler (`.catch()`, or `.then()` with two arguments), so a rejection can't go unobserved. It returns a single block, not an array, so add it after `baseConfig` and the workspace's `tsconfigRootDir` block without spreading it:

```ts
noFloatingPromisesConfig(['lib/**/*.ts']),
```

The rule needs type information, so the block also gives `files` a project service. Type-aware parsing is what makes lint slower, so pass only the TypeScript source the rule is meant for, never the whole workspace. Every file in `files` must be in the workspace's `tsconfig.json`, or the parser reports it `was not found by the project service` (see [Adding a workspace](#adding-a-workspace)).

The block also turns off `vue/no-ref-as-operand`, which `baseConfig` applies to every `.ts` file. Once a file has type information, that rule asks the type checker whether each operand is a Vue `Ref`, which slows lint in workspaces with no Vue code. Don't add the block to `app`, `launchpad` or `frontend-shared`, whose composables need the rule.

Fix a hit by awaiting, returning or handling the promise. Use `void` only for fire-and-forget, with a comment saying why it can't reject or what happens if it does.

These workspaces opt in, for their shipped source only:

- `server`, `proxy`, `net-stubbing`, `https-proxy`, `socket`, `resolve-dist`: `lib/**/*.ts`
- `network`: `lib/*.ts`, matching its `tsconfig.json`
- `launcher`: `index.ts` and `lib/**/*.ts`
- `driver`: `index.ts` and `src/**/*.ts`
- `data-context`: `src/**/*.ts` and `graphql/**/*.ts`
- `scaffold-config`: `src/**/*.ts`
- `config`: `src/**/*.ts` and `test/**/*.ts`
- `reporter`: `src/**/*.{ts,tsx}` and `cypress/**/*.ts`
- `icons`: `index.ts` and `index.mts`

Specs are left out (`config` and `reporter` predate this and keep theirs): they commonly start a promise and assert on it later, so the hits are mostly noise, and giving them a project service would slow lint further. The other workspaces don't opt in yet; adding one means fixing its hits and measuring its lint time first.

## `reactConfig`

`reactConfig(files)` applies `@eslint-react/eslint-plugin`'s `recommended-typescript` rules to `files`. It returns a single block, so add it after `baseConfig` without spreading it:

```ts
reactConfig(['**/*.{js,jsx,ts,tsx}']),
```

The rules are opt-in because the Vue packages write components in Vue JSX, which React rules misread: `class`, for example, is reported as an unknown property. Nothing in `app`, `launchpad` or `frontend-shared` needs to turn them off. `reactConfig` requires the plugin when it is called rather than importing it, so the workspaces that don't opt in start ESLint without loading it. The plugin is ESM-only and its `exports` map has only an `import` condition, so Node's own `require` refuses it with `ERR_PACKAGE_PATH_NOT_EXPORTED`: the call works because ESLint loads `eslint.config.ts` through jiti, whose `require` resolves ESM. A loader other than jiti needs the plugin imported instead.

These opt in:

- `npm/react` and `reporter`: every file.
- `runner`: `unified-runner.tsx`.
- `vite-plugin-cypress-esm`: its component tests, `cypress/**/*.tsx`.
- `webpack-batteries-included-preprocessor`: the JSX fixtures under `test/fixtures`.
- `system-tests`: the `.jsx` and `.tsx` files under `projects/**` and `project-fixtures/**`, all of which belong to React or Next.js projects, plus the `.js` files of the Next.js projects (`project-fixtures/next` and `projects/nextjs-*`), whose pages are JSX. A new Next.js fixture that writes JSX in `.js` files needs adding to that list. `dom-no-render` is off there: some fixtures mount with the legacy `ReactDOM.render`, which React 18 still runs, the way apps written before `createRoot` do. Any layout rule the React plugin brings is off for them too, like `baseConfig`'s for every fixture, because system-test snapshots assert on line and column numbers. It brings none today; the switch-off covers a later version that adds one.

A workspace with new React files opts them in the same way. `data-context`'s React scaffold fixtures under `test/unit` are the exception: its config ignores them, because its specs assert on how those inputs are written.

On top of `recommended-typescript`:

- `settings['react-x'].version` is `'18'`. `@cypress/react` supports React 18, so the rules that steer toward React 19 APIs (`no-forward-ref`, `no-context-provider`, `no-use-context`) stay quiet. Raise it only once React 18 support is dropped.
- Every rule it enables is an error, including the many `recommended` makes warnings: lint scripts don't pass `--max-warnings 0`, so a warning never fails `yarn lint` and would go unfixed.
- `dom-no-unknown-property`, `dom-no-unsafe-target-blank` and `no-missing-component-display-name` are on, though not in `recommended`. Give a component the last one reports, such as one wrapped in `forwardRef` or `observer`, a `displayName`.
- `no-array-index-key`, `set-state-in-effect`, `use-state`, `no-children-only` and `no-clone-element` are off. `reactConfig.ts` gives the reason for each.

The plugin brings its own hooks rules (`rules-of-hooks`, `exhaustive-deps`) and purity rules, so don't add `eslint-plugin-react-hooks`. An effect that runs once on mount on purpose takes `// eslint-disable-next-line @eslint-react/exhaustive-deps -- <reason>` above the line the rule reports. As with `vue/no-v-html`, a `dangerouslySetInnerHTML` that renders HTML built to be rendered takes a `@eslint-react/dom-no-dangerously-set-innerhtml` disable naming where the HTML comes from. In JSX children, write the directive as `{/* eslint-disable-next-line ... */}`.

The plugin has no counterpart for `eslint-plugin-react`'s `no-string-refs`, `no-unescaped-entities`, `no-is-mounted`, `require-render-return` or `jsx-no-duplicate-props`. The parser still rejects an unescaped `>` or `}` in JSX text, and `tsc` reports duplicate props in `.tsx` files, but a duplicate prop in a `.js` or `.jsx` file now goes unreported (see [Known gaps](#known-gaps)). `jsx-uses-vars`, `react-in-jsx-scope` and `jsx-uses-react` have no counterpart either, and need none: ESLint 10 marks variables used in JSX itself, and React 18's JSX transform doesn't need `React` in scope.

## `mochaConfig`

`mochaConfig` holds eslint-plugin-mocha's `recommended` preset (rules and the mocha globals) and this repo's settings for its rules. It applies only to files whose tests run on mocha. Vitest specs get their counterparts, such as `vitest/no-focused-tests`, from [`vitestConfig`](#vitestconfig).

- `baseConfig` spreads it for Cypress specs and support files, `**/*.cy.*` and `**/cypress/**`, in every workspace.
- A workspace whose Node-side suites run on mocha spreads it again after `baseConfig`, narrowing `files` to those suites:

  ```ts
  ...mochaConfig.map((block) => ({ ...block, files: ['test/**'] })),
  ```

  Keep any `ignores` the blocks already have, as `server` does when it leaves out its Vitest specs: `ignores: [...(block.ignores ?? []), 'test/unit/**']`.

These opt in:

- `server`: `test/**` except `test/unit/**`, which runs on Vitest.
- `system-tests`: `test/**`, `test-binary/**` and `lib/**` (the mocha harness), plus `projects/**` and `project-fixtures/**`, whose Cypress specs sit wherever each project's `specPattern` points.
- `tooling/packherd`, `tooling/v8-snapshot`, `tooling/electron-mksnapshot`: `test/**`.
- `scripts`: `unit/**`, which the root `test-scripts` script runs.
- `app`: `src/**/*.spec.*`, which its component `specPattern` includes.

A workspace whose specs move to another runner drops its opt-in. A new mocha suite outside these globs needs adding, or `mocha/no-exclusive-tests` won't see a `.only` in it.

`mocha/no-exclusive-tests` is an error. The other rule settings follow the same "gold standard, but many violations" policy as `baseConfig`'s, tracked in [#35250](https://github.com/cypress-io/cypress/issues/35250). `mocha/no-exports` applies only to spec files (`*.cy.*`, `*.spec.*`, `*_spec.*`, `*-spec.*`, `*.test.*`): the plugin treats any file with a mocha call, hooks included, as a test file, which takes in support files and test generators whose exports are their purpose.

A file outside `mochaConfig` doesn't load the plugin, so an `eslint-disable` comment naming a `mocha/` rule fails there with `Definition for rule ... was not found`.

## `vitestConfig`

Every workspace with `vitest` in its `package.json` spreads `vitestConfig` after `baseConfig`. The repo root is the exception: its `vitest.config.ts` only lists the workspace projects, and its ESLint config lints no specs. It applies `@vitest/eslint-plugin`'s `recommended` rules to `**/*.{test,spec}.{ts,tsx,js}` and `test/**`, skipping `fixtures/` and `__fixtures__/` directories. A workspace whose Vitest specs are only part of those globs narrows `files` when it spreads the config. `@packages/server`, whose `test/integration` and `test/performance` specs run on mocha, is the example:

```ts
...vitestConfig.map((block) => ({ ...block, files: ['test/unit/**'] })),
```

On top of `recommended`:

- `no-focused-tests`, `no-disabled-tests` and `hoisted-apis-on-top` are errors. A skipped test that has to stay needs an `eslint-disable-next-line vitest/no-disabled-tests` below its `NOTE:`, `TODO:` or `FIXME:` comment, which `@cypress/dev/skip-comment` already requires. An intentional `.only` needs `eslint-disable-next-line vitest/no-focused-tests`. Mocha's rules don't apply to Vitest specs (see [`mochaConfig`](#mochaconfig)), so the directive names no `mocha/` rule.
- `valid-expect` allows a second argument to `expect`, which Vitest takes as the failure message. It reports a chai property assertion such as `.to.be.true` as a matcher that was never called, so write those with a called matcher (`.toBe(true)`, `.toBeUndefined()`, `.toEqual(expect.anything())` for `.to.exist`).
- `no-standalone-expect` accepts assertions in `beforeAll`, `beforeEach`, `afterEach` and `afterAll`, where a failure fails the tests the hook belongs to.
- `expect-expect`, `no-conditional-expect`, `prefer-called-exactly-once-with`, `no-identical-title` and `valid-title` are off. `vitestConfig.ts` gives the reason for each. `no-identical-title` reports existing duplicate titles that `mocha/no-identical-title` misses, so turning it on means renaming them first.
- The block declares the globals Vitest injects under `globals: true` (`describe`, `it`, `vi` and the rest), read-only, so JS specs that use them pass `no-undef`.
- `vitest/unbound-method`, the plugin's one rule that needs type information, is not enabled.

## Vue packages

`app`, `launchpad` and `frontend-shared` spread `frontendOverrides` after `baseConfig` (and `jsonConfig`), and add `vue` to their `lint-staged` glob. Without `vue` in the glob, a staged `.vue` file matches no task and is committed unlinted. `vue-eslint-parser` 10 defines the `<script setup>` compiler macros (`defineProps`, `defineEmits`, `defineExpose`, `withDefaults`), so they need no globals.

`vue/no-v-html` is an error. Render text with `{{ }}` interpolation. Where a component renders HTML built to be rendered (markdown-it via `useMarkdown`, Shiki, `ansi-to-html` with `escapeXML: true`, bundled SVG icons), wrap it in `<!-- eslint-disable vue/no-v-html -->` / `<!-- eslint-enable vue/no-v-html -->` with a note on where the HTML comes from. A `disable-next-line` comment does not reach a `v-html` attribute on a later line of the tag.

## `graphqlConfig`

`app`, `launchpad`, `frontend-shared` and `data-context` spread `graphqlConfig()` after the shared configs and before their own blocks; no other package should. It validates every `gql` template literal against `packages/data-context/schemas/schema.graphql`. It is a function so that the plugin, graphql 16 and the Vue SFC compiler load only when it is called, and every other consumer starts ESLint without them.

The lint rules are needed even though graphql-codegen validates documents during `yarn build:graphql`:

- Codegen only sees `app`, `launchpad` and `frontend-shared`. The `data-context` documents sent through `executeRemoteGraphQL` are in no codegen `documents` glob, so a typo in one passes codegen and `check-ts` and only fails at runtime.
- Codegen does not check deprecated fields or `id` selection (`@graphql-eslint/no-deprecated`, `@graphql-eslint/require-selections` with `fieldName: 'id'`).
- Codegen reports at build time, not in the editor or at commit.

`require-selections` follows fragment spreads into other files, so `graphqlConfig` loads the `gql` documents of all four packages: `app` and `launchpad` spread fragments defined in `frontend-shared`. `unique-operation-name` and `unique-fragment-name` are not used. They compare names across the whole document set and report a `.vue` document as a duplicate of itself; codegen already rejects duplicate names within each generated file.

To silence a report, put the directive inside the template as a GraphQL comment. A `//` comment above the template does not reach the rule, because the template is linted as its own virtual file:

```ts
gql`
fragment Example on Query {
  # eslint-disable-next-line @graphql-eslint/require-selections
  currentProject {
    projectRoot
  }
}`
```

graphql-eslint's processor refuses `.vue` files under flat config, and its documented workaround would make `baseConfig` lint each `<script>` block a second time. `graphqlConfig` keeps eslint-plugin-vue's processor for the `.vue` file and extracts only `<script>` blocks that contain a `gql` template, parsed with `pad: 'space'` so positions line up. The virtual `.graphql` blocks turn off every `baseConfig` rule, since many of them have no `files` glob and would otherwise lint GraphQL as JavaScript.

### Dependency pins

- **`@eslint/js` on the same major as `eslint`.** ESLint 10 no longer depends on `@eslint/js`, so this package's range is the only copy, and its `recommended` rules must exist in the installed `eslint`. `@eslint/js` declares a peer of `eslint@^10`; move both majors together.
- **`@eslint-react/eslint-plugin` 5.** It is ESM-only, flat-config only, and needs ESLint 10, TypeScript 5 and Node 20.19. Its `@typescript-eslint/*` ranges start at the patch it was built against, so keep `typescript-eslint`, `@typescript-eslint/eslint-plugin` and `@typescript-eslint/parser` at or above that patch. Below it, the plugin resolves a second copy of `@typescript-eslint/types`, `utils` and the rest, since `typescript-eslint` pins its own subpackages exactly. Don't add `eslint-plugin-react`: its last release, 7.37.5, declares no ESLint 10 support.
- **`@typescript-eslint/no-restricted-imports`, not core.** `frontendOverrides` keeps the typescript-eslint rule, which is deprecated since 8.64, because it predates core `no-restricted-imports` accepting `allowTypeImports` (ESLint 9.37). The installed ESLint 10 has the option, so the block can move to the core rule.
- **`graphql@16`, nested.** graphql-eslint v4 needs a `graphql@^16` peer at load time (it reads the `OperationTypeNode` enum, which graphql 15 only has as a type), while the app and server stay on `graphql@15`. This package depends on `graphql@16` itself and its `workspaces.nohoist` entry keeps `@graphql-eslint/eslint-plugin` and its tree in this package's `node_modules`. Hoisted to the root, the plugin would resolve `graphql@15`. Don't remove the nohoist entry, and don't move these dependencies to the root.
- **`graphql` is left out of lockfile deduplication.** `@types/graphql-resolve-batch` depends on `graphql@>=14`, so `yarn-deduplicate --strategy=highest` would move it to graphql 16 types while `data-context` passes it graphql 15 values. `yarn dedupe-lockfile`, which `yarn check-lockfile`, the local postinstall and CI all use, passes `--exclude graphql`. A root resolution cannot fix this instead, because yarn keeps the `graphql@>=14` request in the lockfile either way.
- **`@vue/compiler-sfc@3.5`, nested.** graphql-tag-pluck v8 needs `registerTS`, added in 3.3. Against the repo's 3.2.47 it silently drops every `.vue` document. The app packages keep 3.2.47.
- **`@vitest/eslint-plugin` 1.6.** It declares peers of TypeScript 6 and `@typescript-eslint/eslint-plugin`, both optional: they only serve its type-aware rules, which `vitestConfig` leaves out, so its other rules run on the repo's TypeScript 5.4.5. Its `@typescript-eslint/utils` and `scope-manager` `^8.71` ranges share the lockfile entries of the `typescript-eslint` version above. A fresh resolve can pick a newer patch for them instead, and `yarn dedupe-lockfile` then moves other `@typescript-eslint` ranges to that patch while `typescript-eslint` keeps its exact pins, leaving two copies. Point the plugin's ranges back at the existing entry with `npx yarn-deduplicate --strategy=fewer --packages @typescript-eslint/utils @typescript-eslint/scope-manager` before running `yarn check-lockfile`. Don't use `eslint-plugin-vitest`, its archived predecessor.
- **`eslint-plugin-mocha` 12, typed through `src/eslint-plugin-mocha.d.ts`.** The plugin is ESM-only, needs `eslint` ≥ 10.2, and only exposes its types through `exports`. `@packages/ts`, `proxy`, `driver` and `cli` type-check this package's source on `node` (node10) resolution, which ignores `exports`, so `check-ts` there would fail with `Cannot find module 'eslint-plugin-mocha'`. `mochaConfig.ts` pulls in an ambient declaration with a `/// <reference path>`, which TypeScript prefers over `node_modules` under every resolution, typing the plugin as `ESLint.Plugin` with a flat `configs.recommended`. It can't be loaded with `require` the way `nodeConfig` loads `eslint-plugin-n`, because it uses top-level `await`. v12 renamed `no-global-tests` to `no-top-level-tests`, `no-setup-in-describe` to `no-setup-in-suite`, `no-top-level-hooks` to `no-root-hooks` and `no-return-and-callback` to `no-return-and-done` and `no-hooks-for-single-case` to `no-hooks-for-single-child`, and folded `no-sibling-hooks` into `consistent-structure` (`disallowDuplicateHooks`). ESLint accepts an unknown rule name set to `off` without complaint, so a rule still turned off under its old name is silently back on under its new one, from `recommended`.
- **`@graphql-tools/delegate`.** The root `**/@graphql-tools/delegate` resolution also reaches the plugin's tree, under `@graphql-tools/wrap` 11. Only `graphql-config`'s URL loader reaches that code, and the schema here is a file.

## Known gaps

- No rule reports a duplicate JSX prop, such as two `className`s, in `.js` or `.jsx` files. `eslint-plugin-react`'s `jsx-no-duplicate-props` did; `@eslint-react/eslint-plugin` has no counterpart, and TypeScript only checks `.tsx`.
- Nothing reports a committed `.only` in `data-context`'s Jest specs. They import `describe`, `it` and `test` from `@jest/globals`, which `mocha/no-exclusive-tests` doesn't recognise, and no Jest lint plugin is installed.
- Vitest specs get no check for duplicate test titles, exported helpers, nested tests or empty titles. `vitest/no-identical-title` covers the first once the existing duplicates are renamed; `@vitest/eslint-plugin` has no counterpart for `mocha/no-exports` or `mocha/no-nested-tests`, and `vitest/valid-title`, which reports empty titles, is off.
- `jsonConfig` does not collapse `{ }` to `{}`. `jsonc/object-curly-spacing` skips empty objects, and no off-the-shelf rule covers them.
