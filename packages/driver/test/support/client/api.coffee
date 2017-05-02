io = require("socket.io-client")
socket = io("http://localhost:3500")

module.exports = {
  send: (event, data) ->
    socket.emit(event, data)
}
