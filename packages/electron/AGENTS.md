# @packages/electron

Installs, packages, and manages the Electron binary that powers Cypress. During development it uses symlinks so the local Electron shell matches the final compiled binary 1:1. Provides the `cypress-electron` CLI entrypoint used by the Cypress build pipeline.

## Key Commands

```bash
# Build TypeScript sources to dist/
yarn workspace @packages/electron build

# Download and install the Electron binary
yarn workspace @packages/electron build-binary

# Run a specific test file
yarn workspace @packages/electron test -- test/paths.spec.ts

# Run tests matching a glob pattern
yarn workspace @packages/electron test -- "test/**/*.spec.ts"

# Start Electron with the local app (development)
yarn workspace @packages/electron start
```

## Architecture

```
src/
  electron.ts          Electron process bootstrap (BrowserWindow setup, IPC handlers)
  index.ts             Public API entry: exposes open(), install(), and paths()
  install.ts           Downloads and installs the Electron binary via @electron/packager
  open.ts              Opens Electron with the Cypress app loaded
  paths.ts             Resolves paths to the Electron binary and resources
  print-node-version.ts  Utility to print Node.js version bundled in Electron
app/
  index.js             Minimal Electron `main` process entry injected into the packaged app
bin/
  cypress-electron     CLI script: delegates to install or open based on arguments
```

## Gotchas / Notes

- After `yarn install`, this package requires an explicit `yarn build` before it is usable — the `postinstall` script prints a reminder but does not build automatically.
- The `build:esm` target exists but is not part of the default `build` target for daily use; it is available for testing ESM compatibility.
- `@electron/fuses` is used to set Electron security fuses (e.g., disabling Node.js integration in renderers) during binary packaging.

## Integration Points

- Depends on **@packages/icons** for the application icon assets used when packaging the binary.
- Depends on **@packages/stderr-filtering** to suppress noisy Electron stderr output during tests.
- Consumed by the Cypress binary build pipeline and by **@packages/server** which spawns the Electron process.
