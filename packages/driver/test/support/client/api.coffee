io = require("socket.io-client")
socket = io("http://localhost:3500")

module.exports = {
  report: (data) ->
    socket.emit("report", data)

  sendError: (err) ->
    socket.emit("error", err)

  listenForRun: ->
    socket.on "run", (specFile) ->
      window.location = "/#{specFile}#{location.search}"
}
