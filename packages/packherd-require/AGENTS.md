# @packages/packherd-require

Module loader for bundles produced by `@tooling/packherd`. Also provides on-demand TypeScript transpilation with source-map support so that TypeScript modules can be required at runtime without a pre-build step — used internally by `@packages/ts` during development.

## Key Commands

```bash
# Run a specific test file
yarn workspace @packages/packherd-require test -- <path-to-spec>

# Run tests matching a glob pattern
yarn workspace @packages/packherd-require test -- "<glob-pattern>"

# Build TypeScript to dist/
yarn workspace @packages/packherd-require build

# Type-check
yarn workspace @packages/packherd-require check-ts
```

## Architecture

```
src/
  default-transpile-cache.ts   Default file-system cache implementation for transpiled TypeScript output
  loader.ts                    Core module loader: resolves bundled modules from packherd snapshots
  require.ts                   Main entry: custom require hook that intercepts module resolution
  sourcemap-support.ts         Installs source-map support so stack traces reference .ts files
  transpile-ts.ts              On-demand TypeScript → JavaScript transpilation (using esbuild)
  types.ts                     TypeScript types for the loader API
```

## Gotchas / Notes

- The `main` field points to `dist/require.js` (compiled), but `types` points to `src/require.ts` (source). The compiled output must exist before other packages that depend on this can load it — `yarn build` is required after install.
- Transpile cache is written to disk by default; the cache location can be overridden via environment variables documented in the package README.
- Source-map support is installed process-wide when the require hook is activated — this affects all subsequent `Error.stack` output in the same Node.js process.
- `esbuild` is used (not `tsc`) for fast on-demand transpilation; some TypeScript features that require type information (e.g., `const enum`) may not be fully supported.

## Integration Points

- Used by **@packages/ts** as the runtime TypeScript require hook for development-mode transpilation across the monorepo.
- Pairs with **@packages/v8-snapshot-require** and `@tooling/v8-snapshot` / `@tooling/packherd` for production snapshot-based module loading in Electron.
