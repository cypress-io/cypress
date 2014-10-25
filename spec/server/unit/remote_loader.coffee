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

  it "sets session on __initial"

  it "session does not include __remote"

  it "redirects on 301, 302, 307, 308"

  it "bubbles up 500 on fetch error"

  context "relative files"

  context "absolute files"

  context "file files"

  context "errors", ->
    it "bubbles 500's from external server"

    it "throws on authentication required"