# @tooling/electron-mksnapshot

A rewrite of the upstream `electron/mksnapshot` package that supports multiple Electron versions. Unlike the upstream package, the `mksnapshot` binary is not downloaded at install time — instead, it is downloaded on demand the first time a given Electron version is requested, then cached for subsequent runs.

## Key Commands

```sh
yarn build              # Compile TypeScript to dist/

# Run a specific unit test file
yarn test-unit -- <path-to-spec>

# Filter unit tests by name pattern
yarn test-unit -- --grep "<pattern>"

# Run a specific integration test file (slow — downloads real Electron release)
yarn test-integration -- <path-to-spec>

yarn check-ts           # Type-check without emitting
yarn clean              # Remove dist/
```

## Architecture

`src/` contains a small, focused set of modules:

- **`mksnapshot.ts`** — Public entry point; exports `syncAndRun` which ties together download and execution.
- **`mksnapshot-download.ts`** — Downloads the correct `mksnapshot` binary for a given Electron version using `@electron/get`, extracting it with `extract-zip`.
- **`mksnapshot-bin.ts`** — Resolves the path to the cached binary for a given version.
- **`mksnapshot-run.ts`** — Spawns the `mksnapshot` process with provided arguments and returns the output file paths (`snapshot_blob.bin`, `v8_context_snapshot.*`).
- **`config.ts`** — Download/cache directory configuration.
- **`metadata.ts`** — Reads version metadata from downloaded archives.
- **`process-args-from-file.ts`** — Parses mksnapshot arguments from a file, used for passing large argument lists.

## Gotchas / Notes

- The binary is cached under a temp directory keyed by Electron version. If a download is interrupted, a partially extracted cache entry can cause subsequent runs to fail; delete the cache directory to recover.
- Integration tests actually download a real Electron release and are slow and network-dependent — run them deliberately, not as part of a quick local loop.
- The package `main` points to `dist/mksnapshot.js`, so `yarn build` must be run before the package is usable by its consumers (`@tooling/v8-snapshot`).

## Integration Points

- Consumed directly by **`@tooling/v8-snapshot`** (`snapbuild/snapbuild.ts` and the generator) to compile snapshot scripts into binary snapshot blobs.
