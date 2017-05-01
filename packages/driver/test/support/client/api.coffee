client = window.socket.client("http://localhost:3500")
client.on "connect", -> console.log("socket connected")

module.exports = {
  send: (event, data) ->
    console.log("send", event, data)
}
