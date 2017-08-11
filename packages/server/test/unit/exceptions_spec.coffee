require("../spec_helper")

delete global.fs

winston       = require("winston")
api           = require("#{root}lib/api")
user          = require("#{root}lib/user")
logger        = require("#{root}lib/logger")
cache         = require("#{root}lib/cache")
exception     = require("#{root}lib/exception")
Routes        = require("#{root}lib/util/routes")
Settings      = require("#{root}lib/util/settings")
pkg           = require("@packages/root")

describe "lib/exceptions", ->
  context ".getAuthToken", ->
    it "returns authToken from cache", ->
      @sandbox.stub(user, "get").resolves({authToken: "auth-token-123"})

      exception.getAuthToken().then (authToken) ->
        expect(authToken).to.eq("auth-token-123")

    it "returns undefined if no authToken", ->
      @sandbox.stub(user, "get").resolves({})

      exception.getAuthToken().then (authToken) ->
        expect(authToken).to.be.undinefed

  context ".getErr", ->
    it "returns an object literal", ->
      err = new Error()
      expect(exception.getErr(err)).to.have.keys("name", "message", "stack", "info")

    describe "fields", ->
      beforeEach ->
        try
          foo.bar()
        catch err
          @err = err


      it "has name", ->
        obj = exception.getErr(@err)
        expect(obj.name).to.eq @err.name

      it "has message", ->
        obj = exception.getErr(@err)
        expect(obj.message).to.eq @err.message

      it "has stack", ->
        obj = exception.getErr(@err)
        expect(obj.stack).to.eq @err.stack

      it "has info", ->
        getAllInfo = @sandbox.stub(winston.exception, "getAllInfo").returns({})
        obj = exception.getErr(@err)
        expect(obj.info).to.be.an("object")
        expect(getAllInfo).to.be.calledWith(@err)

  context ".getVersion", ->
    it "returns version from package.json", ->
      @sandbox.stub(pkg, "version", "0.1.2")

      exception.getVersion().then (v) ->
        expect(v).to.eq("0.1.2")

  context ".getBody", ->
    beforeEach ->
      @sandbox.stub(cache, "read").resolves({foo: "foo"})
      @sandbox.stub(logger, "getLogs").resolves([])
      @err = new Error()
      @sandbox.stub(pkg, "version", "0.1.2")

    it "sets err", ->
      exception.getBody(@err).then (body) ->
        expect(body.err).to.be.an("object")

    it "sets cache", ->
      exception.getBody(@err).then (body) ->
        expect(body.cache).to.deep.eq {foo: "foo"}

    it "sets logs", ->
      exception.getBody(@err).then (body) ->
        expect(body.logs).to.deep.eq []

    it "sets settings", ->
      settings = {projectId: "abc123"}
      exception.getBody(@err, settings).then (body) ->
        expect(body.settings).to.eq settings

    it "sets version", ->
      exception.getBody(@err).then (body) ->
        expect(body.version).to.eq "0.1.2"

  context ".create", ->
    beforeEach ->
      @env = process.env["CYPRESS_ENV"]

    afterEach ->
      process.env["CYPRESS_ENV"] = @env

    describe "development", ->
      beforeEach ->
        process.env["CYPRESS_ENV"] = "development"

      it "immediately resolves", ->
        exception.create()

    describe "production", ->
      beforeEach ->
        process.env["CYPRESS_ENV"] = "production"

        @err = {name: "ReferenceError", message: "undefined is not a function", stack: "asfd"}

        @sandbox.stub(exception, "getBody").resolves({
          err: @err
          cache: {}
          logs: []
          settings: {}
          version: "0.1.2"
        })

        @sandbox.stub(exception, "getAuthToken").resolves("auth-token-123")

        @sandbox.stub(api, "createRaygunException")

      it "sends body + authToken to api.createRaygunException", ->
        api.createRaygunException.resolves()

        exception.create().then =>
          body = {
            err: @err
            cache: {}
            logs: []
            settings: {}
            version: "0.1.2"
          }

          expect(api.createRaygunException).to.be.calledWith(body, "auth-token-123")
