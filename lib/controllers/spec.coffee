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
      fs.createReadStream(bundle.outputPath(config.projectName, spec))
      .pipe(res)

    if config.isHeadless
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
        ## so we must splice out the 2nd element in our stack array
        if err.name is "SyntaxError"
          stack = err.stack.split("\n")
          stack.splice(1, 1)
          err.stack = stack.join("\n")

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
