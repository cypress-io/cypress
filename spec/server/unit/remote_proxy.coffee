nock        = require('nock')
RemoteProxy = require("../../../lib/controllers/remote_proxy")
through2    = require("through2")
Readable    = require("stream").Readable
chai        = require('chai')
expect      = chai.expect
_           = require('lodash')

chai
.use(require('sinon-chai'))
.should()

describe "remote proxy", ->
  beforeEach ->
    @baseUrl      = "http://x.com"
    @remoteProxy  = new RemoteProxy

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

    it "POST"

    it "PUT"

    it "DELETE"

    it "OPTIONS"

    it "PATCH"

  context "websockets", ->

  context "https", ->

  context "headers", ->

    it "Custom Headers"