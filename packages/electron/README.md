# @packages/electron

This package is responsible for installing, building, and managing the Electron binary that powers Cypress. It enables development with an Electron shell that matches the final compiled Cypress binary 1:1 by using symlinks during development.

## Build System

The package uses TypeScript to compile to CJS. ESM builds are not run by default, but can be enabled or tested with `build:esm`.
- **CommonJS**: Primary build used by the binary script and other packages
- **ES Modules**: Alternative build for modern Node.js applications
- **Output**: Compiled JavaScript in `dist/cjs/`, and a binary in `dist/Cypress`.

## Building

```bash
# Build both CommonJS and ES Module versions
yarn workspace @packages/electron build

# Build only CommonJS version
yarn workspace @packages/electron build:cjs

# Build only ES Module version
yarn workspace @packages/electron build:esm

# Clean build artifacts
yarn workspace @packages/electron clean-deps
```

**Note**: The build process compiles TypeScript source to JavaScript. The `--install` command packages the actual Electron binary for your OS-specific platform.

## Usage

### Command Line Interface

The package provides a binary script `cypress-electron` with several commands:

```bash
# Install/build Electron binary for current platform
./bin/cypress-electron --install

# Show help and usage information
./bin/cypress-electron --help

# Launch an Electron app (development mode)
./bin/cypress-electron /path/to/your/app

# Launch with debugging enabled
./bin/cypress-electron /path/to/your/app --inspect-brk
```

These commands are parsed out from argv in the `cli()` function defined in `./lib/electron.ts`

### Public Interface

```typescript
/**
 * Checks if Electron binary exists and is up-to-date, installs if needed
 */
function installIfNeeded(): Promise<void>

/**
 * Forces installation of Electron binary with optional arguments
 */
function install(...args: any[]): Promise<void>

/**
 * Launches an Electron app with the specified path and arguments
 * @param appPath - Path to the application to launch
 * @param argv - Command line arguments to pass to the app
 * @param callback - Optional callback when the app exits
 * @returns Promise that resolves to the spawned Electron process
 */
function open(
  appPath: string, 
  argv: string[], 
  callback?: (code: number) => void
): Promise<ChildProcess>

/**
 * Returns the Electron version being used
 * @returns String version (e.g., "36.4.0")
 */
function getElectronVersion(): string

/**
 * Returns the Node.js version bundled with Electron
 * @returns Promise that resolves to Node.js version string
 */
function getElectronNodeVersion(): Promise<string>

/**
 * Returns the icons package for platform-specific icon paths
 * @returns Icons package object
 */
function icons(): any

/**
 * CLI entry point for command-line operations
 * @param argv - Command line arguments array
 */
function cli(argv: string[]): void
```


## Testing

```bash
# Run unit tests
yarn workspace @packages/electron test

# Run tests with debugger
yarn workspace @packages/electron test-debug

# Run tests in watch mode
yarn workspace @packages/electron test-watch
```

## Package Structure

```
packages/electron/
├── bin/                    # Binary scripts
│   └── cypress-electron   # Main CLI script
├── lib/                    # TypeScript source
│   ├── electron.ts        # Main entry point and CLI logic
│   ├── install.ts         # Installation and packaging logic
│   ├── paths.ts           # Platform-specific path resolution
│   └── print-node-version.ts
├── dist/                   # Compiled output
│   ├── cjs/               # CommonJS build
│   ├── esm/               # ES Module build
│   └── Cypress/           # Electron app binary (created by --install)
├── app/                    # App template for packaging
└── test/                   # Test files
```

## Upgrading Electron

The version of `electron` that is bundled with Cypress should be kept as up-to-date as possible with the [stable Electron releases](https://www.electronjs.org/releases/stable). Many users expect the bundled Chromium and Node.js to be relatively recent. Also, historically, it has been extremely difficult to upgrade over multiple major versions of Electron at once, because of all the breaking changes in Electron and Node.js that impact Cypress.

Upgrading `electron` involves more than just bumping this package's `package.json`. Here are additional tasks to check off when upgrading Electron:

- [ ] **Write accurate changelog items.** The "User-facing changelog" for an Electron upgrade should mention the new Node.js and Chromium versions bundled. If this is a patch version of `electron`, a changelog entry might not be needed.
    - For example:
        - Upgraded `electron` from `21.0.0` to `25.8.4`.
        - Upgraded bundled Node.js version from `16.16.0` to `18.15.0`.
        - Upgraded bundled Chromium version from `106.0.5249.51` to `114.0.5735.289`.
- [ ] **Determine if the Electron upgrade is a breaking change.** Electron upgrades constitute "breaking changes" in Cypress if:
    - the major version number of Node.js changes, since users rely on the bundled Node.js to load plugins and `.js` fixtures, or
    - there are changes to Electron that require new shared libraries to be installed on Linux, breaking existing CI setups, or
    - there is some other change that would break existing usage of Cypress (for example, a Web API feature being removed/added to the bundled Chromium)
- [ ] **Create and publish Docker `base-internal` family images matching the Node.js and Chromium versions in Electron.** These images live inside the [`cypress-docker-images`](https://github.com/cypress-io/cypress-docker-images/) repository. The `base-internal` images will be used inside our CI pipelines. For general use of Cypress in Docker, we encourage the use of the [Cypress Docker Factory](https://github.com/cypress-io/cypress-docker-images#cypressfactory). This works great for using Cypress as an end user, but doesn't fully suit the needs for developing Cypress, as we require: 
    - The installation of packages, such as `curl`, `xauth`, and `build-essential`/`make` needed for our [`circleci`](../../.circleci/config.yml) jobs/pipelines.
    - Specific images targeted to test Cypress on various node versions and distributions of linux, such as different versions of `ubuntu`.

    These images are currently created on an 'as-needed' basis and are published manually to the [cypress docker repository](https://hub.docker.com/u/cypress). When creating these images, make sure: 
    - The Ubuntu images in [base-internal](https://github.com/cypress-io/cypress-docker-images/tree/master/base-internal) are updated to be used in the [system binary tests](../../system-tests/test-binary) if any of the following are true for the images used inside the system binary tests:
      - The last two major [Ubuntu LTS Releases](https://ubuntu.com/about/release-cycle) are out-of-date.
      - The [NodeJS](https://nodejs.org/en) version is not the active LTS.
- [ ] **Update `src/@workflows.yml`**
    - [ ] Ensure it references the new `base-internal` Docker images

- [ ] **Ensure that a matching Node.js version is enforced in the monorepo for local development and CI.** When Electron is upgraded, oftentimes, the bundled Node.js version that comes with Electron is updated as well. Because all unit and integration tests run in normal Node.js (not Electron's Node.js), it's important for this Node.js version to be synced with the monorepo. There are a few places where this needs to be done:
    - [ ] [`/.node-version`](../../.node-version) - used by some Node version managers
    - [ ] [`/.nvmrc`](../../.nvmrc) - used by `nvm`
    - [ ] `@types/node` used throughout the monorepo to determine compatible node types. The major version of this package must reflect the node version set in [`/.node-version`](../../.node-version).
    - [ ] [github workflows](../../.github) - used for repository templates, vulnerability detection, and V8 snapshots. If the node version for Snyk needs to be updated, then the required pull request check into `develop` must also be updated. A repository administrator will need to accomplish this.
    - [ ] [`/package.json`](../../package.json) - update `engines`
    - [ ] [`docker-compose.yml`](../../docker-compose.yml) - update Docker image to the new matching `internal` image
    - [ ] [`/system-tests/test-binary/*`](../../system-tests/test-binary) - update binary system tests to use the newly published Ubuntu and Node images mentioned above, if applicable
    - [ ] Do a global search for the old Node.js version to identify any new areas that may need updating/unification, and update those locations (and this document!)  

- [ ] **Update `better-sqlite3` version if needed** Look through the [commit history](https://github.com/WiseLibs/better-sqlite3/commits/master/) of `better-sqlite3` and find the first version that supports the proper version of `electron`'s prebuilds. Update [`/packages/server/package.json`](../../packages/server/package) and [`/packages/types/package.json`](../../packages/types/package.json) to the appropriate version.

- [ ] **Update `cypress-publish-binary`** For **binary publishing**, make sure the `electron` version that we updated in [`/package.json`](../../package.json) matches the `electron` version inside the [publish binary project](https://github.com/cypress-io/cypress-publish-binary/blob/main/package.json). This is to make sure add-on tests inside the publish-binary repository work locally, but are not required to install the correct version of `electron` in CI when publishing the binary. Ensure the `electron` target in this project's `.circleci` configuration is updated as well. Set the Remove this before merging, and ensure that branch is merged as well.
  - [ ] Create a new branch in `cypress-publish-binary`
  - [ ] Update `electron` version in `package.json`
  - [ ] Update the target `electron` version in the circle configuration
  - [ ] Update the docker image to the new browsers-internal image made in the previous step
  - [ ] Temporarily update the circle configuration to allow `cypress` to run against the branch
  - [ ] Temporarily set target `cypress-publish-binary` branch as a `branch` property on the request body in [../../scripts/binary/trigger-publish-binary-pipeline.js](../../scripts/binary/trigger-publish-binary-pipeline.js) script, so that you can test against this branch from the electron upgrade branch. This property must be set both at the root of the body object, and on the `parameters` key. If it is not set at the root, the binary pipeline will continue to use the primary branch. 


- [ ] **Manually smoke test `cypress open`.** Upgrading Electron can break the `desktop-gui` in unexpected ways. Since testing in this area is weak, double-check that things like launching `cypress open`, signing into Cypress Cloud, and launching Electron tests still work.
- [ ] **Manually smoke test `cypress run` in record mode** Upgrading Electron can cause `better-sqlite3` to SIGSEGV the Electron process.
- [ ] **Fix failing tests.** Usually, these are due to breaking changes in either Node.js or Electron. Check the changelogs of both to find relevant changes.

- [ ] If needed, update the **[V8 Snapshot Cache](https://github.com/cypress-io/cypress/actions/workflows/update_v8_snapshot_cache.yml)** by running the GitHub workflow. Make sure to use the branch that contains the electron updates to populate the `'workflow from'` and `'branch to update'` arguments. Select `'Generate from scratch'` and `'commit directly to branch'`. This will usually take 6-8 hours to complete and is best to not be actively developing on the branch when this workflow runs.

## Development

### Local Development

1. **Build the package**: `yarn build:cjs` (or `yarn build` for both formats)
2. **Test the binary**: `./bin/cypress-electron --install`
3. **Run tests**: `yarn test`

### Debugging

Enable debug logging by setting the `DEBUG` environment variable:

```bash
DEBUG=cypress:electron* ./bin/cypress-electron --install
DEBUG=cypress:electron:install* ./bin/cypress-electron --install
```

### Common Issues

#### Build Errors
- **TypeScript compilation errors**: Check that all dependencies are installed and TypeScript config is correct
- **Missing dependencies**: Ensure `@electron/packager` and other dev dependencies are available

#### Runtime Errors
- **Path resolution issues**: Verify that the compiled output structure matches the expected paths
- **Binary not found**: Run `./bin/cypress-electron --install` to create the Electron binary
- **Permission errors**: On Linux, ensure proper permissions for the binary directory

#### Platform-Specific Issues
- **macOS**: ARM64 vs x64 architecture detection may need updates
- **Linux**: Sandbox issues when running as root (automatically handled)
- **Windows**: Junction vs directory symlink handling (automatically handled)

## Contributing

When contributing to this package:

1. **Follow the existing patterns** for error handling and logging
2. **Test on multiple platforms** if making platform-specific changes
3. **Update tests** for any new functionality
4. **Rebuild after changes** using `yarn build:cjs`
5. **Test the binary** with `./bin/cypress-electron --install`

For more detailed information about the build system, see [BUILD.md](./BUILD.md).


### Common Upgrade Issues

#### Integrity Check Failures

*Solution*: Update the string representation of `fs.readFileSync` in [scripts/binary/binary-integrity-check-source.js](../../scripts/binary/binary-integrity-check-source.js) to match the string generated by the new version of electron. To do this, create a throw-away script that runs `console.log(fs.readFileSync.toString())`. Execute this with *Electron* rather than *Node* (ie. `npm i -g electron@x.y.z && electron throwaway-script.js`).

#### ResizeObserver errors in Component Test

*Solution*: This error is benign. From time to time, the error message we match against in order to swallow the error changes. Update the necessary support files with the new error message.

#### Electron crashes immediately after initializing the Protocol database

*Solution*: This is often due to a mismatched prebuild of `better-sqlite3`. Ensure your repository is clear of untracked files with `git clean -xfd`, and run `yarn` again. If the issue persists, ensure you are running the latest version of your operating system. Electron prebuilds key to darwin/linux/windows, and do not differentiate between versions of the same.

#### node-abi out of date

If you run into an error like below, please try some of the strategies below.

```shell
Could not detect abi for version X.X.X and runtime electron.  Updating "node-abi" might help solve this issue if it is a new release of electron
```

*Solution*: See if there's a new version of `@electron/rebuild` with a newer version of `node-abi` within it. If there is not a newer version, find the [latest release](https://github.com/electron/node-abi/releases) of `node-abi` that has an updated ABI registry with an `abi` entry matching the major version of Electron that you're updating to. Set this `node-abi` version in the `resolutions` of our [package.json](./package.json) file and rerun `yarn`.