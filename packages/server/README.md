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

To run Cypress:

```bash
## boots the entire Cypress application
yarn lerna run start --scope @packages/server --stream
```

Since the server controls nearly every aspect of Cypress, after making changes you'll need to manually restart Cypress.

Since this is slow, it's better to drive your development with tests.

## Testing

```shell
# be sure to build (also happens on `yarn` when installing dependencies)
yarn build
```

* `yarn lerna run test-unit --scope @packages/server --stream` executes unit tests in [`test/unit`](./test/unit)
* `yarn lerna run test-integration --scope @packages/server --stream` executes integration tests in [`test/integration`](./test/integration)
* `yarn lerna run test-performance --scope @packages/server --stream` executes performance tests in [`test/performance`](./test/performance)
* `yarn lerna run test-e2e --scope @packages/server --stream` executes the large (slow) end to end tests in [`test/e2e`](./test/e2e)

Each of these tasks can run in "watch" mode by appending `-watch` to the task:

```bash
yarn lerna run test-unit-watch --scope @packages/server --stream
```

When running e2e tests, some test projects output verbose logs. To see them run the test with `DEBUG=cypress:e2e` environment variable.

To update snapshots, see `snap-shot-it` instructions: https://github.com/bahmutov/snap-shot-it#advanced-use
