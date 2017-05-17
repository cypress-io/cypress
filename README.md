# Cypress

[![CircleCI](https://circleci.com/gh/cypress-io/cypress-monorepo.svg?style=svg&circle-token=ad2c9212a3dc5b80fe92c8780b2533be1ef42d7e)](https://circleci.com/gh/cypress-io/cypress-monorepo)

This is the Cypress monorepo, containing all packages that make up the Cypress app. See [Issue #256](https://github.com/cypress-io/cypress/issues/256) for details.

This monorepo is made up of various packages, all of which are found under the `packages` directory. They are discrete modules with different responsibilities, but each is necessary for the Cypress app and is not necessarily useful outside of the Cypress app.

Some, like `core-https-proxy` and `core-launcher`, run solely in node and support the Cypress server. Others, like `core-desktop-gui` and `core-runner`, create the GUI parts of the Cypress app.

[CLI Documentation](https://on.cypress.io/cli)

## Development

### Getting Started

Install all dependencies:

```bash
npm install
```

This will install this repo's direct dependencies as well as the dependencies for every individual package.

Then, build all the packages and start the app:

```bash
npm run all build-dev
npm start
```


### Tasks

Each package is responsible for building itself and testing itself and can do so using whatever tools are appropriate, but each conforms to a standard set of npm scripts so that building, watching, testing, etc. can be orchestrated from the root of this repo. Here are the npm scripts supported and what they mean:

**build-dev**: Build all assets for development

**build-prod**: Build all assets for production

**watch-dev**: Watch source files and build development assets when they are saved. This may also run a server for serving files and run tests related to a saved file.

**server**: Run a server for serving files

**clean**: Remove any assets created by *build-dev* or *build-prod*

**clean-deps**: Remove any dependencies installed (usually by npm or bower)

**test-all**: Run all tests in watch mode

**test-all-once**: Run all tests

**test-all-unit**: Run unit tests in watch mode

**test-all-unit-once**: Run unit tests

**test-all-integration**: Run integration tests in watch mode

**test-all-integration-once**: Run integration tests

**test-all-e2e**: Run end-2-end tests in watch mode

**test-all-e2e-once**: Run end-2-end tests

Not every package requires or makes use of every script, so it is simply omitted from that package's `package.json` and not run.

You can run `npm run all <script>` to run a script in every package that utilizes that script. Many times, you may only be working on one or two packages at a time, so it won't be necessary or desirable to run a script for every package. You can use the `--packages` option to specify in which package(s) to run the script.

You can even run `npm run all install` to install all npm dependencies for each package. Note that this is already done automatically for you when you run `npm install`.

```bash
npm run all watch-dev -- --packages core-desktop-gui
```

Separate the package names with commas to specify multiple packages:

```bash
npm run all watch-dev -- --packages core-desktop-gui,core-runner
```

By default, all tasks run in parallel. This is faster than running serially, but the output ends up mixed together and, if things go wrong, it can be difficult see where the error occurred. To run tasks serially, use the `--serial` flag:


```bash
npm run all build-prod -- --serial
```

*build-prod* will be run sequentially for every package, so the output for each package won't be jumbled with the output of the others.

It is not recommended to use `--serial` with any script that is long-running, like *watch-dev* or *test*, since they need to be parallel.

Since it is generally best to do single runs of tests serially instead of in parallel, this repo has some convenience scripts to run all the tests for all the packages sequentially:

```bash
npm run test-once ## same as 'npm run all test-once -- --serial'
npm run test-unit-once ## same as 'npm run all test-unit-once -- --serial'
npm run test-integration-once ## same as 'npm run all test-integration-once -- --serial'
npm run test-e2e-once ## same as 'npm run all test-e2e-once -- --serial'
```

### Debugging

Some packages use [debug](https://github.com/visionmedia/debug#readme) to
log debug messages to the console. The naming scheme should be
`cypress:<package name>`. For example to see launcher messages during unit
tests start it using

```bash
cd packages/launcher
DEBUG=cypress:launcher npm test
```

If you want to see log messages from all Cypress projects use wild card

```bash
DEBUG=cypress:* ...
```
