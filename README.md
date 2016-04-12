# Cypress Core Socket

This is a shared lib for holding both the `socket.io` server and client.

## Install

```bash
npm install --save @cypress/core-socket
```

## Usage

```javascript
var socket = require("@cypress/core-socket")

// returns
// {
//   server: require("socket.io"),
//   client: require("socket.io-client")
// }
```

```javascript
var socket = require("@cypress/core-socket")

// server usage
var srv = require("http").createServer()
var io = socket.server(srv)
io.on("connection", function(){});

// client usage
var client = socket.client("http://localhost:2020")
client.on("connect", function(){})
client.on("event", function(){})
client.on("disconnect", function(){})
```