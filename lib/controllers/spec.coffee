fs = require("fs")

appData = require("../util/app_data")
bundle = require("../util/bundle")

module.exports = {
  handle: (spec, req, res, config, next, watchers) ->
    res.set({
      "Cache-Control": "no-cache, no-store, must-revalidate"
      "Pragma": "no-cache"
      "Expires": "0"
    })

    res.type "js"

    watchers
    .watchBundle(spec, config)
    .then ->
      fs.createReadStream(appData.path("bundles", spec))
      .pipe(res)
    .catch (err) ->
      res.send(bundle.error(err))

}
