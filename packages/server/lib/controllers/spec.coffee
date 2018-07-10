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
      res.send(preprocessor.clientSideError(err))
}
