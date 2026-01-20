# CLI

The CLI is used to build the [cypress npm module](https://www.npmjs.com/package/cypress) to be run within a terminal.

**The CLI has the following responsibilities:**

- Allow users to print CLI commands
- Allow users to install the Cypress executable
- Allow users to print their current Cypress version
- Allow users to run Cypress tests from the terminal
- Allow users to open Cypress in the interactive Test Runner.
- Allow users to verify that Cypress is installed correctly and executable
- Allow users to manages the Cypress binary cache
- Allow users to pass in options that change way tests are ran or recorded (browsers used, specfiles ran, grouping, parallelization)

## Building

For ease of development, `yarn build` will clean and prepare the artifact directories, build the package with rollup, and post-process the build. `yarn build-cli` is used in CI to prevent the clean step from wiping out work from prior steps.

The built npm package includes [NPM_README.md](NPM_README.md) as its public README file, rather than this readme file.

### Build Hooks

When you run `yarn build`, the following hooks execute in order:

#### `prebuild`
Runs before the main build step:
- **Cleans previous build artifacts**: Removes `build/`, `dist/`, and type definition directories
- **Runs postinstall**: Applies patch-package patches and syncs TypeScript type definitions from `@types/*` packages
- **Prepares build directory**: Creates `build/` folder and copies static files (README, .release.json, bin, types)

#### `build`
The main build step:
- **Runs Rollup**: Compiles TypeScript source files from `lib/` to JavaScript in `dist/`
  - Creates both CommonJS (`.js`) and ESM (`.mjs`) outputs
  - Preserves directory structure for internal entrypoint modules
  - Bundles `tslib` but externalizes other `node_modules` dependencies

#### `postbuild`
Runs after the main build step:
- **Makes binary executable**: Sets execute permissions on `dist/bin/cypress`
- **Copies to build directory**: Copies `dist/` contents to `build/`
- **Prepares package.json**: Generates npm-ready `package.json` in `build/` with:
  - Version and metadata from root package
  - Build info (commit branch, SHA, date)
  - Removed devDependencies and internal-only fields
- **Bundles component testing frameworks**: Copies mount-utils, react, vue, angular, angular-zoneless, and svelte packages to `build/`

**Note**: `yarn build-cli` explicitly includes `postbuild` in its command, but `yarn build` relies on npm's automatic lifecycle hooks. Both produce the same result.

### Why `dist/` and `build/`?

The build process uses two separate directories:

- **`dist/`**: Raw build output from Rollup. This is the compiled JavaScript that:
  - Is referenced by the source `package.json` (`"main": "dist/index.js"`) for development
  - May be imported directly by other packages in the monorepo during development
  - Contains only the compiled code, no static files or npm packaging artifacts

- **`build/`**: Complete npm package artifact. This directory:
  - Contains static files added in `prebuild` (README, .release.json, bin, types)
  - Contains the compiled code copied from `dist/` in `postbuild`
  - Contains component testing frameworks bundled in `postbuild`
  - Contains a prepared `package.json` for npm release (with version, build info, etc.)

We can't build directly to `build/` because `prebuild` adds static files there first. The separation ensures:
1. `dist/` remains available for development imports
2. `build/` contains the complete, ready-to-publish npm package
3. The build process doesn't overwrite static files added in `prebuild`

### Build Configuration

**`rollup.config.mjs`**: Defines two Rollup builds:
- **CommonJS build**: Compiles multiple entry points (`lib/index.ts`, `lib/cli.ts`, `lib/cypress.ts`, `lib/exec/xvfb.ts`, `lib/exec/spawn.ts`, `lib/bin/cypress.ts`) to `dist/` with preserved directory structure. Bundles `tslib` and `@packages/*` monorepo packages, but externalizes other `node_modules` dependencies. `tslib` is bundled to preserve Typescript polyfill helpers, and may eventually be removed as a bundled package.
- **ESM build**: Compiles single entry point (`lib/index.mts`) to `dist/index.mjs`. This is a thin wrapper that uses Node's `module.createRequire()` to dynamically require the CJS build output (`./cypress`), then re-exports its API. While `external: false` is set, there are no npm dependencies to bundle, as only Node's built-in `module` package is imported.

**`tsconfig.json`**: Base TypeScript configuration for eslint and type checking (ES2022 target, CommonJS module, strict mode, no emit).

**`tsconfig.build.json`**: Extends base config for CJS build (ES2016 target, enables emit, rootDir: `lib`, outDir: `dist`).

**`tsconfig.esm.json`**: Extends build config for ESM build (ES2022 target, ES2022 module, includes only `lib/**/*.mts` files).

## Testing

### Automated

From the repo's root, you can run unit tests with:

```bash
yarn test-unit --scope cypress
yarn test-watch --scope cypress
yarn test-debug --scope cypress
```

### Updating snapshots

Prepend `SNAPSHOT_UPDATE=1` to any test command. See [`snap-shot-it` instructions](https://github.com/bahmutov/snap-shot-it#advanced-use) for more info.

```bash
SNAPSHOT_UPDATE=1 yarn test-unit --scope cypress
```

#### Type Linting

When testing with `dtslint`, you may need to remove existing typescript installations before running the type linter (for instance, on OS X, you might `rm -rf ~/.dts/typescript-installs`) in order to reproduce issues with new versions of typescript (i.e., `@next`).

### Manual

To build and test an npm package, execute the following from the repo's root directory:

```shell
yarn
yarn build
```

This creates the `cli/build` folder.

```shell
cd cli/build
yarn pack
```

This creates an archive, usually named `cypress-v<version>.tgz`. You can install this archive from other projects, but because there is no corresponding binary yet (probably), skip binary download. For example from inside `cypress-example-kitchensink` folder

```shell
yarn add ~/{your-dirs}/cypress/cli/build/cypress-v13.13.2.tgz --ignore-scripts
```

#### Sub-package API

> How do deep imports from cypress/* get resolved?

The cypress npm package comes pre-assembled with mounting libraries for major front-end frameworks. These mounting libraries are the first examples of Cypress providing re-exported sub-packages. These sub-packages follow the same naming convention they do when they're published on **npm**, but without a leading **`@`** sign. For example:

##### An example of a sub-package: @cypress/vue, @cypress/react, @cypress/mount-utils

**Let's discuss the Vue mounting library that Cypress ships.**

If you'd installed the `@cypress/vue` package from NPM, you could write the following code.

This would be necessary when trying to use a version of Vue, React, or other library that may be newer or older than the current version of cypress itself.

```js
import { mount } from '@cypress/vue'
```

Now, with the sub-package API, you're able to import the latest APIs directly from Cypress without needing to install a separate dependency.

```js
import { mount } from 'cypress/vue'
```

The only difference is the import name, and if you still need to use a specific version of one of our external sub-packages, you may install it and import it directly.

##### Adding a new sub-package

There are a few steps when adding a new sub-package.

1. Make sure the sub-package's rollup build is _self-contained_ or that any dependencies are also declared in the CLI's **`package.json`**.
2. Now, in the **`postbuild`** script for the sub-package you'd like to embed, invoke `node ./scripts/sync-exported-npm-with-cli.js` (relative to the sub-package, see **`npm/vue`** for an example).
3. Add the sub-package's name to the following locations:
  - **`cli/.gitignore`**
  - **`cli/scripts/post-build.js`**
  - **`.eslintignore`** (under cli/sub-package)
4. DO NOT manually update the **package.json** file. Running `yarn build` will automate this process.
5. Commit the changed files.

[Here is an example Pull Request](https://github.com/cypress-io/cypress/pull/20930/files#diff-21b1fe66043572c76c549a4fc5f186e9a69c330b186fc91116b9b70a4d047902)

#### Module API

The module API can be tested locally using something like:

```typescript
/* @ts-ignore */
import cypress from '../../cli/lib/cypress'

const run = cypress.run as (options?: Partial<CypressCommandLine.CypressRunOptions>) => Promise<CypressCommandLine.CypressRunResult | CypressCommandLine.CypressFailedRunResult>

run({
  spec: './cypress/component/advanced/framer-motion/Motion.spec.tsx',
  testingType: 'component',
  /* @ts-ignore */
  dev: true,
}).then(results => {
  console.log(results)
})
```

Note that the `dev` flag is required for local testing, as otherwise the command will fail with a binary error.
