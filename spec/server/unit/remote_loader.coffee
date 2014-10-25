remoteLoader  = require('../../../lib/controllers/remote_loader')
Readable      = require("stream").Readable
expect        = require("chai").expect
through       = require("through")

describe "Remote Loader", ->
  it 'injects content', (done) ->
    readable = new Readable

    readable.push('<head></head><body></body>')
    readable.push(null)

    readable.pipe(remoteLoader::injectContent("wow"))
    .pipe through (d) ->
      expect(d.toString()).to.eq("<head> wow</head><body></body>")
      done()