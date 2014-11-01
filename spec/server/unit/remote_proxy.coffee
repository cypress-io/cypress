nock        = require('nock')
RemoteProxy = require("../../../lib/controllers/remote_proxy")
through2    = require("through2")
through     = require("through")
Readable    = require("stream").Readable
chai        = require('chai')
expect      = chai.expect
_           = require('lodash')

nock.disableNetConnect()

chai
.use(require('sinon-chai'))
.should()

describe "remote proxy", ->
  beforeEach ->
    @baseUrl      = "http://x.com"
    @remoteProxy  = new RemoteProxy
    @res = through2.obj((cnk, enc, cb) -> cb(null, cnk))
    @res.statusCode = 200
    @res.contentType = ->
    @res.redirect = ->

  afterEach ->
    nock.cleanAll()

  it "throws without a session.remote", ->
    expect(-> @remoteProxy.handle({
      session: {}
    })).to.throw

  it "handles GET's", (done) ->
    nock(@baseUrl)
    .get("/bob")
    .reply(200, (uri, b) ->
      r = new Readable
      r.push("ok")
      r.push(null)
      r
    )

    @remoteProxy.handle(
      {
        session:
          remote: @baseUrl
        url: "/__remote/#{@baseUrl}/bob"
      },
      @res,
      (e) -> throw e
    )

    @res.pipe through -> done()

  it "Basic Auth"

  context "VERBS", ->
    beforeEach ->


    context "POST", ->
      it "handle with url params", (done) ->
        nock(@baseUrl)
        .post("/?foo=1&bar=2")
        .reply(200, "ok!")

        @remoteProxy.handle(
          {
            session:
              remote: @baseUrl
            url: "/__remote/#{@baseUrl}?foo=1&bar=2",
            method: 'POST'
          },
          @res,
          (e) -> done(e)
        )

        @res.pipe through (chunk) ->
          expect(chunk.toString()).to.eql("ok!")
          done()

      it "handle body content"

    it "GET"
    it "PUT"
    it "DELETE"
    it "OPTIONS"
    it "PATCH"

  context "websockets", ->

  context "https", ->

  context "headers", ->
    it "passes headers", (done) ->
      nock(@baseUrl, {
        reqheaders: {
          'head': 'goat'
        }
      })
      .get("/")
      .reply(200, "OK")

      @remoteProxy.handle(
        {
          session:
            remote: @baseUrl
          url: "/__remote/#{@baseUrl}/",
          method: 'GET',
          headers:
            'head': 'goat'
        },
        @res,
        (e) -> done(e)
      )

      @res.pipe through (chunk) -> done()