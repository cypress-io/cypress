io = require("socket.io-client")
socket = io("http://localhost:3500")

module.exports = {
  report: (data) ->
    socket.emit("report", data)

  listenForRun: ->
    socket.on "run", (specFile) ->
      window.location = "/specs#{specFile}#{location.search}"
}
