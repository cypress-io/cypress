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
      bundledPath = bundle.outputPath(config.projectRoot, spec)
      fs.createReadStream(bundledPath)
      .pipe(res)

    if config.isTextTerminal
      bundle
      .build(spec, config)
      .getLatestBundle()
      .then(streamBundle)
      .catch (err) ->
        ## bluebird made a change in 3.4.7 where they handle
        ## SyntaxErrors differently here
        ## https://github.com/petkaantonov/bluebird/pull/1295
        ##
        ## their new behavior messes us how we show these errors
        ## so we must backup the original stack and replace it here
        if os = err.originalStack
          err.stack = os

        filePath = err.filePath ? spec

        err = errors.get("BUNDLE_ERROR", filePath, bundle.errorMessage(err))

        errors.log(err)

        project.emit("exitEarlyWithErr", err.message)
    else
      watchers
      .watchBundle(spec, config)
      .then(streamBundle)
      .catch (err) ->
        res.send(bundle.clientSideError(err))

}
