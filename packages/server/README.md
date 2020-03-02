# Server

The server is the heart of the Cypress application. All of this code represents the node process running behind the browser application. This node process is responsible for:

- Proxying every byte coming in and out of the browser
- Performing and normalizing automation tasks for each browser
- Coordinating and synchronizing state with the [desktop-gui](../desktop-gui) and [driver](../driver) packages
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
yarn lerna run build-prod --scope @packages/server --stream
```

* `yarn test-unit` executes unit tests in [`test/unit`](./test/unit)
* `yarn test-integration` executes integration tests in [`test/integration`](./test/integration)
* `yarn test-performance` executes performance tests in [`test/performance`](./test/performance)
* `yarn test-e2e` executes the large (slow) end to end tests in [`test/e2e`](./test/e2e)

You can also use the `test-watch` command to rerun a test file whenever there is a change:

```bash
yarn test-watch /test/path/to/spec.js
```

When running e2e tests, some test projects output verbose logs. To see them run the test with `DEBUG=cypress:e2e` environment variable.

### Running individual unit tests

```bashtest-kitchensink
yarn test <path/to/test>
yarn test test/unit/api_spec.coffee
## or
yarn test-unit api_spec ## shorthand, uses globbing to find spec
```

### Running individual integration tests

```bash
yarn test <path/to/test>
yarn test test/integration/cli_spec.coffee
## or
yarn test-integration cli_spec ## shorthand, uses globbing to find spec
```

### Running individual e2e tests

```bash
yarn test <path/to/test>
yarn test test/e2e/1_async_timeouts_spec.coffee
## or
yarn test-e2e 1_async ## shorthand, uses globbing to find spec
```

### Updating snaphots

Prepend `SNAPSHOT_UPDATE=1` to any test command. See [`snap-shot-it` instructions](https://github.com/bahmutov/snap-shot-it#advanced-use) for more info.

```bash
SNAPSHOT_UPDATE=1 yarn test test/unit/api_spec.coffee
SNAPSHOT_UPDATE=1 yarn test test/integration/cli_spec.coffee
SNAPSHOT_UPDATE=1 yarn test-e2e 1_async
```
