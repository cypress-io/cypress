# Server

This is the heart of the Cypress application. All of this code represents the node process running behind the browser application. This node process is responsible for:

- Proxying every byte coming in and out of the browser
- Performing and normalizing automation tasks for each browser
- Coordinating and synchronizing state with the Desktop GUI and the Driver
- Performing node specific tasks on behalf of the Driver
- Instantiating and orchestrating nearly every other layer and package
- Spinning up various static file and http servers
- Communicating with our external API's
- Recording videos of run
- Managing mocha reporters
- Managing 3rd party plugins

The Driver and the Server are the two most complex areas of the Cypress.

## Install

The server's dependencies can be installed with:

```bash
cd packages/server
npm install
```

## Development

To run Cypress:

```bash
npm start ## boots the entire Cypress application
```

Since the server controls nearly every aspect of Cypress, after making changes you'll need to manually restart Cypress.

Since this is slow, it's better to drive your development with tests.

## Testing

* `npm run test-unit` executes unit tests in `test/unit`
* `npm run test-integration` executes integration tests in `test/integration`
* `npm run test-e2e` executes the large (slow) end to end tests in `test/e2e`

Each of these tasks can run in "watch" mode by appending this word to the task:

```bash
npm run test-unit-watch
```

Because of the large number of dependencies of the server, it's much more performant to run a single individual test.

```bash
## runs only this one test file
npm run test ./test/unit/api_spec.coffee

## works for integration tests too
npm run test ./test/integration/server_spec.coffee
```

You can also run in `watch` mode

```bash
## runs and watches only this one test file
npm run test-watch ./test/unit/api_spec.coffee
```

To run an individual e2e test:

```bash
## runs tests that match "base_url"
npm run test-e2e -- --spec base_url
```
