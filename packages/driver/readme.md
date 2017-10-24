# Cypress Driver

> JavaScript library that is loaded inside the browser that helps execute the tests

## Install

Root install is preferred (see `CONTRIBUTING.md`), but if you must

* `npm install`
* `npm run build`

## Testing

This project is not tested, the existing test commands are obsolete and will be removed
in the future; all tests have been moved to other packages.

## Debugging

To see logs of what the driver is doing from command line:

```bash
DEBUG=cypress:driver npm start

DEBUG=cypress:driver npm run build
```

In the browser

```js
localStorage.debug = "cypress:driver"
```

## Catalog of Events

### Order of Runnable Events

Event | From | To | Description
--- | --- | --- | ---
restart:test:run | Runner | Anyone | when cypress has been told to 're-run' and before iframes have been loaded. typically seen after a test change or the 'restart tests' button has been clicked
before:add | Runner | Anyone | before any tests have been added to the UI
suite:add | Runner | Anyone | when a suite should be added to the UI
test:add | Runner | Anyone | when a test should be added to the UI
after:add | Runner | Anyone | when all runnables have been added to the UI
runnables:ready | Runner | Anyone | when all runnables have been reduced to basic objects
mocha:start | Mocha | Cypress | when mocha runner triggers its 'start' event
suite:start | Mocha | Cypress | when mocha runner fires its 'suite' event
test:before:run:async | Cypress | Anyone | before any code has run for a particular test
test:before:run:async | Cypress | Cypress | before any hooks for a test have started
hook:start | Mocha | Cypress | when mocha runner fires its 'hook' event
test:start | Mocha | Cypress | when mocha runner fires its 'test' event
suite:end | Mocha | Cypress | when mocha runner fires its 'suite end' event
hook:end | Mocha | Cypress | when mocha runner fires its 'hook end' event
mocha:pass | Mocha | Cypress | when mocha runner fires its 'pass' event
mocha:pending | Mocha | Cypress | when mocha runner fires its 'pending' event
mocha:fail | Mocha | Cypress | when mocha runner fires its 'fail' event
test:end | Mocha | Cypress | when mocha runner fires its 'test end' event
test:results:ready | Runner | Anyone | when we receive the 'test:end' event
test:after:hooks | Cypress | Cypress | after all hooks have run for a test
test:after:run | Cypress | Anyone | after any code has run for a test
mocha:end | Mocha | Cypress | when mocha runner fires its 'end' event
after:run | Runner | Anyone | after run has finished

### Command Events

Event | From | To | Description
--- | --- | --- | ---
log | Cypress | Runner | when log entries have been added (commands / routes / spies)
log:state:changed | Cypress | Runner | when an existing logs state or attributes have changed

### Automation Events

Event | From | To | Description
--- | --- | --- | ---
get:cookies | Cypress | Runner | when cookies are being requested
get:cookie | Cypress | Runner | when a cookie is being requested
set:cookie | Cypress | Runner | when setting cookie is being requested
clear:cookie | Cypress | Runner | when clearing a cookie is being requested
clear:cookies | Cypress | Runner | when clearing cookies is being requested
message | Cypress | Runner | when a msg is being requested
fixture | Cypress | Runner | when a fixture is being requested
request | Cypress | Runner | when a request is being requested
exec | Cypress | Runner | when exec is being requested
paused | Cypress | Runner | when pausing is being requested

### AUT Events

Event | From | To | Description
--- | --- | --- | ---
url:changed | Cypress | Anyone | when aut app url is changed
page:loading | Cypress | Anyone | when aut app is currently loading a page
viewport | Cypress | Anyone | when viewport has changed

### Server Sent Events

Event | From | To | Description
--- | --- | --- | ---
watched:file:changed | Server | Runner | when user has changed local spec file
automation:push:message | Server | Runner | when automation server has sent a message

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
--- |
