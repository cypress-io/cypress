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

Controller  = require "./controller"

class SpecProcessor extends Controller
  constructor: (app) ->
    if not (@ instanceof SpecProcessor)
      return new SpecProcessor(app)

    @app = app

    super

  browserify: (opts, fileStream) ->
    browserify([fileStream], opts)
    .transform({}, coffeeify)
    .bundle()

  # requirejs: (opts, fileStream) ->
  #   requirejs opts, (buildResponse) ->
  #     debugger

  handle: (spec, req, res, next) ->
    res.type "js"

    settings = @app.get("cypress")

    filePath = path.join(
      settings.projectRoot,
      settings.testFolder,
      spec
    )

    config =
      baseUrl: process.cwd()
      name: filePath
      out: "main.js"

    if settings.requirejs
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
      if opts = settings.browserify
        @browserify(opts, stream)
        .pipe(res)
      # if opts = settings.requirejs
        # @requirejs(opts, stream)
        # .pipe(res)
      else
        stream.pipe(res)

module.exports = SpecProcessor