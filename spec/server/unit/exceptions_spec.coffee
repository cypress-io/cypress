root          = "../../../"
expect        = require("chai").expect
nock          = require("nock")
sinon         = require("sinon")
sinonPromise  = require("sinon-as-promised")
winston       = require("winston")
Exception     = require("#{root}lib/exception")
Log           = require("#{root}lib/log")
cache         = require("#{root}lib/cache")
Routes        = require("#{root}lib/util/routes")
Settings      = require("#{root}lib/util/settings")

describe.only "Exceptions", ->
  beforeEach ->
    nock.disableNetConnect()
    @sandbox = sinon.sandbox.create()

  afterEach ->
    nock.cleanAll()
    nock.enableNetConnect()
    @sandbox.restore()

  context "#getUrl", ->
    it "returns Routes.exceptions_path()", ->
      expect(Exception.getUrl()).to.eq Routes.exceptions()

  context "#getHeaders", ->
    it "returns session from cache", ->
      @sandbox.stub(cache, "getUser").resolves({session_token: "abc123"})

      Exception.getHeaders().then (obj) ->
        expect(obj).to.deep.eq {
          "x-session": "abc123"
        }

    it "returns empty object if no session_token", ->
      @sandbox.stub(cache, "getUser").resolves({})

      Exception.getHeaders().then (obj) ->
        expect(obj).to.deep.eq {}

  context "#getErr", ->
    it "returns an object literal", ->
      err = new Error
      expect(Exception.getErr(err)).to.have.keys("name", "message", "stack", "info")

    describe "fields", ->
      beforeEach ->
        try
          foo.bar()
        catch err
          @err = err


      it "has name", ->
        obj = Exception.getErr(@err)
        expect(obj.name).to.eq @err.name

      it "has message", ->
        obj = Exception.getErr(@err)
        expect(obj.message).to.eq @err.message

      it "has stack", ->
        obj = Exception.getErr(@err)
        expect(obj.stack).to.eq @err.stack

      it "has info", ->
        getAllInfo = @sandbox.stub(winston.exception, "getAllInfo").returns({})
        obj = Exception.getErr(@err)
        expect(obj.info).to.be.an("object")
        expect(getAllInfo).to.be.calledWith(@err)

  context "#getBody", ->
    beforeEach ->
      @sandbox.stub(cache, "read").resolves({foo: "foo"})
      @sandbox.stub(Log, "getLogs").resolves([])
      @sandbox.stub(Settings, "read").resolves({projectId: "abc123", version: "0.1.2"})
      @err = new Error

    it "sets err", ->
      Exception.getBody(@err).then (body) ->
        expect(body.err).to.be.an("object")

    it "sets cache", ->
      Exception.getBody(@err).then (body) ->
        expect(body.cache).to.deep.eq {foo: "foo"}

    it "sets logs", ->
      Exception.getBody(@err).then (body) ->
        expect(body.logs).to.deep.eq []

    it "sets settings", ->
      Exception.getBody(@err).then (body) ->
        expect(body.settings).to.deep.eq {projectId: "abc123", version: "0.1.2"}

    it "sets version", ->
      Exception.getBody(@err).then (body) ->
        expect(body.version).to.eq "0.1.2"

  context "#create", ->
    beforeEach ->
      err = {name: "ReferenceError", message: "undefined is not a function", stack: "asfd"}

      @sandbox.stub(Exception, "getBody").resolves({
        err: err
        cache: {}
        logs: []
        settings: {}
        version: "0.1.2"
      })

      @sandbox.stub(Exception, "getHeaders").resolves({"x-session": "abc123"})

      @exceptions = nock(Routes.api())
        .log(console.log)
        .post "/exceptions", (body) ->
          expect(body.err).to.deep.eq(err)
          expect(body.cache).to.deep.eq({})
          expect(body.logs).to.deep.eq([])
          expect(body.settings).to.deep.eq({})
          expect(body.version).to.eq("0.1.2")
          true
        .matchHeader("X-Session", "abc123")
        .matchHeader("accept", "application/json")
        .reply(200)

    it "requests with correct url, body, headers, and json", ->
      Exception.create().then(@exceptions.done)