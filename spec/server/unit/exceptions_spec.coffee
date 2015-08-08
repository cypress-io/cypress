root          = "../../../"
expect        = require("chai").expect
nock          = require("nock")
mock          = require("mock-fs")
sinon         = require("sinon")
sinonPromise  = require("sinon-as-promised")
winston       = require("winston")
Promise       = require("bluebird")
Exception     = require("#{root}lib/exception")
Log           = require("#{root}lib/log")
cache         = require("#{root}lib/cache")
Routes        = require("#{root}lib/util/routes")
Settings      = require("#{root}lib/util/settings")

describe "Exceptions", ->
  beforeEach ->
    nock.disableNetConnect()
    @sandbox = sinon.sandbox.create()

  afterEach ->
    mock.restore()
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

  context "#getVersion", ->
    it "returns version from package.json", ->
      mock({
        "package.json": JSON.stringify(version: "0.1.2")
      })

      Exception.getVersion().then (v) ->
        expect(v).to.eq("0.1.2")

  context "#getBody", ->
    beforeEach ->
      @sandbox.stub(cache, "read").resolves({foo: "foo"})
      @sandbox.stub(Log, "getLogs").resolves([])
      @err = new Error
      mock({
        "package.json": JSON.stringify(version: "0.1.2")
      })

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
      settings = {projectId: "abc123"}
      Exception.getBody(@err, settings).then (body) ->
        expect(body.settings).to.eq settings

    it "sets version", ->
      Exception.getBody(@err).then (body) ->
        expect(body.version).to.eq "0.1.2"

  context "#create", ->
    beforeEach ->
      @env = process.env["CYPRESS_ENV"]

    afterEach ->
      process.env["CYPRESS_ENV"] = @env

    describe "development", ->
      beforeEach ->
        process.env["CYPRESS_ENV"] = "development"

      it "immediately resolves", ->
        Exception.create()

    describe "production", ->
      beforeEach ->
        process.env["CYPRESS_ENV"] = "production"

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

      it "requests with correct url, body, headers, and json", ->
        e = @exceptions.reply(200)
        Exception.create().then(e.done)

      it "times out after 3 seconds", (done) ->
        @timeout(6000)

        ## setup the clock so we can coerce time
        # clock = @sandbox.useFakeTimers("setTimeout")

        @exceptions.delayConnection(5000).reply(200)

        Exception.create()
          .then ->
            done("errored: it did not catch the timeout error!")
          .catch Promise.TimeoutError, ->
            done()

        process.nextTick ->
          # clock.tick(5000)
