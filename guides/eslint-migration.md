# ESLint Migration Guide: Monorepo Alignment

## Migration Checklist

### Batch 1: Small npm utilities
- [x] npm/grep ✅ **COMPLETED** 
- [x] npm/puppeteer ✅ **COMPLETED** 
- [x] npm/mount-utils ✅ **COMPLETED** 
- [x] npm/cypress-schematic ✅ **COMPLETED** 

### Batch 2: Framework adapters
- [x] npm/react ✅ **COMPLETED**
- [x] npm/vue ✅ **COMPLETED**
- [x] npm/svelte ✅ **COMPLETED**
- [x] npm/angular ✅ **COMPLETED**

### Batch 3: Build-related
- [x] npm/webpack-batteries-included-preprocessor
- [x] npm/webpack-preprocessor
- [x] npm/webpack-dev-server
- [x] npm/vite-plugin-cypress-esm
- [x] npm/vite-dev-server

### Batch 4a: Core packages (part 1)
- [ ] packages/frontend-shared
- [x] packages/icons
- [x] packages/launcher
- [x] packages/https-proxy
- [x] packages/network-interception
- [x] packages/proxy
- [x] packages/net-stubbing
- [x] packages/driver
- [x] packages/reporter
- [x] packages/server

### Batch 4b: Core packages (part 2)
- [x] packages/runner
- [x] packages/extension
- [x] packages/network
- [x] packages/network-tools
- [x] packages/socket
- [x] packages/telemetry
- [ ] packages/launchpad
- [x] packages/errors
- [ ] packages/data-context
- [ ] packages/app

### Batch 4c: Core packages (part 3)
- [x] cli
- [x] packages/agent-info ✅ **COMPLETED**
- [x] packages/cypress-sessions ✅ **COMPLETED**
- [x] packages/electron ✅ **COMPLETED**
- [x] packages/eslint-config ✅ **COMPLETED** — the shared config lints itself
- [x] packages/stderr-filtering ✅ **COMPLETED**
- [x] packages/config
- [x] packages/root
- [x] packages/resolve-dist
- [x] packages/packherd-require
- [x] packages/v8-snapshot-require
- [x] packages/web-config
- [x] packages/types
- [x] packages/scaffold-config
- [x] packages/ts
- [x] packages/example

### Batch 4d: Tooling
- [x] tooling/electron-mksnapshot
- [x] tooling/packherd
- [x] tooling/v8-snapshot

### Batch 5: Test and script folders
- [x] system-tests (`lib/`, `test/`, `scripts/`, `test-binary/`) — `projects/` and `project-fixtures/` are ignored until they get their own config
- [ ] scripts

---

This guide describes how to migrate all packages in the Cypress monorepo to the new unified ESLint configuration (`@packages/eslint-config`).

---

## Why Migrate?
- **Consistency:** Enforce the same linting rules and plugins across all packages.
- **Simplicity:** Remove the need for custom plugins like `@cypress/eslint-plugin-dev`.
- **Maintainability:** Make it easier to update and maintain lint rules.
- **Modernization:** Replace obsolete TSLint with the appropriate ESLint TypeScript plugin (`@typescript-eslint`).

---

## Migration Strategy

### 1. **Lint-Staged Configuration**
lint-staged hands each staged file to the nearest `package.json` that has a `lint-staged` key, and runs that config's tasks from its directory. Routing is therefore per package, not in the root:

- **Migrated packages** carry their own `lint-staged` key (step 4 below), so their files run `eslint --fix` from the package directory, resolving the package's local ESLint 9 and its `eslint.config.ts`.
- **Everything else** falls through to the root `package.json`, whose single `*.{js,jsx,ts,tsx,json,eslintrc,vue}` pattern runs ESLint 8 with the root `.eslintrc.js`. A pattern without a `/` matches at any depth, so it covers every directory on its own; adding directory-specific patterns beside it would lint those files twice.

Migrating a package needs no change to the root config. `scripts/unit/lint-staged-spec.ts` fails if a workspace with an `eslint.config.*` has no `lint-staged` key. Add the package to the `--scope` list of the root `lint:fix` script too.

### 2. **Batch Packages for Migration**
- **Batch by directory/type** to keep PRs manageable and reduce risk.
- **Batch size:** 4–8 packages per PR, grouped by similarity.

### 2. **Migration Steps for Each Package**

For each package in the batch:

1. **Remove old ESLint config and plugin references:**
   - Delete `.eslintrc`, `.eslintrc.json`, or `.eslintrc.js` in the package.
   - Delete `.eslintignore` — flat config does not read it. Anything in it that is still needed becomes an `ignores` entry in `eslint.config.ts`.
   - Remove any references to `@cypress/eslint-plugin-dev` in `package.json` (if present).
   - **Remove TSLint configs:** Delete `tslint.json` and remove `tslint` dependencies from `package.json`.
   - **Drop the `tslint` script** and its call from `check-ts`. `packages/ts/tslint.json` enforces `no-empty` for JS, which `baseConfig` already has, and `no-floating-promises`, which `baseConfig` does not run because it is type-aware. Port it by enabling `projectService` and `@typescript-eslint/no-floating-promises` for the files `check-ts` linted, as `packages/scaffold-config` does.
2. **Add a new ESLint config file:**
   - Create `eslint.config.ts` in the package root:
     ```ts
     import { baseConfig, jsonConfig } from '@packages/eslint-config'

     export default [
       ...baseConfig,
       ...jsonConfig,
     ]
     ```
   - `jsonConfig` keeps the package's JSON files linted, as described in [Lint JSON with `jsonConfig`](#7-lint-json-with-jsonconfig). A package that leaves it out exports `baseConfig` alone.
3. **Ensure dependencies are up to date:**
   - Remove any package-local ESLint plugins now provided by the shared config.
   - Remove TSLint-related dependencies (the new config includes `@typescript-eslint`).
   - **Add the shared ESLint config as a dev dependency:**
     - In each migrated package, add `@packages/eslint-config` to `devDependencies` (use a relative file path if not published to npm).
   - **Add ESLint as a dev dependency:**
     - Since `@packages/eslint-config` has ESLint as a peer dependency, add `eslint: "^9.31.0"` to `devDependencies`.
4. **Add lint-staged configuration:**
   - Add a `lint-staged` section to the package's `package.json`:
     ```json
     {
       "lint-staged": {
         "**/*.{js,jsx,ts,tsx,json}": "eslint --fix"
       }
     }
     ```
   - This ensures that when files are staged for commit, they are automatically linted and fixed using the package's local ESLint configuration.
   - Drop `json` from the glob if the package leaves out `jsonConfig`; otherwise staged `.json` files just produce a "File ignored" warning.
5. **Run lint and autofix:**
   - From the package root, run:
     ```
     npx eslint . --ext .js,.ts,.tsx,.jsx --fix
     ```
   - Manually fix any remaining lint errors.
6. **Verify TypeScript configuration:**
   - Ensure the package has a valid `tsconfig.json` that works with the new ESLint config.
   - Run `npx tsc --noEmit` to check for TypeScript compilation errors.
   - Verify that the new ESLint config can properly parse TypeScript files in the package.
7. **Run tests for the package** to ensure nothing broke.
8. **Commit changes** with a clear message, e.g.:
   ```
   chore(npm/grep): migrate to @packages/eslint-config and remove legacy eslint-plugin-dev
   ```

### 4. **Open a PR for Each Batch**
- Keep each migration PR focused (one batch per PR).
- List all affected packages in the PR description.
- Include a checklist for each package:
  - [ ] Removed old ESLint config
  - [ ] Added new config
  - [ ] Added lint-staged configuration
  - [ ] Ran lint and fixed errors
  - [ ] Ran tests

### 5. **Document Issues or Gaps**
- If you hit any missing rules or plugin gaps, note them for follow-up.
- If a package needs a custom override, add it in a local `eslint.config.ts` (prefer to upstream to the shared config if possible).

### 6. **Ignore Build Output Centrally**

Compiled output (`cjs/`, `esm/`, `dist/`) is ignored centrally, in both config homes, and neither list should be duplicated per package:

- root `.eslintrc.js` `ignorePatterns` — for the packages still on eslintrc
- `packages/eslint-config/src/baseConfig.ts` `ignores` — for the migrated ones

A package-level `.eslintignore` cannot do this job, which is worth knowing before reaching for one. ESLint 8 merges every ignore source into a single predicate based at the *common ancestor* of their base paths, and the root `.eslintrc.js` `ignorePatterns` pulls that ancestor up to the repo root. Entries from an `.eslintignore` are flagged `loose`, so they are re-based without being re-prefixed: a package-relative entry keeps its spelling and is then matched against the repo root. Anything containing a `/` is anchored there and silently matches nothing — `packages/resolve-dist/.eslintignore` listed `cjs/index.js` and ESLint linted the file anyway, failing `linux-lint` on develop. Only unanchored spellings survive the re-base:

| Pattern | Result |
| --- | --- |
| `**/tsconfig.json` | matches at any depth |
| `cjs/` | matches at any depth (a trailing slash is not an anchor) |
| `cjs/index.js` | anchored at the repo root, matches nothing |
| `/src/thing.ts` | re-prefixed with the package path, matches |

`ESLINT_USE_FLAT_CONFIG` packages are not affected: flat config does not read `.eslintignore` at all, so a migrated package must express ignores as an `ignores` entry. Delete any `.eslintignore` left behind when migrating a package — it is dead weight once the package is on flat config.

Note also that `cjs`/`esm` are anchored to the workspace roots (`packages/*`, `npm/*`, `tooling/*`) rather than written as `**/esm/**`. System-tests fixtures ship handwritten sources under an `esm/` directory, and an unanchored pattern would stop linting them without any signal.

### 7. **Lint JSON with `jsonConfig`**

Under eslintrc, the `@cypress/dev/general` preset ran every `*.json` file through `eslint-plugin-json-format`. That plugin works by patching ESLint 8's `Linter`, so it has no flat-config equivalent, and `baseConfig` matches no `.json` files: a migrated package lints no JSON at all unless it opts in. To opt in, spread `jsonConfig` after `baseConfig`:

```ts
import { baseConfig, jsonConfig } from '@packages/eslint-config'

export default [
  ...baseConfig,
  ...jsonConfig,
]
```

`jsonConfig` is built on [`eslint-plugin-jsonc`](https://ota-meshi.github.io/eslint-plugin-jsonc/) and keeps what the old preset enforced:

| Old preset (`eslint-plugin-json-format`) | `jsonConfig` |
| --- | --- |
| File must parse as JSON | Parse errors, plus `jsonc/recommended-with-json` (no comments, no trailing commas, no duplicate keys) |
| Reformatted to `JSON.stringify(value, null, 2)` plus a final newline | `jsonc/indent`, the `jsonc/*-newline` rules, `@stylistic/eol-last`, `jsonc/array-bracket-spacing`, which also collapses `[ ]`, and `@stylistic/no-multiple-empty-lines` set to `0`. All of them autofix. |
| `package.json` keys in the "pro" order, then in `sort-package-json`'s order | `package-json/order-properties` in `sort-package-json`'s standard order, with no "pro" list. Every top-level key is checked, and keys that order does not know go last in alphabetical order |
| `package.json` `scripts` and dependency maps sorted | `package-json/sort-collections` (from [`eslint-plugin-package-json`](https://github.com/michaelfaith/eslint-plugin-package-json)), which uses `sort-package-json` too. It keeps `pre`/`post` hooks and `name:variant` scripts next to their base script, and sorts the dependency maps in ascending order. `exports` is left out of its default list, because the order of conditions there is significant |
| Skipped `tsconfig.json`, `.vscode/**` and `package-lock.json` | Same skips, widened to every `tsconfig*.json` variant, since `tsc` reads all of them as JSONC |

`@eslint/json` was considered and rejected. It is a separate ESLint *language*, so every JS rule in `baseConfig` that has no `files` restriction would need fencing off. It has no formatting rules, and its `sort-keys` only sorts alphabetically, so it cannot express the `package.json` order. `eslint-plugin-jsonc` parses JSON into an AST that the existing JS rules ignore and autofixes the layout, and `eslint-plugin-package-json` autofixes `package.json` ordering on the same AST. `eslint-plugin-jsonc` is pinned to v2 because v3 needs ESLint 9.38 or later. `eslint-plugin-package-json` is pinned to 0.x for a related reason: 1.x moves to `jsonc-eslint-parser` v3 and declares a peer dependency on `@eslint/json`.

Two differences from the old preset remain:

- **Top-level key order:** the old preset used the "pro" order, which put `scripts` and the dependency maps near the top. `jsonConfig` uses `sort-package-json`'s standard order, so `scripts` and the dependencies follow the metadata (`license`, `main`, `types`, `files` and so on). Nearly every `package.json` in the repo follows the "pro" order today, so the first `eslint --fix` after opting in reorders the top-level keys. This one is deliberate.
- **Empty objects:** `{ }` is not collapsed to `{}`. `jsonc/object-curly-spacing` skips empty objects, and no off-the-shelf rule covers them.

When a package opts in, add `json` to its `lint-staged` glob. Without `jsonConfig`, staging a `.json` file only produces a "File ignored because no matching configuration was supplied" warning. Running `eslint --fix` once on opt-in sorts any `package.json` that drifted while the package was not linting JSON. `@packages/errors` is the reference opt-in.

### 8. **Deprecate and Remove Old Plugin**
- `@cypress/eslint-plugin-dev` is already `private` and no longer publishes. `7.0.0` stays on npm for anything pinned to it.
- Its two custom rules (`arrow-body-multiline-braces`, `skip-comment`) are mirrored in `@packages/eslint-config` under the same `@cypress/dev` namespace, so a package gets the same behavior either side of the migration and existing `eslint-disable @cypress/dev/...` comments keep resolving. Until the plugin is gone, a change to either rule belongs in both.
- The plugin still cannot be deleted: the root `.eslintrc.js` and the nested eslintrc files extend its `general`/`tests`/`react` presets, so it is what every unmigrated package lints against. Once all packages are migrated, remove it from the repo and CI, along with the root `.eslintrc.js`, the root `.eslintignore`, and `eslint` 8 from the root `package.json`.

### 9. **Lint-Staged After the Migration**
The root `lint-staged` config is already a single catch-all pattern, so it needs no change when the last package migrates. Once the root itself moves to flat config, that same pattern runs ESLint 9.

### 10. **Update Lerna/Monorepo Config**
- Ensure all packages reference the new config in their `package.json`/`eslint.config.ts`.
- Update documentation and developer onboarding guides.

### 11. **Migrate the Vue Frontend Packages**

`packages/app`, `packages/launchpad` and `packages/frontend-shared` share one set of overrides. Spread `vueTsxOverrides` and then `frontendOverrides` after `baseConfig`:

```ts
import { baseConfig, frontendOverrides, jsonConfig, vueTsxOverrides } from '@packages/eslint-config'

export default [
  ...baseConfig,
  ...jsonConfig,
  ...vueTsxOverrides,
  ...frontendOverrides,
]
```

`frontendOverrides` only allows type imports from `@packages/data-context` in `.vue` files. Flat config replaces a rule's options rather than merging them, so a package that needs another restricted import adds its pattern to `frontendOverrides` instead of redefining the rule locally.

Drop the `defineProps`, `defineEmits`, `defineExpose` and `withDefaults` globals from the old config: `vue-eslint-parser` 10 defines the compiler macros in `<script setup>`.

The old config turned `vue/no-v-html` off. `baseConfig` makes it an error, and the shared config keeps it that way, so each package fixes its own uses as it migrates. Two render text, not HTML, and switch to `{{ }}` interpolation:

| Package | Call site | Why it is text |
| --- | --- | --- |
| frontend-shared | `src/gql-components/error/BaseError.vue`, `baseError.errorStack` | The stack has only ANSI codes stripped, so `<` in an error message is parsed as markup |
| launchpad | `src/setup/ManualInstall.vue`, `dep.description` | Dependency descriptions are plain text |

The rest render HTML that is built to be rendered. Keep them, wrapped in `<!-- eslint-disable vue/no-v-html -->` / `<!-- eslint-enable vue/no-v-html -->` with a note on where the HTML comes from. A `disable-next-line` comment does not reach a `v-html` attribute on a later line of the tag:

| Package | Call site | Source of the HTML |
| --- | --- | --- |
| frontend-shared | `src/gql-components/error/BaseError.vue`, `markdown` | `useMarkdown` (markdown-it) |
| frontend-shared | `src/warning/Warning.vue` | `useMarkdown` |
| frontend-shared | `src/composables/examples/UseMarkdownExample.vue` | `useMarkdown` |
| frontend-shared | `src/components/ShikiHighlight.vue` | Shiki, which escapes the code it highlights |
| launchpad | `src/setup/SelectFrameworkOrBundler.vue` (twice) | Framework SVG icons |
| app | `src/runs/RunsContainer.vue` | `useMarkdown` |
| app | `src/settings/project/ExperimentRow.vue` | `useMarkdown` |
| app | `src/specs/banners/CloudMessageBanner.vue` | `useMarkdown` with `html: false` |
| app | `src/runner/ScriptError.vue` | `ansi-to-html` with `escapeXML: true` |

---

## Example: Migrating a Batch

1. **Select batch:** e.g., `npm/grep`, `npm/puppeteer`, `npm/mount-utils`, `npm/cypress-schematic`
2. **For each package:**
   - Remove `.eslintrc*` files
   - Add `eslint.config.ts` as above
   - Remove local plugin deps
   - Run lint and fix errors
   - Run tests
3. **Commit and open PR**

---

## Troubleshooting Guide

### Common Issues and Solutions

#### 1. **Jiti Version Compatibility Error**
**Error:** `Error: You are using an outdated version of the 'jiti' library. Please update to the latest version of 'jiti' to ensure compatibility and access to the latest features.`

**Solution:**
- Add `jiti: "^2.4.2"` to the package's `devDependencies`
- ESLint 9.x requires jiti >= 2.2.0, but monorepo dependencies might provide older versions

#### 2. **TypeScript Project Service Errors**
**Error:** `was not found by the project service. Consider either including it in the tsconfig.json or including it in allowDefaultProject`

**Solutions:**
- **Create/update `tsconfig.json`** that extends the base config:
  ```json
  {
    "extends": "../../packages/ts/tsconfig.json",
    "compilerOptions": {
      "esModuleInterop": true,
      "allowJs": true,
      "checkJs": false
    },
    "include": [
      "src/**/*",
      "cypress/**/*",
      "*.js",
      "*.ts",
      "*.jsx",
      "*.tsx"
    ],
    "exclude": ["node_modules", "dist"]
  }
  ```
- **For Cypress packages**, ensure `cypress/tsconfig.json` includes all test files:
  ```json
  {
    "compilerOptions": {
      "types": ["cypress"]
    },
    "include": [
      "**/*.ts",
      "**/*.js"
    ]
  }
  ```
- **Add `allowDefaultProject: true`** to ESLint config for problematic files:
  ```ts
  {
    files: ['**/*.js', '**/*.ts', '**/*.jsx', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        allowDefaultProject: true,
      },
    },
  }
  ```

#### 3. **Skip Comment Rule Violations**
**Error:** `@cypress/dev/skip-comment` rule violations for `it.skip()` tests

**Solution:**
- Replace `eslint-disable-next-line @cypress/dev/skip-comment` with proper explanatory comments:
  ```js
  // NOTE: This test is skipped for demonstration purposes
  it.skip('first test', () => {})
  ```

#### 4. **Rule Mismatches in Pre-commit Hook**
**Error:** ESLint rule violations that don't match the package's ESLint configuration (e.g., `Unexpected console statement` when `no-console` is off in package config)

**Root Cause:** The package has no `lint-staged` key in its `package.json`, so its files fall through to the root config and are linted by ESLint 8 against `.eslintrc.js`.

**Solution:** Add the `lint-staged` key from step 4. See [Lint-Staged Configuration](#1-lint-staged-configuration).

#### 5. **ESLint Script Changes**
**Before ESLint 9.x:**
```json
"lint": "eslint . --ext .js,.ts"
```

**After ESLint 9.x:**
```json
"lint": "eslint"
```
ESLint 9.x auto-detects file extensions, so `--ext` flag is no longer needed.

#### 6. **Package Dependencies**
**Required additions to `package.json`:**
```json
{
  "devDependencies": {
    "@packages/eslint-config": "0.0.0-development",
    "eslint": "^9.31.0",
    "jiti": "^2.4.2"
  }
}
```

**Why `jiti`?** ESLint 9 loads TypeScript flat config files (`eslint.config.ts`) at runtime via [jiti](https://github.com/unjs/jiti), not via a static import in package source. Add it as an explicit `devDependency` in each migrated package so Yarn resolves `jiti@^2.4.2` locally instead of a hoisted older version (see troubleshooting §1).

**Why doesn't `yarn health-check` / knip flag `jiti`?** Knip ties the `eslint` binary to `eslint.config.ts` as config infrastructure and does not treat jiti as an unused dependency in migrated npm packages. It is still required at lint runtime even though no source file imports it.

#### 7. **Custom Package Rules**
If a package needs custom rules, extend the base config:
```ts
import { baseConfig } from '@packages/eslint-config'

export default [
  ...baseConfig,
  {
    files: ['**/*.js', '**/*.ts', '**/*.jsx', '**/*.tsx'],
    rules: {
      'no-console': 'off',
      'no-restricted-syntax': 'off',
    },
  },
  {
    files: ['cypress/**/*.js', 'cypress/**/*.ts'],
    languageOptions: {
      globals: {
        Cypress: 'readonly',
        cy: 'readonly',
      },
    },
  },
]
```

### Migration Checklist Template

For each package, ensure you've completed:

- [ ] Removed `.eslintrc*` files
- [ ] Created `eslint.config.ts` with proper configuration
- [ ] Added required dependencies (`eslint`, `@packages/eslint-config`, `jiti`)
- [ ] Added lint-staged configuration to `package.json`
- [ ] Spread `jsonConfig` after `baseConfig` and included `json` in the lint-staged glob (see [Lint JSON with `jsonConfig`](#7-lint-json-with-jsonconfig))
- [ ] Added the package to the `--scope` list of the root `lint:fix` script
- [ ] Created/updated `tsconfig.json` that extends base config
- [ ] Updated ESLint scripts (removed `--ext` flag)
- [ ] Ran `yarn lint` successfully
- [ ] Ran tests to ensure nothing broke

---

## Tips
- Use a tracking issue or project board to coordinate and document progress.
- If a package is especially noisy, consider splitting it into its own PR.
- Communicate with the team about the migration timeline and process.
- **Test the pre-commit hook** before pushing to ensure lint-staged works correctly.

---

**Happy linting!** 