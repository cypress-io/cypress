send   = require("send")
runner = require("@cypress/core-runner")
cwd    = require("../cwd")

module.exports = {
  serve: (req, res, config) ->
    res.render cwd("lib", "public", "runner.html"), {
      config:      JSON.stringify(config)
      projectName: config.projectName
    }

  handle: (req, res) ->
    pathToFile = runner.getPathToDist(req.params[0])

    send(req, pathToFile)
    .pipe(res)
}
