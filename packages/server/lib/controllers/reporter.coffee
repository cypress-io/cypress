_ = require("lodash")
send = require("send")
reporter = require("@packages/reporter")

module.exports = {
  handle: (req, res) ->
    pathToFile = reporter.getPathToDist(req.params[0])

    send(req, pathToFile)
    .pipe(res)
}
