# Cypress App [![Circle CI](https://circleci.com/gh/cypress-io/cypress-app.svg?style=shield&circle-token=a6d67217ee174805c91925400b4210ada937def9)](https://circleci.com/gh/cypress-io/cypress-app)

## Docs / API

[Visit the Wiki](https://github.com/cypress-io/cypress-app/wiki)

## First Time Installs

```bash
## Getting Node Installed
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.29.0/install.sh | bash
nvm install 1.2
nvm use 1.2
```

```bash
npm install -g bower
```

## Development

To run development environment:

- Navigate to the directory where the `cypress-app` project is on your computer.
- Run the following commands:

```bash
## Install project dependencies
npm install
```

```bash
## Watch all project files and build as necessary
npm run watch
```

Now, you have 2 options:

1. Boot the Desktop Application and run a project.
2. Run a project directly from the command line.

### 1. Boot the Desktop Application

```bash
## Boot Node Webkit
node_modules/nw/bin/nw .

## With Chrome Dev Tools
node_modules/nw/bin/nw . --debug
```

You should now see the Cypress icon in your tray, use Cypress as normal.

Code changes which are applied instantly:
- `web app`
- `driver`

Code changes which require you to reboot `nw`:
- `desktop gui`
- `server`

**Optional:** If you're going to be running the project in Desktop GUI mode, and adding new projects, you need to start the Key Server
```bash
## Start the Key Server
cd cypress-api
npm run dev
```

### 2. Run project from command line

```bash
## boot a specific project
bin/cy <path-to-the-project-you-want-to-test>

## turn off id generation
bin/cy <path-to-the-project-you-want-to-test> --no-ids

## turn off debugging
bin/cy <path-to-the-project-you-want-to-test> --no-debug

## disable auto opening browser
bin/cy <path-to-the-project-you-want-to-test> --no-open

## turn off all options
bin/cy <path-to-the-project-you-want-to-test> --no-ids --no-debug --no-open
```

If you've disabled auto opening be sure to navigate to:

```bash
http://localhost:2020/__/
```

Code changes which are applied instantly:
- `web app`
- `driver`
- `desktop gui`
- `server`

## Testing

To run tests:

- Navigate to the directory where the `cypress-app` project is on your computer.
- Run the following commands:

```bash
gulp test
```

Navigate to [http://localhost:3500](http://localhost:3500)

## Deploying

```bash
npm run deploy

## with options
npm run deploy -- --skip-tests

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
open <path-to-new-cypress.app> --args <path-to-existing-app-path> <path-to-existing-exec-path> --updating
```

Real example with paths:

```bash
open ~/Desktop/cypress.app --args /Users/bmann/Dev/cypress-app/build/0.5.8/osx64/cypress.app /Users/bmann/Dev/cypress-app/build/0.5.8/osx64/cypress.app --updating
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
