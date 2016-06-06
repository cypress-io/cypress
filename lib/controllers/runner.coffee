send   = require("send")
runner = require("@cypress/core-runner")

module.exports = {
  handle: (req, res) ->
    pathToFile = runner.getPathToDist(req.params[0])

    send(req, pathToFile)
    .pipe(res)
}
