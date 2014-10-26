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

  context "setting session", ->
    it "sets immediately before requests"

    it "resets after a redirect"

    it "does not include query params in the url"

    it "does not include __remote in the url"

  it "redirects on 301, 302, 307, 308"

  it "bubbles up 500 on fetch error"

  context "relative files", ->

  context "absolute files", ->

  context "file files", ->

  context "errors", ->
    it "bubbles 500's from external server"

    it "throws on authentication required"