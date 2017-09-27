sinon = require("sinon")
watchify = require("watchify")

browserify = sinon.stub()
mockery.registerMock("browserify", browserify)

streamApi = {
  on: -> streamApi
  pipe: -> streamApi
}

bundle = require("#{root}lib/util/bundle")

describe "lib/util/bundle", ->

  context "#build", ->
    beforeEach ->
      bundlerApi = @bundlerApi = {
        transform: -> bundlerApi
        external: -> bundlerApi
        on: -> bundlerApi
        bundle: -> streamApi
        close: ->
        plugin: sinon.stub()
      }

      browserify.reset()
      bundle.reset()

      browserify.returns(bundlerApi)

      @config = {
        projectName: "foo"
        projectRoot: "/path/to/root"
        watchForFileChanges: true
      }

    describe "any case / headed mode", ->
      beforeEach ->
        bundle.build("file.js", @config)

      it "runs browserify", ->
        expect(browserify).to.be.called

      it "specifies the abslute path to the file", ->
        expect(browserify.lastCall.args[0].entries[0]).to.equal("/path/to/root/file.js")

      it "specifies extensions", ->
        expect(browserify.lastCall.args[0].extensions).to.eql([".js", ".jsx", ".coffee", ".cjsx"])

      it "watches", ->
        expect(@bundlerApi.plugin).to.be.calledWith(watchify)

    describe "headless mode", ->
      beforeEach ->
        @config.isTextTerminal = true
        bundle.build("file.js", @config)

      it "does not watch", ->
        expect(@bundlerApi.plugin).not.to.be.called

      it "only runs browserify once per file", ->
        expect(browserify).to.be.calledOnce
        bundle.build("file.js", @config)
        expect(browserify).to.be.calledOnce
        bundle.build("another.js", @config)
        expect(browserify).to.be.calledTwice
        bundle.build("another.js", @config)
        expect(browserify).to.be.calledTwice

  context "#clientSideError", ->
    it "send javascript string with the error", ->
      expect(bundle.clientSideError("an error")).to.equal("""
      (function () {
        Cypress.action("spec:script:error", {
          type: "BUNDLE_ERROR",
          error: "an error"
        })
      }())
      """)

    it "replaces new lines with {newline} placeholder", ->
      expect(bundle.clientSideError("with\nnew\nlines")).to.include('error: "with{newline}new{newline}lines"')

    it "removes command line syntax highlighting characters", ->
      expect(bundle.clientSideError("[30mfoo[100mbar[7mbaz")).to.include('error: "foobarbaz"')

  context "#errorMessage", ->
    it "handles error strings", ->
      expect(bundle.errorMessage("error string")).to.include("error string")

    it "handles standard error objects and sends the stack", ->
      err = new Error()
      err.stack = "error object stack"

      expect(bundle.errorMessage(err)).to.equal("error object stack")

    it "sends err.annotated if stack is not present", ->
      err = {
        stack: undefined
        annotated: "annotation"
      }

      expect(bundle.errorMessage(err)).to.equal("annotation")

    it "sends err.message if stack and annotated are not present", ->
      err = {
        stack: undefined
        message: "message"
      }

      expect(bundle.errorMessage(err)).to.equal("message")

    it "removes stack lines", ->
      expect(bundle.errorMessage("foo\n  at what.ever (foo 23:30)\n baz\n    at where.ever (bar 1:5)")).to.equal("foo\n baz")
