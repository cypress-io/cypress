require("../spec_helper")

EE = require("events")
Fixtures = require("../support/helpers/fixtures")
fs = require("fs-extra")
path = require("path")
appData = require("#{root}lib/util/app_data")
{ toHashName } = require("#{root}lib/util/saved_state")

plugins = require("#{root}lib/plugins")
preprocessor = require("#{root}lib/preprocessor")

describe "lib/preprocessor", ->
  beforeEach ->
    Fixtures.scaffold()
    @todosPath = Fixtures.projectPath("todos")

    @testPath = path.join(@todosPath, "test.coffee")
    @localPreprocessorPath = path.join(@todosPath, "prep.coffee")

    @plugin = @sandbox.stub().returns("/path/to/output.js")
    plugins.register("on:spec:file:preprocessor", @plugin)

    preprocessor.close()

    @config = {
      preprocessor: "custom"
      projectRoot: @todosPath
    }

  afterEach ->
    mockery.deregisterMock("cypress-custom-preprocessor")

  context "#getFile", ->
    it "executes the plugin with the file path", ->
      preprocessor.getFile("/path/to/test.coffee", @config)
      expect(@plugin).to.be.calledWith(path.join(@todosPath, "/path/to/test.coffee"))

    it "executes the plugin with shouldWatch: false when isTextTerminal: true", ->
      @config.isTextTerminal = true
      preprocessor.getFile("/path/to/test.coffee", @config)
      expect(@plugin.lastCall.args[1]).to.be.eql({ shouldWatch: false })

    it "executes the plugin with shouldWatch: true when isTextTerminal: false", ->
      @config.isTextTerminal = false
      preprocessor.getFile("/path/to/test.coffee", @config)
      expect(@plugin.lastCall.args[1]).to.be.eql({ shouldWatch: true })

    it "executes the plugin with util to get output path", ->
      preprocessor.getFile("/path/to/test.coffee", @config)
      expect(@plugin.lastCall.args[2].getOutputPath).to.be.a("function")
      actualPath = @plugin.lastCall.args[2].getOutputPath("/output/path.js")
      expectedPath = appData.projectsPath(toHashName(@todosPath), "bundles", "/output/path.js")
      expect(actualPath).to.equal(expectedPath)

    it "returns a promise resolved with the plugin's outputPath", ->
      preprocessor.getFile("/path/to/test.coffee", @config).then (filePath) ->
        expect(filePath).to.equal("/path/to/output.js")

    it "calls provides util.fileUpdated", ->
      preprocessor.getFile("/path/to/test.coffee", @config)
      expect(=>
        @plugin.lastCall.args[2].fileUpdated()
      ).not.to.throw()

    it "calls onChange option when util.fileUpdated is called with same file path", ->
      onChange = @sandbox.spy()
      preprocessor.getFile("/path/to/test.coffee", @config, { onChange })
      @plugin.lastCall.args[2].fileUpdated(path.join(@todosPath, "/path/to/test.coffee"))
      expect(onChange).to.be.calledWith(path.join(@todosPath, "/path/to/test.coffee"))

    it "does not onChange option when util.fileUpdated is called with different file path", ->
      onChange = @sandbox.spy()
      preprocessor.getFile("/path/to/test.coffee", @config, { onChange })
      @plugin.lastCall.args[2].fileUpdated(path.join(@todosPath, "/path/to/other.coffee"))
      expect(onChange).not.to.be.called

    it "invokes plugin again when isTextTerminal: false", ->
      @config.isTextTerminal = false
      preprocessor.getFile("/path/to/test.coffee", @config)
      preprocessor.getFile("/path/to/test.coffee", @config)
      expect(@plugin).to.be.calledTwice

    it "does not invoke plugin again when isTextTerminal: true", ->
      @config.isTextTerminal = true
      preprocessor.getFile("/path/to/test.coffee", @config)
      preprocessor.getFile("/path/to/test.coffee", @config)
      expect(@plugin).to.be.calledOnce

  context "#removeFile", ->
    it "calls plugin's onClose callback", ->
      preprocessor.getFile("/path/to/test.coffee", @config)
      onClose = @sandbox.spy()
      @plugin.lastCall.args[2].onClose(onClose)
      fullPath = path.join(@todosPath, "/path/to/test.coffee")
      preprocessor.removeFile(fullPath)
      expect(onClose).to.be.called

  context "#close", ->
    it "calls plugin's onClose callback", ->
      preprocessor.getFile("/path/to/test.coffee", @config)
      onClose = @sandbox.spy()
      @plugin.lastCall.args[2].onClose(onClose)
      fullPath = path.join(@todosPath, "/path/to/test.coffee")
      preprocessor.close()
      expect(onClose).to.be.called

  context "#clientSideError", ->
    beforeEach ->
      @sandbox.stub(console, "error") ## keep noise out of console

    it "send javascript string with the error", ->
      expect(preprocessor.clientSideError("an error")).to.equal("""
      (function () {
        Cypress.action("spec:script:error", {
          type: "BUNDLE_ERROR",
          error: "an error"
        })
      }())
      """)

    it "replaces new lines with {newline} placeholder", ->
      expect(preprocessor.clientSideError("with\nnew\nlines")).to.include('error: "with{newline}new{newline}lines"')

    it "removes command line syntax highlighting characters", ->
      expect(preprocessor.clientSideError("[30mfoo[100mbar[7mbaz")).to.include('error: "foobarbaz"')

  context "#errorMessage", ->
    it "handles error strings", ->
      expect(preprocessor.errorMessage("error string")).to.include("error string")

    it "handles standard error objects and sends the stack", ->
      err = new Error()
      err.stack = "error object stack"

      expect(preprocessor.errorMessage(err)).to.equal("error object stack")

    it "sends err.annotated if stack is not present", ->
      err = {
        stack: undefined
        annotated: "annotation"
      }

      expect(preprocessor.errorMessage(err)).to.equal("annotation")

    it "sends err.message if stack and annotated are not present", ->
      err = {
        stack: undefined
        message: "message"
      }

      expect(preprocessor.errorMessage(err)).to.equal("message")

    it "removes stack lines", ->
      expect(preprocessor.errorMessage("foo\n  at what.ever (foo 23:30)\n baz\n    at where.ever (bar 1:5)")).to.equal("foo\n baz")
