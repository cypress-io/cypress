fs          = require 'fs'
_           = require 'lodash'
path        = require 'path'
gutil       = require 'gulp-util'
Stream      = require 'stream'
coffee      = require 'coffee-script'
browserify  = require 'browserify'
coffeeify   = require 'coffeeify'
Domain      = require 'domain'
Snockets    = require 'snockets'
requirejs   = require 'requirejs'

module.exports = class extends require('events').EventEmitter
  browserify: (opts, fileStream) ->
    browserify([fileStream], opts)
    .transform({}, coffeeify)
    .bundle()

  # requirejs: (opts, fileStream) ->
  #   requirejs opts, (buildResponse) ->
  #     debugger

  handle: (opts, req, res, next) =>
    res.type "js"

    {testFolder, spec} = opts

    filePath = path.join(testFolder, spec)

    config =
      baseUrl: process.cwd()
      name: filePath
      out: "main.js"

    if app.get("eclectus").requirejs
      requirejs.optimize config, (buildResponse) ->
        ## need to wrap these contents with almond so we dont
        ## have to add the require.js script tag (which is huge)
        contents = fs.readFileSync(config.out, 'utf8')

        ## also we need to delete config.out since requirejs
        ## generates this
        debugger

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
    contents     = _.pluck(dependencies, "js").join(";\n")

    stream = new Stream.Readable()
    stream.push(contents)
    stream.push(null)

    domain = Domain.create()
    domain.on 'error', ->
      gutil.beep()
      next arguments...
    domain.run =>
      if opts = app.get("eclectus").browserify
        @browserify(opts, stream)
        .pipe(res)
      # if opts = app.get("eclectus").requirejs
        # @requirejs(opts, stream)
        # .pipe(res)
      else
        stream.pipe(res)
