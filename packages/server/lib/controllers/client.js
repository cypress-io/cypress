/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const debug = require("debug")("cypress:server:controllers:client");
const socketIo = require("@packages/socket");

//# hold onto the client source + version in memory
const clientSource  = socketIo.getClientSource();
const clientVersion = socketIo.getClientVersion();

module.exports = {
  handle(req, res) {
    const etag = req.get("if-none-match");

    debug("serving socket.io client %o", { etag, clientVersion });

    if (etag && (etag === clientVersion)) {
      return res.sendStatus(304);
    } else {
      return res
      .type("application/javascript")
      .set("ETag", clientVersion)
      .status(200)
      .send(clientSource);
    }
  }
  };
