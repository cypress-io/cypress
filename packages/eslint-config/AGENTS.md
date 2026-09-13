# @packages/eslint-config

A monorepo-wide ESLint flat-config package providing standardised linting rules across JavaScript, TypeScript, React, Vue, and Cypress test files. Consumed by most other packages in the `packages/` workspace as their ESLint configuration base.

## Key Commands

```bash
# Lint the package itself
yarn workspace @packages/eslint-config lint

# Run the config's own specs
yarn workspace @packages/eslint-config test --run
```

## Architecture

```
src/
  baseConfig.ts     Core flat-config with TypeScript, import, and stylistic rules
  cliOverrides.ts   Overrides applied for CLI/Node.js contexts
  index.ts          Main entry: composes and exports the full flat-config array
```

## Gotchas / Notes

- Uses ESLint v9 **flat config** format (`eslint.config.*`). Packages consuming this config must also be on ESLint v9+.
- The package uses `jiti` as a peer runtime so ESLint can load the TypeScript config files without a pre-build step.
- `src/__spec__/` holds vitest specs that lint sample snippets through `baseConfig` and assert on the reports. Rule severity is worth pinning there: `no-restricted-syntax` reached the flat config as a warning while `.eslintrc.js` had always reported it as an error, and nothing caught the difference.
- Targets ESLint v9.31+ as a peer dependency; earlier ESLint versions are incompatible with the flat-config API used here.
- The `ignores` block in `baseConfig.ts` holds build output (`cjs/`, `esm/`, `dist/`) for every consumer. Its globs are package-relative — lint runs per package, not from the repo root. The eslintrc half of the monorepo gets the same coverage from `ignorePatterns` in the root `.eslintrc.js`, so a new output directory has to be added in both places until the migration finishes. Never add a per-package `.eslintignore` for build output: see [the ESLint migration guide](../../guides/eslint-migration.md#6-ignore-build-output-centrally) for why those entries silently do nothing.
