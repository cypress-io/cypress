# @packages/config

Contains the canonical Cypress configuration option definitions, validation logic, and AST-based utilities for reading and modifying `cypress.config` files. Used by `server`, `data-context`, and `driver` to resolve and validate user-provided configuration values.

## Key Commands

```bash
# Run a specific test file
yarn workspace @packages/config test -- <path-to-spec>

# Run tests matching a glob pattern
yarn workspace @packages/config test -- "<glob-pattern>"

# Build CJS and ESM outputs
yarn workspace @packages/config build

# Type-check
yarn workspace @packages/config check-ts
```

## Architecture

```
src/
  ast-utils/     Babel-based helpers for reading and writing cypress.config source files
  project/       Per-project configuration resolution (merges defaults, env, cli overrides)
  browser.ts     Browser-safe subset of config exports (ESM entry point)
  index.ts       Node.js entry point; re-exports all config utilities
  options.ts     Master list of every supported configuration option with types and defaults
  utils.ts       Shared utility functions
  validation.ts  Per-option validation functions used at runtime
```

## Adding, Renaming, or Removing a Configuration Option

Read [Adding a Cypress Configuration Option](../../guides/adding-a-config-option.md) first.

**Decide first whether the option is user-facing or internal — the two have different workflows
and very different costs to get wrong.**

*User-facing* options are the ones a user writes in their `cypress.config.ts`. They are added
without `isInternal`, so they become part of the public config surface: they need a type in
[`cli/types/cypress.d.ts`](../../cli/types/cypress.d.ts), a changelog entry, and a pull request in
[`cypress-io/cypress-documentation`](https://github.com/cypress-io/cypress-documentation). They
are also included in `getCloudRecordingConfigKeys()`, which is the allow-list for the config
payload sent to Cypress Cloud on recorded runs — so never make an option public if its value could
carry anything user-specific that should not leave the machine.

*Internal* options are plumbing the app sets for itself — ports, resolved paths, routes, CLI-only
values. They live in `runtimeOptions` with `isInternal: true`, are excluded from the public key
list and from Cloud payloads, and need none of the public-surface work above. `configFile` is the
canonical borderline case: it is set only via the CLI, so it is marked internal even though users
are aware of it.

If you are unsure, it is internal. Promoting an option later is easy; retracting a public option
requires a `breakingOptions` entry, an error in `@packages/errors`, and a deprecation cycle.

Note that `packages/config/*` is a global CI trigger, so every job in the matrix runs — including
for changes to this file.

## Gotchas / Notes

- `CYPRESS_env` and `CYPRESS_expose` must be valid JSON objects (e.g. `{"key":"value"}`). Plain strings are warned and ignored; use `--env key=value` for individual Cypress env vars instead.
- Builds to both `cjs/` and `esm/` directories. The `browser` field in `package.json` points to the ESM build so bundlers targeting the browser get a tree-shakeable subset without Node.js-only imports.
- The `ast-utils/` directory uses Babel's parser and `recast` to perform lossless source transforms on config files (preserving comments and formatting).
- Tests use `vitest run` — no watch mode by default; use `test-debug` for breakpoint debugging with `--inspect-brk`.

## Integration Points

- Depended on by **@packages/server**, **@packages/data-context**, and **@packages/driver** for configuration schema and validation.
- Uses **@packages/errors** (dev dep) for error type definitions.
- Uses **@packages/network-tools** (dev dep) for URL/domain utilities used in validation.
