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
  frontendOverrides.ts  Rules shared by app, launchpad and frontend-shared, such as type-only imports from data-context in .vue files
  graphqlConfig.ts      `graphqlConfig()`: opt-in linting of `gql` templates against data-context's schema, for app, launchpad, frontend-shared and data-context. Requires graphqlBlocks on call
  graphqlBlocks.ts      The blocks and processors behind `graphqlConfig()`, built on @graphql-eslint/eslint-plugin. Never import it statically: that loads the plugin for every consumer
  jsonConfig.ts         Opt-in JSON linting (eslint-plugin-jsonc, eslint-plugin-package-json), including package.json ordering
  sonarjsConfig.ts      SonarJS `recommended` rules as warnings, included in `baseConfig`
  ratchetFormatter.cjs  ESLint formatter for the CI findings ratchet: prints `stylish` and writes `eslint-findings.json`
  vueTsxOverrides.ts    Turns React rules off for .jsx/.tsx in Vue packages, which write components in Vue JSX
  reactRulesOff.ts      Every React rule set to `off`, shared by the .vue block and vueTsxOverrides
  rules/                Cypress-authored rules, registered under the `@cypress/dev` namespace
  index.ts              Main entry: composes and exports the full flat-config array
```

## Gotchas / Notes

- Uses ESLint v9 **flat config** format (`eslint.config.*`). Targets ESLint v9.31+ as a peer dependency; earlier versions are incompatible with the flat-config API used here.
- There is no `test` script — the config is validated implicitly by running `lint` across consumer packages.
- Fill gaps in the config with off-the-shelf rules. Don't hand-write a rule for a cosmetic gap that no existing rule covers; record the gap in this file instead (see [Known gaps](#known-gaps)).
- Prefer adding an override here over repeating it in several packages. A rule only one package needs goes in that package's `eslint.config.ts`, after the shared configs.
- Flat config replaces a rule's options rather than merging them. A package that redefines a rule already set here drops the shared options, so extend the shared block instead. `frontendOverrides`'s `no-restricted-imports` is the usual case.
- `baseConfig`, `jsonConfig` and the other blocks are named exports; `src/index.ts` has no default export.
- The repo root has its own `eslint.config.ts`, which lints only repo-root files and ignores every subdirectory except the top level of `.claude/` and `.cursor/`, whose settings files belong to no workspace. Each workspace lints itself. `lerna run lint` only reaches workspaces, so the root `lint` and `lint:fix` scripts run `lint:root` first, which is how CI's `linux-lint` job covers the root files.

## Adding a workspace

A new workspace lints itself with its own config:

1. Create `eslint.config.ts` at the workspace root, spreading `baseConfig` and, to lint JSON, `jsonConfig` after it:

   ```ts
   import { baseConfig, jsonConfig } from '@packages/eslint-config'

   export default [
     ...baseConfig,
     ...jsonConfig,
   ]
   ```

2. Add `@packages/eslint-config` (`0.0.0-development`), `eslint` (`^9.31.0`) and `jiti` (`^2.4.2`) to `devDependencies`, and set the `lint` script to plain `eslint`, which finds the config and file extensions itself. ESLint loads `eslint.config.ts` through jiti at runtime, so no source file imports it. Declaring it keeps Yarn from resolving an older hoisted copy, which fails with `You are using an outdated version of the 'jiti' library`. Knip treats jiti as config infrastructure, so `yarn health-check` does not flag it.
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

`eslint-plugin-jsonc` is pinned to v2, because v3 needs ESLint 9.38 or later. `eslint-plugin-package-json` is pinned to 0.x, because 1.x moves to `jsonc-eslint-parser` v3 and declares a peer dependency on `@eslint/json`. `@eslint/json` itself doesn't fit: it is a separate ESLint language, so every `baseConfig` rule without a `files` glob would need fencing off, it has no formatting rules, and its `sort-keys` can't express the `package.json` order.

## Vue packages

`app`, `launchpad` and `frontend-shared` spread `vueTsxOverrides` and then `frontendOverrides` after `baseConfig` (and `jsonConfig`), and add `vue` to their `lint-staged` glob. Without `vue` in the glob, a staged `.vue` file matches no task and is committed unlinted. `vue-eslint-parser` 10 defines the `<script setup>` compiler macros (`defineProps`, `defineEmits`, `defineExpose`, `withDefaults`), so they need no globals.

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

- **`graphql@16`, nested.** graphql-eslint v4 needs a `graphql@^16` peer at load time (it reads the `OperationTypeNode` enum, which graphql 15 only has as a type), while the app and server stay on `graphql@15`. This package depends on `graphql@16` itself and its `workspaces.nohoist` entry keeps `@graphql-eslint/eslint-plugin` and its tree in this package's `node_modules`. Hoisted to the root, the plugin would resolve `graphql@15`. Don't remove the nohoist entry, and don't move these dependencies to the root.
- **`graphql` is left out of lockfile deduplication.** `@types/graphql-resolve-batch` depends on `graphql@>=14`, so `yarn-deduplicate --strategy=highest` would move it to graphql 16 types while `data-context` passes it graphql 15 values. `yarn dedupe-lockfile`, which `yarn check-lockfile`, the local postinstall and CI all use, passes `--exclude graphql`. A root resolution cannot fix this instead, because yarn keeps the `graphql@>=14` request in the lockfile either way.
- **`@vue/compiler-sfc@3.5`, nested.** graphql-tag-pluck v8 needs `registerTS`, added in 3.3. Against the repo's 3.2.47 it silently drops every `.vue` document. The app packages keep 3.2.47.
- **`@graphql-tools/delegate`.** The root `**/@graphql-tools/delegate` resolution also reaches the plugin's tree, under `@graphql-tools/wrap` 11. Only `graphql-config`'s URL loader reaches that code, and the schema here is a file.

## Known gaps

- `jsonConfig` does not collapse `{ }` to `{}`. `jsonc/object-curly-spacing` skips empty objects, and no off-the-shelf rule covers them.
