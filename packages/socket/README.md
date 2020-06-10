# Socket

This is a shared lib for holding both the `socket.io` server and client.

## Using

```javascript
const socket = require("packages/socket")

// returns
{
  server: require("socket.io"),
  client: require("socket.io-client"),
  getPathToClientSource: function () {
    // returns path to the client 'socket.io.js' file
    // for use in the browser
  }
}
```

```javascript
const socket = require("packages/socket")

// server usage
const srv = require("http").createServer()
const io = socket.server(srv)
io.on("connection", function(){})

// client usage
const client = socket.client("http://localhost:2020")
client.on("connect", function(){})
client.on("event", function(){})
client.on("disconnect", function(){})

// path usage
socket.getPathToClientSource()
// returns your/path/to/node_modules/socket.io-client/socket.io.js0
```

## Testing

```bash
yarn workspace @packages/socket test
```
