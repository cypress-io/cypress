var fs        = require("fs")
var path      = require("path")
var server    = require("socket.io")
var client    = require("socket.io-client")
var version   = require("socket.io-client/package.json").version
var clientPath = require.resolve("socket.io-client")

module.exports = {
  server: server,

  client: client,

  getPathToClientSource: function(){
    // clientPath returns the path to socket.io-client/lib/index.js
    // so walk up two levels to get to the root
    return path.join(clientPath, "..", "..", "socket.io.js")
  },

  getClientVersion: function(){
    return version
  },

  getClientSource: function(){
    return fs.readFileSync(this.getPathToClientSource(), "utf8")
  }
}