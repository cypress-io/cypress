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
  baseConfig.ts     Core flat-config with TypeScript, import, and stylistic rules
  cliOverrides.ts   Overrides applied for CLI/Node.js contexts
  index.ts          Main entry: composes and exports the full flat-config array
```

## Gotchas / Notes

- Uses ESLint v9 **flat config** format (`eslint.config.*`). Packages consuming this config must also be on ESLint v9+.
- The package uses `jiti` as a peer runtime so ESLint can load the TypeScript config files without a pre-build step.
- There is no `test` script — the config is validated implicitly by running `lint` across consumer packages.
- Targets ESLint v9.31+ as a peer dependency; earlier ESLint versions are incompatible with the flat-config API used here.
