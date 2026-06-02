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

## Gotchas / Notes

- `CYPRESS_env` and `CYPRESS_expose` must be valid JSON objects (e.g. `{"key":"value"}`). Plain strings are warned and ignored; use `--env key=value` for individual Cypress env vars instead.
- Builds to both `cjs/` and `esm/` directories. The `browser` field in `package.json` points to the ESM build so bundlers targeting the browser get a tree-shakeable subset without Node.js-only imports.
- The `ast-utils/` directory uses Babel's parser and `recast` to perform lossless source transforms on config files (preserving comments and formatting).
- Tests use `vitest run` — no watch mode by default; use `test-debug` for breakpoint debugging with `--inspect-brk`.

## Integration Points

- Depended on by **@packages/server**, **@packages/data-context**, and **@packages/driver** for configuration schema and validation.
- Uses **@packages/errors** (dev dep) for error type definitions.
- Uses **@packages/network-tools** (dev dep) for URL/domain utilities used in validation.
