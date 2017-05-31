send   = require("send")
driver = require("@packages/driver")

module.exports = {
  handle: (req, res) ->
    pathToFile = driver.getPathToDist(req.params[0])

    send(req, pathToFile)
    .pipe(res)
}
