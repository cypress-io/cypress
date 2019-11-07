require("../spec_helper")

delete global.fs

api           = require("#{root}lib/api")
user          = require("#{root}lib/user")
logger        = require("#{root}lib/logger")
cache         = require("#{root}lib/cache")
exception     = require("#{root}lib/exception")
Routes        = require("#{root}lib/util/routes")
Settings      = require("#{root}lib/util/settings")
system        = require("#{root}lib/util/system")
pkg           = require("@packages/root")

describe "lib/exceptions", ->
  context ".getAuthToken", ->
    it "returns authToken from cache", ->
      sinon.stub(user, "get").resolves({authToken: "auth-token-123"})

      exception.getAuthToken().then (authToken) ->
        expect(authToken).to.eq("auth-token-123")

    it "returns undefined if no authToken", ->
      sinon.stub(user, "get").resolves({})

      exception.getAuthToken().then (authToken) ->
        expect(authToken).to.be.undinefed

  context ".getErr", ->
    it "returns an object literal", ->
      err = new Error()
      expect(exception.getErr(err)).to.have.keys("name", "message", "stack")

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
        expect(obj.stack).to.be.a("string")
        expect(obj.stack).to.include("foo is not defined")

    describe "path stripping", ->
      beforeEach ->
        @err = {
          name: "Path not found: /Users/ruby/dev/"
          message: "Could not find /Users/ruby/dev/foo.js"
          stack: """
            Error at /Users/ruby/dev/index.js:102
            at foo /Users/ruby/dev/foo.js:4
            at bar /Users/ruby/dev/bar.js:92
          """
        }
        @windowsError = {
          name: "Path not found: \\Users\\ruby\\dev\\"
          message: "Could not find \\Users\\ruby\\dev\\foo.js"
          stack: """
            Error at \\Users\\ruby\\dev\\index.js:102
            at foo \\Users\\ruby\\dev\\foo.js:4
            at bar \\Users\\ruby\\dev\\bar.js:92
          """
        }

      it "strips paths from name, leaving file name and line number", ->
        expect(exception.getErr(@err).name).to.equal("Path not found: <stripped-path>")
        expect(exception.getErr(@windowsError).name).to.equal("Path not found: <stripped-path>")

      it "strips paths from message, leaving file name and line number", ->
        expect(exception.getErr(@err).message).to.equal("Could not find <stripped-path>foo.js")
        expect(exception.getErr(@windowsError).message).to.equal("Could not find <stripped-path>foo.js")

      it "strips paths from stack, leaving file name and line number", ->
        expect(exception.getErr(@err).stack).to.equal("""
          Error at <stripped-path>index.js:102
          at foo <stripped-path>foo.js:4
          at bar <stripped-path>bar.js:92
        """)
        expect(exception.getErr(@windowsError).stack).to.equal("""
          Error at <stripped-path>index.js:102
          at foo <stripped-path>foo.js:4
          at bar <stripped-path>bar.js:92
        """)

      it "handles strippable properties being undefined gracefully", ->
        expect(-> exception.getErr({})).not.to.throw()

  context ".getVersion", ->
    it "returns version from package.json", ->
      sinon.stub(pkg, "version").value("0.1.2")
      expect(exception.getVersion()).to.eq("0.1.2")

  context ".getBody", ->
    beforeEach ->
      @err = new Error()
      sinon.stub(pkg, "version").value("0.1.2")
      sinon.stub(system, "info").resolves({
        system: "info"
      })

    it "sets err", ->
      exception.getBody(@err).then (body) ->
        expect(body.err).to.be.an("object")

    it "sets version", ->
      exception.getBody(@err).then (body) ->
        expect(body.version).to.eq("0.1.2")

    it "sets system info", ->
      exception.getBody(@err).then (body) ->
        expect(body.system).to.eq("info")

  context ".create", ->
    beforeEach ->
      @env = process.env["CYPRESS_ENV"]
      sinon.stub(api, "createCrashReport")

    afterEach ->
      process.env["CYPRESS_ENV"] = @env

    describe "with CYPRESS_CRASH_REPORTS=0", ->
      beforeEach ->
        process.env["CYPRESS_CRASH_REPORTS"] = "0"

      afterEach ->
        delete process.env["CYPRESS_CRASH_REPORTS"]

      it "immediately resolves", ->
        exception.create()
        .then ->
          expect(api.createCrashReport).to.not.be.called

    describe "development", ->
      beforeEach ->
        process.env["CYPRESS_ENV"] = "development"

      it "immediately resolves", ->
        exception.create()
        .then ->
          expect(api.createCrashReport).to.not.be.called

    describe "production", ->
      beforeEach ->
        process.env["CYPRESS_ENV"] = "production"

        @err = {name: "ReferenceError", message: "undefined is not a function", stack: "asfd"}

        sinon.stub(exception, "getBody").resolves({
          err: @err
          version: "0.1.2"
        })

        sinon.stub(exception, "getAuthToken").resolves("auth-token-123")

      it "sends body + authToken to api.createCrashReport", ->
        api.createCrashReport.resolves()

        exception.create().then =>
          body = {
            err: @err
            version: "0.1.2"
          }

          expect(api.createCrashReport).to.be.calledWith(body, "auth-token-123")
