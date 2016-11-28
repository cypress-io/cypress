fs      = require("fs")
errors  = require("../errors")
bundle  = require("../util/bundle")
appData = require("../util/app_data")

module.exports = {
  handle: (spec, req, res, config, next, watchers) ->
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
        errors.log(errors.get("BUNDLE_ERROR", spec, bundle.errorMessage(err)))
        process.exit(1)
    else
      watchers
      .watchBundle(spec, config)
      .then(streamBundle)
      .catch (err) ->
        res.send(bundle.clientSideError(err))

}
