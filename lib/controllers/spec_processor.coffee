fs          = require("fs")
_           = require("lodash")
path        = require("path")
gutil       = require("gulp-util")
Stream      = require("stream")
coffee      = require("coffee-script")
babelify    = require("babelify")
browserify  = require("browserify")
cjsxify     = require("cjsxify")
Domain      = require("domain")
requirejs   = require("requirejs")

pluginAddModuleExports = require("babel-plugin-add-module-exports")
presetLatest = require("babel-preset-latest")
presetReact = require("babel-preset-react")

module.exports = {
  handle: (spec, req, res, config, next) ->
    res.set({
      "Cache-Control": "no-cache, no-store, must-revalidate"
      "Pragma": "no-cache"
      "Expires": "0"
    })

    res.type "js"

    filePath = path.join(
      config.projectRoot,
      spec
    )

    domain = Domain.create()

    domain.on 'error', ->
      gutil.beep()
      next arguments...

    domain.run =>
      browserify({
        entries: [filePath]
        extensions: [".js", ".jsx", ".coffee", ".cjsx"]
      })
      .transform(cjsxify)
      .transform(babelify, {
        plugins: [pluginAddModuleExports],
        presets: [presetLatest, presetReact],
      })
      ## necessary for enzyme
      ## https://github.com/airbnb/enzyme/blob/master/docs/guides/browserify.md
      .external([
        'react/addons'
        'react/lib/ReactContext'
        'react/lib/ExecutionEnvironment'
      ])
      ## TODO: handle errors gracefully, exposed in UI
      .on('error', (err) -> console.error('Browserify error:', err))
      .bundle()
      .pipe(res)

}
