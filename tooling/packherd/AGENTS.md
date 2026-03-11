# @tooling/packherd

Bundles all Node.js dependencies reachable from a given entry point using esbuild, and returns the resulting bundle buffer, esbuild metafile metadata, an optional source map buffer, and any esbuild warnings. It is the bundling half of the snapshot pipeline; the runtime loading half lives in `@packages/packherd-require`.

## Key Commands

```sh
yarn build              # Compile TypeScript to dist/

# Run a specific integration test file
yarn test-integration -- <path-to-spec>

# Filter integration tests by name pattern
yarn test-integration -- --grep "<pattern>"

yarn check-ts           # Type-check without emitting
yarn clean              # Remove dist/
```

## Architecture

`src/` contains six modules:

- **`packherd.ts`** — Public entry point; exports the `packherd` function that accepts `PackherdOpts` and returns the bundle, meta, sourceMap, and warnings.
- **`create-bundle.ts`** — Invokes esbuild with the generated entry file and returns raw build outputs.
- **`generate-entry.ts`** — Generates the synthetic esbuild entry file that imports all target modules, enabling esbuild to trace the full dependency graph.
- **`get-metadata.ts`** — Parses the esbuild metafile to extract the dependency map used by downstream consumers.
- **`types.ts`** — Shared TypeScript type definitions (`PackherdOpts`, `PackherdResult`, etc.).
- **`utils.ts`** — Internal utility helpers.

## Gotchas / Notes

- The default `yarn test` runs only integration tests (there are no separate unit tests in this package). Integration tests build real bundles and can be slow.
- The `package.json` `files` field includes `src/packherd.ts` alongside `dist/` so that the `"types"` field pointing to the TypeScript source works correctly for downstream consumers without a separate `.d.ts` generation step.
- esbuild is a runtime dependency (not devDependency) because it is invoked programmatically at bundle time by `@tooling/v8-snapshot`.

## Integration Points

- **`@tooling/v8-snapshot`** is the primary consumer — it calls `packherd` to produce the initial bundle that the snapshot generator and doctor then process.
- The runtime counterpart **`@packages/packherd-require`** handles loading modules from bundles produced by this package and provides on-demand TypeScript transpilation.
