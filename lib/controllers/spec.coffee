fs      = require("fs")
errors  = require("../errors")
bundle  = require("../util/bundle")
appData = require("../util/app_data")

module.exports = {
  handle: (spec, req, res, config, next, watchers, project) ->
    res.set({
      "Cache-Control": "no-cache, no-store, must-revalidate"
      "Pragma": "no-cache"
      "Expires": "0"
    })

    res.type("js")

    streamBundle = ->
      fs.createReadStream(appData.path("bundles", spec))
      .pipe(res)

    if config.isHeadless
      bundle
      .build(spec, config)
      .getLatestBundle()
      .then(streamBundle)
      .catch (err) ->
        filePath = err.filePath ? spec

        err = errors.get("BUNDLE_ERROR", filePath, bundle.errorMessage(err))

        errors.log(err)

        project.emit("exitEarlyWithErr", errors.stripAnsi(err.message))
    else
      watchers
      .watchBundle(spec, config)
      .then(streamBundle)
      .catch (err) ->
        res.send(bundle.clientSideError(err))

}
