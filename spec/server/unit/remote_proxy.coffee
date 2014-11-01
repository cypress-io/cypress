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

    resStream = through2.obj((chunk, enc, cb) ->
      cb(null, chunk)
      done()
    )

    resStream.redirect = ->

    resStream.contentType = ->

    @remoteProxy.handle(
      {
        session:
          remote: @baseUrl
        url: "/__remote/#{@baseUrl}/bob"
      },
      resStream,
      (e) -> throw e
    )

  it "Basic Auth"

  context "VERBS", ->
    it "GET"

    context "POST", ->
      it "handle with url params", (done) ->
        nock(@baseUrl)
        .post("/?foo=1&bar=2")
        .reply(200, "ok!")

        @res = through2.obj((cnk, enc, cb) -> cb(null, cnk))

        @res.statusCode = 200
        @res.contentType = ->

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

    it "PUT"

    it "DELETE"

    it "OPTIONS"

    it "PATCH"

  context "websockets", ->

  context "https", ->

  context "headers", ->

    it "Custom Headers"