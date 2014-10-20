fs          = require('fs')
_           = require "lodash"
path        = require "path"
Stream      = require("stream")
coffee      = require("coffee-script")
browserify  = require("browserify")
Domain      = require("domain")

module.exports = class extends require('events').EventEmitter
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
    domain.run ->
      ## need halp here
      if opts = app.get("eclectus").browserify
        if _.isObject(opts) then opts else {}
        browserify([stream], opts)
        .bundle()
        .pipe(res)
      else
        stream.pipe(res)