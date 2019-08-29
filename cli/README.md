# CLI

The CLI is used to build Cypress npm module to be run within a terminal.

**The CLI has the following responsibilities:**

- Allow users to print CLI commands
- Allow users to install the Cypress executable
- Allow users to print their current Cypress version
- Allow users to run Cypress tests from the terminal
- Allow users to open Cypress in the interactive GUI.
- Allow users to verifies that Cypress is installed correctly and executable
- Allow users to manages the Cypress binary cache

## Installing

The CLI's dependencies can be installed with:

```bash
cd cli
npm install
```

## Building

See `scripts/build.js`. Note that the built NPM package will include [NPM_README.md](NPM_README.md) as its public README file.

## Testing

## Automated

You can run unit tests with:

```bash
npm test
```

This will take and compare snapshots of the CLI output. To update snapshots, see `snap-shot-it` instructions: https://github.com/bahmutov/snap-shot-it#advanced-use

### Manual

To build and test an NPM package:

- `npm install`
- `npm run build`

This creates `build` folder.

- `cd build; npm pack`

This creates an archive, usually named `cypress-<version>.tgz`. You can install this archive from other projects, but because there is no corresponding binary yet (probably), skip binary download. For example from inside `cypress-example-kitchensink` folder

```shell
npm i ~/{your-dirs}/cypress/cli/build/cypress-3.3.1.tgz --ignore-scripts
```

Which installs the `tgz` file we have just built from folder `Users/jane-lane/{your-dirs}/cypress/cli/build`.
