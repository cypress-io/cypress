# CLI Build Script Flow

## Scripts in package.json

```json
{
  "postinstall": "patch-package && tsx ./scripts/post-install.ts",
  "prebuild": "yarn postinstall && tsx ./scripts/start-build.ts",
  "build-cli": "rollup -c && tsx ./scripts/build.ts && tsx ./scripts/post-build.ts"
}
```

## NPM/Yarn Lifecycle Hooks

### When you run `yarn build-cli`:

1. **`prebuild`** (npm lifecycle hook - runs automatically before `build-cli`)
   - Runs `yarn postinstall`
     - Runs `patch-package` (applies patches)
     - Runs `tsx ./scripts/post-install.ts`
       - Sets up TypeScript types (copies @types/* packages)
       - Fixes relative paths in type definitions
       - Uncomments files that were commented by patch-package
   - Runs `tsx ./scripts/start-build.ts`
     - Cleans `build/` directory
     - Copies `bin/`, `types/`, `README.md`, `.release.json` to `build/`
     - **Runs `tsc -p tsconfig.build.json`** (TypeScript compilation)
     - **Runs `tsc -p tsconfig.esm.json`** (ESM TypeScript compilation)
     - Copies `dist/` → `build/dist/` (recursively)
     - Sets execute permissions on binary

2. **`build-cli`** (the actual command)
   - Runs `rollup -c` (Rollup build with preserveModules: true - **this overwrites the tsc build!**)
   - Runs `tsx ./scripts/build.ts`
     - Prepares `package.json` for npm release
     - Removes devDependencies, private flag, workspaces
     - Adds build info (commit branch, sha, date)
     - Sets postinstall script for end users
     - Writes to `build/package.json`
   - Runs `tsx ./scripts/post-build.ts`
     - Copies npm modules to `build/`:
       - `mount-utils`, `react`, `vue`, `angular`, `angular-zoneless`, `svelte`

### When you run `yarn` (or `yarn install`) at the **root** of the monorepo:

1. **Root `postinstall`** (from root `package.json` line 47)
   - Runs `scripts/run-postInstall.js`
   - **Locally** (not CI):
     - Runs `patch-package` (applies patches)
     - Runs `yarn-deduplicate` (deduplicates dependencies)
     - Rebuilds `better-sqlite3` for server package
     - **Runs `yarn build`** which includes:
       - `lerna run build --stream` (builds all packages)
       - `yarn workspace @packages/electron build-binary`
       - **`lerna run build-cli --stream`** (builds CLI package!)
   - **In CI**:
     - Only runs `patch-package` and rebuilds `better-sqlite3`
     - Does NOT run the full build

2. **CLI package `postinstall`** (runs for the CLI package specifically)
   - Runs `patch-package` (applies patches to CLI package)
   - Runs `tsx ./scripts/post-install.ts` (sets up TypeScript types)

**Important**: In a local checkout, running `yarn` at the root will trigger a **full build** including `build-cli`, which means:
- All packages get built
- CLI package gets built with rollup (preserveModules: true)
- This is why `dist/` exists after a fresh `yarn` install locally

## CI Build Flow (CircleCI)

From `__cypress-publish-binary/.circleci/config.yml`:

```yaml
- run:
    name: Build NPM package
    command: |
      cd ~/cypress
      source ./scripts/ensure-node.sh
      BRANCH=<< pipeline.parameters.branch >> yarn workspace cypress build-cli
```

This runs `build-cli`, which triggers:
1. `prebuild` → `postinstall` → `start-build.ts` → `tsc` (builds TypeScript)
2. `build-cli` → `rollup -c` (rebuilds with Rollup, overwrites tsc output) → `build.ts` → `post-build.ts`

Then CI explicitly runs:
```yaml
- run:
    name: Copy Re-exported NPM Packages
    command: npx tsx ./scripts/post-build.ts
    working_directory: ~/cypress/cli
```

So `post-build.ts` runs **twice** in CI:
- Once as part of `build-cli`
- Once explicitly in CI

## Build Triggers Summary

| Command | What Happens |
|---------|-------------|
| `yarn` (root) | Installs deps → Root postinstall → **Full build** (locally) → CLI postinstall (types setup) |
| `yarn build-cli` (in CLI) | prebuild → postinstall → start-build.ts → **rollup -c** → build.ts → post-build.ts |
| `yarn install` (in CLI) | Only runs CLI postinstall (types setup, no build) |

## Issues/Redundancies

1. **Two different build systems**: 
   - `start-build.ts` uses `tsc` (TypeScript compiler)
   - `build-cli` uses `rollup -c` (Rollup bundler)
   - Rollup overwrites the tsc output, so the tsc step is effectively wasted
2. **post-build.ts runs twice in CI**: Once in `build-cli` and once explicitly
3. **The actual build happens in `build-cli`**: The `rollup -c` command is what produces the final `dist/` with `preserveModules: true`
4. **Root `yarn` triggers full build locally**: This means a fresh checkout will build everything, including CLI

## What Each Script Does

### `post-install.ts`
- Sets up TypeScript type definitions
- Copies @types/* packages from node_modules to `types/`
- Fixes relative paths in type definitions
- Uncomments files that were commented by patch-package

### `start-build.ts` (runs in `prebuild`)
- Cleans and creates `build/` directory
- Copies static files (bin, types, README, .release.json)
- **Builds with `tsc`** (TypeScript compiler - but this gets overwritten by rollup)
- Copies `dist/` to `build/dist/` (but rollup will rebuild it)
- Sets execute permissions

### `build.ts` (runs in `build-cli`)
- Prepares `package.json` for npm publishing
- Removes dev-only fields
- Adds build metadata (commit info)
- Sets postinstall script for end users

### `post-build.ts` (runs in `build-cli` and explicitly in CI)
- Copies re-exported npm packages to `build/`
- These are packages like `@cypress/react`, `@cypress/vue`, etc.

