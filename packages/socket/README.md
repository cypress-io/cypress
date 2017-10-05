# Cypress Core Socket

> This is a shared lib for holding both the `socket.io` server and client.


## Usage

```javascript
var socket = require("packages/core-socket")

// returns
{
  server: require("socket.io"),
  client: require("socket.io-client"),
  getPathToClientSource: function(){
    // returns path to the client 'socket.io.js' file
    // for use in the browser
  }
}
```

```javascript
var socket = require("packages/core-socket")

// server usage
var srv = require("http").createServer()
var io = socket.server(srv)
io.on("connection", function(){})

// client usage
var client = socket.client("http://localhost:2020")
client.on("connect", function(){})
client.on("event", function(){})
client.on("disconnect", function(){})

// path usage
socket.getPathToClientSource()
// returns your/path/to/node_modules/socket.io-client/socket.io.js0
```

## Install

Root install is preferred (see `CONTRIBUTING.md`), but if you must

* `npm install`

## Development

### Watching

```bash
npm run test-watch
```

### Testing

```bash
npm test
```
