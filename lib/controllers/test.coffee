fs          = require('fs')
_           = require "lodash"
path        = require "path"
Stream      = require("stream")
coffee      = require("coffee-script")
browserify  = require("browserify")
coffeeify   = require("coffeeify")
Domain      = require("domain")

module.exports = class extends require('events').EventEmitter
  browserify: (opts, fileStream) ->
    browserify([fileStream], opts)
    .transform({}, coffeeify)
    .bundle()

  handle: (opts, req, res, next) =>
    res.type "js"

    {testFolder, spec} = opts

    filePath = path.join(testFolder, spec)
    file = fs.readFileSync(filePath, "utf8")

    file = coffee.compile(file) if path.extname(spec) is ".coffee"

    stream = new Stream.Readable()
    stream.push(file)
    stream.push(null)

    domain = Domain.create()
    domain.on 'error', next
    domain.run =>
      if opts = app.get("eclectus").browserify
        @browserify(opts, stream)
        .pipe(res)
      else
        stream.pipe(res)