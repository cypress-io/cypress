log = require('debug')('cypress:server:controllers:spec')
errors = require("../errors")
preprocessor = require("../plugins/preprocessor")

module.exports = {
  handle: (spec, req, res, config, next, project) ->
    log("request for", spec)

    res.set({
      "Cache-Control": "no-cache, no-store, must-revalidate"
      "Pragma": "no-cache"
      "Expires": "0"
    })

    res.type("js")

    preprocessor
    .getFile(spec, config)
    .then (filePath) ->
      log("send #{filePath}")
      res.sendFile(filePath)
    .catch (err) ->
      if config.isTextTerminal
        ## bluebird made a change in 3.4.7 where they handle
        ## SyntaxErrors differently here
        ## https://github.com/petkaantonov/bluebird/pull/1295
        ##
        ## their new behavior messes up how we show these errors
        ## so we must backup the original stack and replace it here
        if os = err.originalStack
          err.stack = os

        filePath = err.filePath ? spec

        err = errors.get("BUNDLE_ERROR", filePath, preprocessor.errorMessage(err))

        console.log("")
        errors.log(err)

        project.emit("exitEarlyWithErr", err.message)
      else
        res.send(preprocessor.clientSideError(err))
}
