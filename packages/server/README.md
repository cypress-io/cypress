# Server

The server is the heart of the Cypress application. All of this code represents the node process running behind the browser application. This node process is responsible for:

- Proxying every byte coming in and out of the browser
- Performing and normalizing automation tasks for each browser
- Coordinating and synchronizing state with the [launchpad](../launchpad) and [driver](../driver) packages
- Performing node specific tasks on behalf of the [driver](../driver)
- Instantiating and orchestrating nearly every other layer and package
- Spinning up various static file and http servers
- Communicating with our external API's
- Recording videos of run
- Managing mocha reporters
- Managing 3rd party plugins

The [driver](../driver) and the server are the two most complex packages of Cypress.

## Developing

To run the Cypress server:

```bash
## boots the entire Cypress application
yarn start
```

Since the server controls nearly every aspect of Cypress, after making changes you'll need to manually restart Cypress.

Since this is slow, it's better to drive your development with tests.

## Building

Note: you should not ever need to build the .js files manually. `@packages/ts` provides require-time transpilation when in development.

```shell
yarn workspace @packages/server build-prod
```

* `yarn test-unit` executes unit tests in [`test/unit`](./test/unit)
* `yarn test-integration` executes integration tests in [`test/integration`](./test/integration)
* `yarn test-performance` executes performance tests in [`test/performance`](./test/performance)

You can also use the `test-watch` command to rerun a test file whenever there is a change:

```bash
yarn test-watch /test/path/to/spec.js
```

### Running individual unit tests

```bash
yarn test <path/to/test>
yarn test test/unit/api_spec.js
## or
yarn test-unit api_spec ## shorthand, uses globbing to find spec
```

### Running individual integration tests

```bash
yarn test <path/to/test>
yarn test test/integration/cli_spec.js
## or
yarn test-integration cli_spec ## shorthand, uses globbing to find spec
```

### Running e2e/system tests

> With the addition of Component Testing, `e2e` tests have been renamed to `system-tests` and moved to the [`system-tests`](../../system-tests) directory.

### Updating snapshots

Prepend `SNAPSHOT_UPDATE=1` to any test command. See [`snap-shot-it` instructions](https://github.com/bahmutov/snap-shot-it#advanced-use) for more info.

```bash
SNAPSHOT_UPDATE=1 yarn test test/unit/api_spec.js
SNAPSHOT_UPDATE=1 yarn test test/integration/cli_spec.js
```

### V8 Snapshots

In order to improve start up time, Cypress uses [electron mksnapshot](https://github.com/electron/mksnapshot) for generating [v8 snapshots](https://v8.dev/blog/custom-startup-snapshots) for both development and production.

Cypress code is automatically set up to run using snapshots. If you want to run Cypress in development without the v8 snapshot (for debugging purposes or to see if there's a problem with the snapshot or the code itself) you can set the environment variable `DISABLE_SNAPSHOT_REQUIRE` to 1 or true.
