# @packages/errors

Centralised error definitions and formatting utilities for the entire Cypress codebase. Provides the `errTemplate` tagged-template system for authoring structured, ANSI-colored error messages, and exports all named Cypress error types consumed by `server`, `driver`, `data-context`, and other packages.

## Key Commands

```bash
# Run a specific test file
yarn workspace @packages/errors test -- test/errors.spec.ts

# Run tests matching a glob pattern
yarn workspace @packages/errors test -- "test/**/*.spec.ts"

# Build CJS and ESM outputs
yarn workspace @packages/errors build

# Type-check
yarn workspace @packages/errors check-ts
```

## Architecture

```
src/
  errors.ts                    All named Cypress error definitions (one export per error type)
  errorTypes.ts                TypeScript enum/union of every error name
  errorUtils.ts                Utilities: stack trace manipulation, error wrapping helpers
  errTemplate.ts               Tagged template literal system for constructing formatted errors
  normalizeNetworkErrorMessage.ts  Maps network error codes to human-readable messages
  stackUtils.ts                Stack frame filtering and formatting
  stripIndent.ts               Template literal helper to remove leading indentation
  index.ts                     Public entry point re-exporting everything
```

## Gotchas / Notes

- Builds to both `cjs/` and `esm/` directories. The `browser` field in `package.json` points to the ESM build, making it safe to import in browser bundles.
- See `guides/error-handling.md` at the repo root for the full authoring guide on how to add new errors.
- `errTemplate` uses `chalk` for ANSI coloring in Node.js and `ansi_up` for converting ANSI to HTML in browser contexts — do not import Node.js-only APIs inside error definitions.

## Integration Points

- Imported by nearly every other package in the monorepo; changes here have broad impact.
- Consumed by **@packages/server**, **@packages/driver**, **@packages/data-context**, **@packages/config**, and others for all user-facing error messages.
