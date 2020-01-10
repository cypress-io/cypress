# Driver

This is the core JavaScript library that is loaded inside the browser that is responsible for executing Cypress commands and managing the test runtime.

## Installing

The driver's dependencies can be installed with:

```bash
cd packages/driver
npm install
```

## Building

The driver is actually consumed by the [`runner`](../runner) like any other npm module. To develop the driver and see changes reflected you need to run the `watch` task inside of the runner.

```bash
cd packages/runner
npm run watch
```

## Developing

If you're developing on the driver, you'll want to run in the normal Cypress GUI mode, like you would when you're writing tests for your own Cypress projects.

```bash
## run in cypress GUI mode
cd packages/driver
npm run cypress:open
```

Read the runner's [`README.md`](../runner/README.md) for more information.

## Running

You can also run all of the driver's tests locally. We don't really recommend this because it takes a long time, and we have this process optimized by load balancing the tests across multiple workers in CI.

It's usually easier to run the tests in the GUI, commit, and then see if anything broke elsewhere.

```bash
## run all the tests
npm run cypress:run
```

## Testing

This project is tested with Cypress itself. It acts exactly like any other Cypress project (really we're not kidding!).

The driver uses a node server to test all of its edge cases, so first start that.

```bash
## boot the driver's server
cd packages/driver
npm start
```

For working with a single spec file, use `testFiles` configuration option. For example, to only show the `e2e/focus_blur_spec.js` spec file when Cypress is opened use (path is relative to `test/cypress/integration` folder)

```bash
npm run cypress:open -- --config testFiles=e2e/focus_blur_spec.js
```

Or to run that single spec headlessly

```bash
npm run cypress:run -- --config testFiles=e2e/focus_blur_spec.js
```

Alternative: use `--spec`, but pass the path from the current folder, for example

```bash
npm run cypress:run -- --spec test/cypress/integration/issues/1939_1940_2190_spec.js --browser chrome
```

If you want to run tests in Chrome and keep it open after the spec finishes, you can do

```bash
npm run cypress:run -- --config testFiles=e2e/focus_blur_spec.js --browser chrome --no-exit
If you would like to run a particular integration test, see the GUI and poke around during the test, you can an exclusive test like:

```bash
cd packages/driver
npm run cypress:run -- \
  --spec test/cypress/integration/cypress/cy_spec.coffee \
  --headed \
  --no-exit
```

## Debugging

In the browser

```js
localStorage.debug = "cypress:driver"
```

<!-- ## Catalog of Events

TODO: this data is accurate but also somewhat out of date.

### Order of Runnable Events

| Event                 | From    | To      | Description                                                                                                                                                   |
|-----------------------|---------|---------|---------------------------------------------------------------------------------------------------------------------------------------------------------------|
| restart:test:run      | Runner  | Anyone  | when cypress has been told to 're-run' and before iframes have been loaded. typically seen after a test change or the 'restart tests' button has been clicked |
| before:add            | Runner  | Anyone  | before any tests have been added to the UI                                                                                                                    |
| suite:add             | Runner  | Anyone  | when a suite should be added to the UI                                                                                                                        |
| test:add              | Runner  | Anyone  | when a test should be added to the UI                                                                                                                         |
| after:add             | Runner  | Anyone  | when all runnables have been added to the UI                                                                                                                  |
| runnables:ready       | Runner  | Anyone  | when all runnables have been reduced to basic objects                                                                                                         |
| mocha:start           | Mocha   | Cypress | when mocha runner triggers its 'start' event                                                                                                                  |
| suite:start           | Mocha   | Cypress | when mocha runner fires its 'suite' event                                                                                                                     |
| test:before:run:async | Cypress | Anyone  | before any code has run for a particular test                                                                                                                 |
| test:before:run:async | Cypress | Cypress | before any hooks for a test have started                                                                                                                      |
| hook:start            | Mocha   | Cypress | when mocha runner fires its 'hook' event                                                                                                                      |
| test:start            | Mocha   | Cypress | when mocha runner fires its 'test' event                                                                                                                      |
| suite:end             | Mocha   | Cypress | when mocha runner fires its 'suite end' event                                                                                                                 |
| hook:end              | Mocha   | Cypress | when mocha runner fires its 'hook end' event                                                                                                                  |
| mocha:pass            | Mocha   | Cypress | when mocha runner fires its 'pass' event                                                                                                                      |
| mocha:pending         | Mocha   | Cypress | when mocha runner fires its 'pending' event                                                                                                                   |
| mocha:fail            | Mocha   | Cypress | when mocha runner fires its 'fail' event                                                                                                                      |
| test:end              | Mocha   | Cypress | when mocha runner fires its 'test end' event                                                                                                                  |
| test:results:ready    | Runner  | Anyone  | when we receive the 'test:end' event                                                                                                                          |
| test:after:hooks      | Cypress | Cypress | after all hooks have run for a test                                                                                                                           |
| test:after:run        | Cypress | Anyone  | after any code has run for a test                                                                                                                             |
| mocha:end             | Mocha   | Cypress | when mocha runner fires its 'end' event                                                                                                                       |
| after:run             | Runner  | Anyone  | after run has finished                                                                                                                                        |

### Command Events

| Event             | From    | To     | Description                                                  |
|-------------------|---------|--------|--------------------------------------------------------------|
| log               | Cypress | Runner | when log entries have been added (commands / routes / spies) |
| log:state:changed | Cypress | Runner | when an existing logs state or attributes have changed       |

### Automation Events

| Event         | From    | To     | Description                               |
|---------------|---------|--------|-------------------------------------------|
| get:cookies   | Cypress | Runner | when cookies are being requested          |
| get:cookie    | Cypress | Runner | when a cookie is being requested          |
| set:cookie    | Cypress | Runner | when setting cookie is being requested    |
| clear:cookie  | Cypress | Runner | when clearing a cookie is being requested |
| clear:cookies | Cypress | Runner | when clearing cookies is being requested  |
| message       | Cypress | Runner | when a msg is being requested             |
| fixture       | Cypress | Runner | when a fixture is being requested         |
| request       | Cypress | Runner | when a request is being requested         |
| exec          | Cypress | Runner | when exec is being requested              |
| paused        | Cypress | Runner | when pausing is being requested           |

### AUT Events

| Event        | From    | To     | Description                              |
|--------------|---------|--------|------------------------------------------|
| url:changed  | Cypress | Anyone | when aut app url is changed              |
| page:loading | Cypress | Anyone | when aut app is currently loading a page |
| viewport     | Cypress | Anyone | when viewport has changed                |

### Server Sent Events

| Event                   | From   | To     | Description                               |
|-------------------------|--------|--------|-------------------------------------------|
| watched:file:changed    | Server | Runner | when user has changed local spec file     |
| automation:push:message | Server | Runner | when automation server has sent a message |

## Example 1.

Given this test:

```js
describe('parent', () => {
  it('child', () => {
    cy.visit('/index.html')
  })
})
```

The Driver would emit the following events:

Event |
--- | -->
