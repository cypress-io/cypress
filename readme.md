[![Circle CI](https://circleci.com/gh/brian-mann/eclectus.svg?style=svg&circle-token=a6d67217ee174805c91925400b4210ada937def9)](https://circleci.com/gh/brian-mann/eclectus)

## Docs / API

[Visit the Wiki](https://github.com/cypress-io/cypress-app/wiki)

### Before Running NW
The `lib/secret_sauce.bin` file is required to run NW.  You can either run the `npm run watch` command, or run a one-off dist with:

```bash
npm run dist
```

### While Developing
```bash
npm run watch
```

##### Start the Key Server

```bash
cd cypress-api
npm run dev
```

### Booting NW
Alias 'nw' in your `.bash_profile`

```bash
alias nw="/Applications/nwjs.app/Contents/MacOS/nwjs"
```

Boot NW

```bash
nw .
```

With Chrome Dev Tools

```bash
nw . --debug
```

### Booting via the CLI

```bash
bin/cy <path-to-the-project-you-want-to-test>
```

### Deplying

```bash
npm run deploy
```

### Rolling back
1. Open `package.json`
2. Reduce version to what we want to roll back to
3. run `gulp deploy:manifest` to push this change live

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

Remote servers need to connect to the `/remote` room.

In `node.js` my client connects with this:

```js
socket = require("socket.io-client")("http://localhost:2020/remote", {path: "/__socket.io"})
```

### How messages are passed in and out

Client requests a message:

```js
// passes in a message and optionally some JSON data
cy.message("create:user", {some: "data"})
```

Desktop App requests message from remote:

```js
// an unique guid ID is generated for this message
// and the desktop app broadcasts the 'remote:request' event
// and passes the ID, message, and optional data params
io.emit("remote:request", "123-a-guid-as-an-id", "create:user", {some: "data"})
```
Remote Server responds:

```js
// the remote server performs the work as per the message implementation
// and when its done it sends back a remote:response message
// and passes back the same GUID ID, as well as the new JSON response data
socket.emit("remote:response", "123-a-guid-as-an-id", {a: "new response data obj"})
```
