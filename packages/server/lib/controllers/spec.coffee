log = require("debug")("cypress:server:controllers:spec")
Promise = require("bluebird")
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
      sendFile = Promise.promisify(res.sendFile.bind(res))
      sendFile(filePath)
    .catch { code: "ECONNABORTED" }, (err) ->
      ## https://github.com/cypress-io/cypress/issues/1877
      ## now that we are properly catching errors from
      ## res.sendFile, sendFile will reject if the browser aborts
      ## its internal requests (as it shuts down) with
      ## ECONNABORTED. This happens because if a previous spec
      ## file is unable to be transpiled correctly, we immediately
      ## shut down the run, which closes the browser, triggering
      ## the browser to abort the request which would end up here
      ## and display two different errors.
      return
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
