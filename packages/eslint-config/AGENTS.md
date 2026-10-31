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
  jsonConfig.ts         Opt-in JSON linting (eslint-plugin-jsonc, eslint-plugin-package-json), including package.json ordering
  vueTsxOverrides.ts    Turns React rules off for .jsx/.tsx in Vue packages, which write components in Vue JSX
  reactRulesOff.ts      Every React rule set to `off`, shared by the .vue block and vueTsxOverrides
  rules/                Cypress-authored rules, registered under the `@cypress/dev` namespace
  index.ts              Main entry: composes and exports the full flat-config array
```

## Gotchas / Notes

- Uses ESLint v9 **flat config** format (`eslint.config.*`). Packages consuming this config must also be on ESLint v9+.
- The package uses `jiti` as a peer runtime so ESLint can load the TypeScript config files without a pre-build step.
- Fill gaps in `jsonConfig` (and the rest of the config) with off-the-shelf rules. Don't hand-write a rule for a cosmetic gap that no existing rule covers. Record the gap in the [migration guide](../../guides/eslint-migration.md#7-lint-json-with-jsonconfig) instead.
- There is no `test` script — the config is validated implicitly by running `lint` across consumer packages.
- Targets ESLint v9.31+ as a peer dependency; earlier ESLint versions are incompatible with the flat-config API used here.
- `baseConfig` matches no `.json` files. A package lints JSON only when it spreads `jsonConfig` after `baseConfig`. `jsonConfig` needs the `@stylistic` plugin and the `@stylistic/eol-last` rule that `baseConfig` brings. See [Lint JSON with `jsonConfig`](../../guides/eslint-migration.md#7-lint-json-with-jsonconfig) for what it enforces and how it differs from the eslintrc preset.
- The `ignores` block in `baseConfig.ts` holds build output (`cjs/`, `esm/`, `dist/`) for every consumer. Its globs are package-relative — lint runs per package, not from the repo root. The eslintrc half of the monorepo gets the same coverage from `ignorePatterns` in the root `.eslintrc.js`, so a new output directory has to be added in both places until the migration finishes. Never add a per-package `.eslintignore` for build output: see [the ESLint migration guide](../../guides/eslint-migration.md#6-ignore-build-output-centrally) for why those entries silently do nothing.
