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
Snockets    = require("snockets")
requirejs   = require("requirejs")

pluginAddModuleExports = require("babel-plugin-add-module-exports")
presetLatest = require("babel-preset-latest")
presetReact = require("babel-preset-react")

isTestFile = (filePath, integrationFolder) ->
  filePath.indexOf(integrationFolder) > -1

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
      contentsStream = if isTestFile(filePath, config.integrationFolder)
        @streamTestFile(filePath, res)
      else
        @streamNonTestFile(filePath, res)

      contentsStream.pipe(res)

  streamTestFile: (filePath) ->
    return browserify({
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

  streamNonTestFile: (filePath) ->
    snockets = new Snockets()

    ## dependencies returns an array of objects for all of the dependencies
    ## filename: 'tests/integration.js'
    ## js: <<compiled js string>>

    ## in other words snockets automatically renames .coffee files to .js
    ## and it also automatically compiles the coffee to js
    ## we might want to disable this, and instead use the `scan` method
    ## to just build the dependency graph and handling compiling it ourselves
    dependencies = snockets.getCompiledChain filePath, {async: false}

    ## pluck out the js raw content and join with a semicolon + new line
    contents     = _.map(dependencies, "js").join(";\n")

    stream = new Stream.Readable()
    stream.push(contents)
    stream.push(null)

    return stream

}
