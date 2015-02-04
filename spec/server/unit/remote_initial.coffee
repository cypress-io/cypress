root          = "../../../"
Server        = require("#{root}lib/server")
RemoteInitial = require("#{root}lib/controllers/remote_initial")
Readable      = require("stream").Readable
expect        = require("chai").expect
through       = require("through")
nock          = require('nock')
sinon         = require('sinon')
supertest     = require("supertest")

describe "Remote Initial", ->
  beforeEach ->
    @sandbox = sinon.sandbox.create()
    @sandbox.stub(Server.prototype, "getCypressJson").returns({})

    @server = Server("/Users/brian/app")
    @app    = @server.app
    @app.set("cypress", {
      projectRoot: "/Users/brian/app"
    })

    @remoteInitial = RemoteInitial(@app)
    @res = through (d) ->
    @res.send = ->
    @res.redirect = ->
    @res.contentType = ->
    @res.status = => @res
    @baseUrl = "http://foo.com"
    @redirectUrl  = "http://x.com"

  afterEach ->
    @sandbox.restore()
    nock.cleanAll()
    nock.enableNetConnect()

  describe "unit", ->
    beforeEach ->
      nock.disableNetConnect()

    it "returns a new instance", ->
      expect(@remoteInitial).to.be.instanceOf(RemoteInitial)

    it "injects content", (done) ->
      readable = new Readable

      readable.push('<head></head><body></body>')
      readable.push(null)

      readable.pipe(RemoteInitial::injectContent("wow"))
      .pipe through (d) ->
        expect(d.toString()).to.eq("<head> wow</head><body></body>")
        done()

    it "bubbles up 500 on fetch error", (done) ->
      @req =
        url: "/__remote/#{@baseUrl}"
        session: {}

      @remoteInitial.handle(@req, @res)

      @res.send = (d) ->
        expect(d).to.eql(
          "Error getting http://foo.com <pre>Nock: Not allow net connect for \"foo.com:80\"</pre>"
        )

        done()

    describe "redirects", ->
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
          @remoteInitial.handle(@req, @res)

      it "redirects on 301", (done) ->
        nock(@redirectUrl)
        .get("/")
        .reply(200, =>
          done()
        )

        @remoteInitial.handle(@req, @res)

      it "resets session remote after a redirect", (done) ->
        nock(@redirectUrl)
        .get("/")
        .reply(200, =>
          expect(@req.session.remote).to.eql("http://x.com/")
          done()
        )

        @remoteInitial.handle(@req, @res)

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

        @remoteInitial.handle(@req, @res)

        expect(@req.session.remote).to.eql(@baseUrl)

      it "does not include query params in the url", ->
        @req =
          url: "/__remote/#{@baseUrl}?foo=bar"
          session: {}

        @remoteInitial.handle(@req, @res)
        expect(@req.session.remote).to.eql(@baseUrl)

  context.only "integration", ->
    beforeEach ->
      @server.configureApplication()

    it "basic 200 html response", (done) ->
      nock(@baseUrl)
      .get("/bar?__initial=true")
      .reply 200, "hello from bar!", {
        "Content-Type": "text/html"
      }

      supertest(@app)
        .get("/__remote/#{@baseUrl}/bar?__initial=true")
        .expect(200, "hello from bar!")
        .end(done)

    describe "headers", ->
      it "forwards headers on outgoing requests", (done) ->
        nock(@baseUrl)
        .get("/bar?__initial=true")
        .matchHeader("x-custom", "value")
        .reply 200, "hello from bar!", {
          "Content-Type": "text/html"
        }

        supertest(@app)
          .get("/__remote/#{@baseUrl}/bar?__initial=true")
          .set("x-custom", "value")
          .expect(200, "hello from bar!")
          .end(done)

  context "relative files", ->

  context "absolute files", ->

  context "file files", ->

  context "errors", ->
    it "bubbles 500's from external server"

    it "throws on authentication required"
