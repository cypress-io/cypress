send     = require("send")
reporter = require("@cypress/core-reporter")
cwd      = require("../cwd")

 module.exports = {
   serve: (req, res, config) ->
    res.render reporter.getPathToIndex(), {
       config:      JSON.stringify(config)
       projectName: config.projectName
     }

   handle: (req, res) ->
    pathToFile = reporter.getPathToDist(req.params[0])

    send(req, pathToFile)
    .pipe(res)