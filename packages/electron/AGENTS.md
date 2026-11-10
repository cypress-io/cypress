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
  index.js             Comment-only stub; satisfies `@electron/packager`'s entry-point check
  package.json         Empty manifest; marks this as the app dir `@electron/packager` packages
bin/
  cypress-electron     CLI script: delegates to install or open based on arguments
```

## Gotchas / Notes

- After `yarn install`, this package requires an explicit `yarn build` before it is usable — the `postinstall` script prints a reminder but does not build automatically.
- The `build:esm` target exists but is not part of the default `build` target for daily use; it is available for testing ESM compatibility.
- `@electron/fuses` is used to set Electron security fuses (e.g., disabling Node.js integration in renderers) during binary packaging.
- `app/` is a placeholder, not a runnable app, and neither file in it may be deleted. `install.ts` passes it to `@electron/packager` as `dir: 'app'`, which resolves against the cwd — so `build-binary` has to be run from this package's root, as `yarn workspace` does. The packager's `validateElectronApp` then requires both a `package.json` and the `main` it names; since that manifest declares no `main`, the entry point it looks for is exactly `index.js`. Both are stubs on purpose — nothing in `app/` ever executes, because `packageAndExit()` deletes the packaged `resources/app` right after packaging and `open()` symlinks the real app over that path at launch.

## Integration Points

- Depends on **@packages/icons** for the application icon assets used when packaging the binary.
- Depends on **@packages/stderr-filtering** to suppress noisy Electron stderr output during tests.
- Consumed by the Cypress binary build pipeline and by **@packages/server** which spawns the Electron process.
