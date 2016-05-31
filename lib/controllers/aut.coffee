send = require("send")
aut  = require("@cypress/core-aut")

module.exports = {
  handle: (req, res) ->
    pathToFile = aut.getPathToDist(req.params[0])

    send(req, pathToFile)
    .pipe(res)
}
