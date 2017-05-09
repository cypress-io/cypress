send      = require("send")
staticPkg = require("../../../static")

module.exports = {
  handle: (req, res) ->
    pathToFile = staticPkg.getPathToDist(req.params[0])

    send(req, pathToFile)
    .pipe(res)
}
