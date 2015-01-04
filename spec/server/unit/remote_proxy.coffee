nock        = require('nock')
RemoteProxy = require("../../../lib/controllers/remote_proxy")
through2    = require("through2")
through     = require("through")
Readable    = require("stream").Readable
chai        = require('chai')
expect      = chai.expect
_           = require('lodash')


chai
.use(require('sinon-chai'))
.should()

describe "remote proxy", ->
  beforeEach ->
    nock.disableNetConnect()
    @baseUrl      = "http://www.x.com"
    @remoteProxy  = new RemoteProxy
    @res = through2.obj((cnk, enc, cb) -> cb(null, cnk))
    @res = _.extend(@res,
      statusCode: 200
      contentType: ->
      redirect: ->
      setHeader: ->
      writeHead: ->
    )

    @req = through2.obj (d, enc, cb) -> cb(null, d)

    @req = _.extend(@req, {
      session:
        remote: @baseUrl
      headers: {}
    })

  afterEach ->
    nock.cleanAll()
    nock.enableNetConnect()

  it "throws without a session.remote", ->
    expect(-> @remoteProxy.handle({
      session: {}
    })).to.throw

  it "handles absolute requests", (fin) ->
    nock(@baseUrl)
    .get("/bob.css")
    .reply(200)

    @req = _.extend(@req, {
      url: "/bob.css"
      method: "GET"
    })

    @remoteProxy.handle(
      @req
      @res
      (e) -> throw e
    )

    @res.on 'end', (e) -> fin()

    @req.end()

  context "relative requests from root", ->
    it "works with a single level up", (done) ->
      nock(@baseUrl)
      .get("/bob.css")
      .reply(200)

      @req = _.extend(@req, {
        url: "/__remote/http://bob.css"
        method: "GET"
      })

      @remoteProxy.handle(
        @req
        @res
        (e) -> throw e
      )

      @res.on 'end', (e) -> done()

      @req.end()

    it "works with nested paths", (done) ->
      nock(@baseUrl)
      .get("/bob/tom/george.css")
      .reply(200)

      @req = _.extend(@req, {
        url: "/__remote/http://bob/tom/george.css"
        method: "GET"
      })

      @remoteProxy.handle(
        @req
        @res
        (e) -> throw e
      )

      @res.on 'end', (e) -> done()
      @req.end()

    it "works with a multiple levels up", (done) ->
      nock(@baseUrl)
      .get("/bob")
      .reply(200)

      @req = _.extend(@req, {
        url: "/__remote/http:/bob"
        method: "GET"
      })

      @remoteProxy.handle(
        @req
        @res
        (e) -> throw e
      )

      @res.on 'end', (e) -> done()

      @req.end()

  it "handles GET's", (done) ->
    nock(@baseUrl)
    .get("/bob")
    .reply(200)

    @req = _.extend(@req, {
      url: "/__remote/bob"
      method: "GET"
    })

    @remoteProxy.handle(
      @req
      @res
      (e) -> throw e
    )

    @res.on 'end', (e) -> done()

    @req.end()

  it "Basic Auth"

  context "VERBS", ->
    beforeEach ->

    context "POST", ->
      it "handle with url params", (done) ->
        nock(@baseUrl)
        .post("/?foo=1&bar=2")
        .reply(200)

        @req = _.extend(@req, {
          url: "/__remote/#{@baseUrl}?foo=1&bar=2",
          method: 'POST'
        })

        @remoteProxy.handle(@req, @res, (e) -> done(e))

        @res.on 'end', -> done()

        @req.end()

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
      .reply(200)

      @req = _.extend(@req, {
        url: "/__remote/#{@baseUrl}/",
        method: 'GET',
        headers:
          'head': 'goat'
      })

      @remoteProxy.handle(@req, @res, (e) -> done(e))
      @res.on 'end', -> done()

      @req.end()
