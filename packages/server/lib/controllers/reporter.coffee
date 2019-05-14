_ = require("lodash")
send = require("send")

pathToReporter = require.resolve("@packages/reporter")
reporter = require("#{pathToReporter}/lib/resolve-dist")

module.exports = {
  handle: (req, res) ->
    pathToFile = reporter.getPathToDist(req.params[0])

    send(req, pathToFile)
    .pipe(res)
}
