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

See `scripts/build.js`. Note that the built npm package will include [NPM_README.md](NPM_README.md) as its public README file.

## Testing

### Automated

From the repo's root, you can run unit tests with:

```bash
yarn test-unit --scope cypress
yarn test-watch --scope cypress
yarn test-debug --scope cypress
```

### Updating snaphots

Prepend `SNAPSHOT_UPDATE=1` to any test command. See [`snap-shot-it` instructions](https://github.com/bahmutov/snap-shot-it#advanced-use) for more info.

```bash
SNAPSHOT_UPDATE=1 yarn test-unit --scope cypress
```

#### Type Linting

When testing with `dtslint`, you may need to remove existing typescript installations before running the type linter (for instance, on OS X, you might `rm -rf ~/.dts/typescript-installs`) in order to reproduce issues with new versions of typescript (i.e., `@next`).

### Manual

To build and test an NPM package:

- `yarn`
- `yarn build`

This creates `build` folder.

- `cd build; yarn pack`

This creates an archive, usually named `cypress-v<version>.tgz`. You can install this archive from other projects, but because there is no corresponding binary yet (probably), skip binary download. For example from inside `cypress-example-kitchensink` folder

```shell
yarn add ~/{your-dirs}/cypress/cli/build/cypress-3.3.1.tgz --ignore-scripts
```

Which installs the `tgz` file we have just built from folder `Users/jane-lane/{your-dirs}/cypress/cli/build`.
