# Cypress App [![Circle CI](https://circleci.com/gh/cypress-io/cypress-app.svg?style=shield&circle-token=a6d67217ee174805c91925400b4210ada937def9)](https://circleci.com/gh/cypress-io/cypress-app)

## First Time Installs

```bash
npm install -g bower
```

## Development

```bash
## Install project dependencies
npm install
```

```bash
## Watch all project files and build as necessary
npm run watch
```

Now, you have a few options to boot Cypress:

1. Boot the Desktop Application in GUI mode.
2. Run a project directly from the command line.
3. Run a project headlessly.

### 1. GUI Mode

```bash
## this will boot the desktop app and
## display the 'cy' in your tray
npm start
```

Code changes which are applied instantly:
- `web app`
- `driver`

Code changes which require you to restart the running process:
- `server`

> When running in GUI mode you'll notice you may get a warning in your console:
  *The local API server isn't running in development. This may cause problems running the GUI.*

To avoid this warning make sure you start your API server.

```bash
## Start the API Server
cd cypress-api
npm start
```

### 2. Run project directly without GUI

```bash
## boot a specific project
npm run server -- --run-project <path-to-the-project-you-want-to-test>
```

You should see `nodemon` watching all of your files.

Code changes are applied instantly:
- `web app`
- `driver`
- `server`

### 3. Run project headlessly

```bash
## boot a specific project
npm start -- --run-project <path-to-the-project-you-want-to-test>
```

You will see Cypress run all the tests headlessly and you'll see output in your console.

### 4. Run a single spec headlessly

```bash
npm start -- --run-project <path to project> --spec <path to spec file>
```

Path to spec file can be relative to the project you want to test.

## Testing the Driver

To run driver tests:

- Navigate to the directory where the `cypress-app` project is on your computer.
- Run the following commands:

```bash
gulp test
```

Navigate to [http://localhost:3500](http://localhost:3500)

## Debugging

Using [debug](https://github.com/visionmedia/debug#readme) module under
namespace `cypress:server`. There are a few places where low-level events are
also written, for example `cypress:server:file`. To see debug messages

```sh
DEBUG=cypress:server npm start ...
```

You can see more debug messaging by using a wild card

```sh
DEBUG=cypress* npm start ...
```

## Deploying

```bash
npm run deploy

```

## Releasing

```bash
npm run release
```

## Rolling back

```bash
npm run release -- --version 0.9.6
```

If the user just updated their old app will be in their trash bin. They could always delete the new app and "put back" their trashed app.

### Manually Completing An Update
This will manually complete an update given you have the new app downloaded and unzipped (which is the source), and you have the existing app (the destination).

This will copy the new (source) app to the existing (desination) app, and trash the existing (destination) app first.

```bash
open <path-to-new-cypress.app> --args --app-path <path-to-existing-app-path> --exec-path <path-to-existing-exec-path> --updating
```

Real example with paths:

```bash
open ~/Desktop/cypress.app --args --app-path /Users/bmann/Dev/cypress-app/build/0.5.8/osx64/cypress.app --exec-path /Users/bmann/Dev/cypress-app/build/0.5.8/osx64/cypress.app --updating
```

## Remote Server Communication

### To Connect

Remote servers need to connect to the web socket server:

In my `node.js` adapter, the remote server with this:

```js
socket = require("socket.io-client")("http://localhost:2020", {path: "/__socket.io"})
```

### Connecting to the `remote` room

Upon connecting to the websocket server you'll need to request to be put in the `remote` room. This allows the websocket server to know you're listening to requests.

To do that, emit a `remote:connected` message.

```js
socket.emit("remote:connected")
```

You are now connected properly and ready to receive messages.

### How messages are passed in and out

Client requests a message:

```js
// passes in a message and optionally some JSON data
cy.message("create:user", {some: "data"})
```

Desktop App requests message from remote server:

```js
// an unique guid ID is generated for this message
// and the desktop app broadcasts the 'remote:request' event
// and passes the ID, message, and optional data params
io.emit("remote:request", "123-a-guid-as-an-id", "create:user", {some: "data"})
```
Remote server responds:

```js
// the remote server performs the work as per the message implementation
// and when its done it sends back a remote:response message
// and passes back the same GUID ID, as well as the new JSON response data
socket.emit("remote:response", "123-a-guid-as-an-id", {a: "new response data obj"})
```

### Debugging Linux (Desktop)

- `vagrant halt`
- Modify Vagrantfile, comment out `vm.box` and uncomment `vm.define desktop`
- `vagrant up`
- `.vagrant/ssh` can be edited in sublime and takes effect immediately
- Open `terminal` on the desktop
- `cd /cypress_app`
- `npm i`
- Open new tab: `npm run watch`
- `node_modules/.bin/nw .`

## Catalog of Events

### Order of Runnable Events

Event | From | To | Description
--- | --- | --- | ---
restart:test:run | Runner | Anyone | when cypress has been told to 're-run' and before iframes have been loaded. typically seen after a test change or the 'restart tests' button has been clicked
before:run | Runner | Anyone | before run has started but after iframes have loaded
before:add | Runner | Anyone | before any tests have been added to the UI
suite:add | Runner | Anyone | when a suite should be added to the UI
test:add | Runner | Anyone | when a test should be added to the UI
after:add | Runner | Anyone | when all runnables have been added to the UI
runnables:ready | Runner | Anyone | when all runnables have been reduced to basic objects
mocha:start | Mocha | Cypress | when mocha runner triggers its 'start' event
suite:start | Mocha | Cypress | when mocha runner fires its 'suite' event
test:before:run | Cypress | Anyone | before any code has run for a particular test
test:before:hooks | Cypress | Cypress | before any hooks for a test have started
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
log:add | Cypress | Runner | when log entries have been added (commands / routes / spies)
log:state:changed | Cypress | Runner | when an existing logs state or attributes have changed

### Request Events

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
