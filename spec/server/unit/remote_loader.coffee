RemoteLoader  = require('../../../lib/controllers/remote_loader')
Readable      = require("stream").Readable
expect        = require("chai").expect
through       = require("through")
nock          = require('nock')
sinon         = require('sinon')

describe "Remote Loader", ->
  beforeEach ->
    @remoteLoader = new RemoteLoader
    @res = through (d) ->
    @res.redirect = ->
    @res.contentType = ->
    @next = ->
    @baseUrl = "http://foo.com"
    @redirectUrl  = "http://x.com"

  it 'injects content', (done) ->
    readable = new Readable

    readable.push('<head></head><body></body>')
    readable.push(null)

    readable.pipe(RemoteLoader::injectContent("wow"))
    .pipe through (d) ->
      expect(d.toString()).to.eq("<head> wow</head><body></body>")
      done()

  describe.only "redirects", ->
    beforeEach ->
      @req = {
        url: "/__remote/#{@baseUrl}/",
        session: {}
      }

      nock(@baseUrl)
      .get("/")
      .reply(301, "", {
        'location': @redirectUrl
      })

      @res.redirect = (loc) =>
        @req.url = loc
        @remoteLoader.handle(@req, @res, @next)

    it "redirects on 301", (done) ->
      nock(@redirectUrl)
      .get("/")
      .reply(200, =>
        done()
      )

      @remoteLoader.handle(@req, @res, @next)

    it "resets session remote after a redirect", (done) ->
      nock(@redirectUrl)
      .get("/")
      .reply(200, =>
        expect(@req.session.remote).to.eql("http://x.com/")
        done()
      )

      @remoteLoader.handle(@req, @res, @next)

  context "setting session", ->
    beforeEach ->
      nock(@baseUrl)
      .get("/")
      .reply(200)

      nock(@baseUrl)
      .get("/?foo=bar")
      .reply(200)

    it "sets immediately before requests", ->
      @req =
        url: "/__remote/#{@baseUrl}"
        session: {}

      @remoteLoader.handle(@req, @res, @next)

      expect(@req.session.remote).to.eql(@baseUrl)

    it "does not include query params in the url", ->
      @req =
        url: "/__remote/#{@baseUrl}?foo=bar"
        session: {}

      @remoteLoader.handle(@req, @res, @next)
      expect(@req.session.remote).to.eql(@baseUrl)

  it "bubbles up 500 on fetch error"

  context "relative files", ->

  context "absolute files", ->

  context "file files", ->

  context "errors", ->
    it "bubbles 500's from external server"

    it "throws on authentication required"