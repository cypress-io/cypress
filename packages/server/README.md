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

* `yarn test-unit` executes unit tests in [`test/unit`](./test/unit) with vitest
* `yarn test-integration` executes every integration test in [`test/integration`](./test/integration): `*.spec.ts` files with vitest, then `*_spec.{js,ts}` files with mocha
* `yarn test-performance` executes performance tests in [`test/performance`](./test/performance)

You can also use the `test-watch` command to rerun a test file whenever there is a change:

```bash
yarn test-watch /test/path/to/spec.js
```

### Running individual unit tests

```bash
yarn test-unit test/unit/routes.spec.ts
## or
yarn test-unit routes ## filters spec files by substring
```

### Running individual integration tests

`yarn test-integration` takes no arguments. To run part of the suite, call the runner the spec uses:

```bash
## vitest (*.spec.ts)
yarn test-integration-vitest test/integration/video_capture.spec.ts
yarn test-integration-vitest video_capture ## filters spec files by substring

## mocha (*_spec.{js,ts})
yarn test test/integration/cli_spec.js
yarn test-integration-mocha cli_spec ## shorthand, uses globbing to find spec
```

### Running e2e/system tests

> With the addition of Component Testing, `e2e` tests have been renamed to `system-tests` and moved to the [`system-tests`](../../system-tests) directory.

### Updating snapshots

For integration tests, prepend `SNAPSHOT_UPDATE=1` to the test command. See [`snap-shot-it` instructions](https://github.com/bahmutov/snap-shot-it#advanced-use) for more info. For unit tests, pass vitest's `-u` flag.

```bash
SNAPSHOT_UPDATE=1 yarn test test/integration/cli_spec.js
yarn test-unit test/unit/reporter.spec.ts -u
```
