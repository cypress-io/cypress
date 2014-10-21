fs          = require('fs')
_           = require "lodash"
path        = require "path"
Stream      = require("stream")
coffee      = require("coffee-script")
browserify  = require("browserify")
coffeeify   = require("coffeeify")
Domain      = require("domain")
Snockets    = require("snockets")

module.exports = class extends require('events').EventEmitter
  browserify: (opts, fileStream) ->
    browserify([fileStream], opts)
    .transform({}, coffeeify)
    .bundle()

  handle: (opts, req, res, next) =>
    res.type "js"

    {testFolder, spec} = opts

    filePath = path.join(testFolder, spec)

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
    domain.on 'error', next
    domain.run =>
      if opts = app.get("eclectus").browserify
        @browserify(opts, stream)
        .pipe(res)
      else
        stream.pipe(res)