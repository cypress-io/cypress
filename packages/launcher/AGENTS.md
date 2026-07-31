# @packages/launcher

Finds and launches browsers for each operating system. It detects installed browsers (Chrome, Firefox, Edge, Webkit, Electron, and others) on macOS, Linux, and Windows, and launches them with the correct flags and profile directories for Cypress test runs.

## Key Commands

```bash
# Run a specific test file
yarn workspace @packages/launcher test -- test/unit/detect.spec.ts

# Run tests matching a glob pattern
yarn workspace @packages/launcher test -- "test/unit/**/*.spec.ts"

# Build production JavaScript (tsc)
yarn workspace @packages/launcher build-prod

# Type-check
yarn workspace @packages/launcher check-ts
```

## Architecture

```
lib/
  browsers.ts        Master list of known browser definitions (names, family, version regexes)
  detect.ts          Platform-aware browser detection (delegates to darwin/linux/windows)
  errors.ts          Launcher-specific error definitions
  known-browsers.ts  Static registry of all browsers Cypress knows about
  types.ts           TypeScript types: FoundBrowser, Browser, LaunchOptions, etc.
  utils.ts           Shared helper functions
  darwin/            macOS detection: reads app bundles, plist files, and spotlight
  linux/             Linux detection: searches common install paths and PATH entries
  windows/           Windows detection: reads registry and known install locations
```

## Gotchas / Notes

- This package does **not** have a pre-built output in the repo; `build-prod` is run by the binary build pipeline. During development, `@packages/ts` provides require-time transpilation.
- `mock-fs` is used in unit tests to simulate filesystem layouts for each OS without needing real browser installs.
- `win-version-info` reads Windows PE (Portable Executable) file headers to extract browser version strings from `.exe` files.
- The `nx.implicitDependencies` on `@packages/data-context` means that changes to data-context trigger launcher rebuilds in CI, because data-context exposes browser state to the GraphQL layer.

## Integration Points

- Consumed by **@packages/server** to enumerate browsers and launch them during `cypress open` and `cypress run`.
- Consumed by **@packages/data-context** which surfaces the browser list through the GraphQL API to the front-end.
