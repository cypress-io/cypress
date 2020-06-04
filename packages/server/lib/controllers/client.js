debug = require("debug")("cypress:server:controllers:client")
socketIo = require("@packages/socket")

## hold onto the client source + version in memory
clientSource  = socketIo.getClientSource()
clientVersion = socketIo.getClientVersion()

module.exports = {
  handle: (req, res) ->
    etag = req.get("if-none-match")

    debug("serving socket.io client %o", { etag, clientVersion })

    if etag and (etag is clientVersion)
      res.sendStatus(304)
    else
      res
      .type("application/javascript")
      .set("ETag", clientVersion)
      .status(200)
      .send(clientSource)
  }
