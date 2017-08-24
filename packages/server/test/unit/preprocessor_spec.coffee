require("../spec_helper")

EE = require("events")
Fixtures = require("../support/helpers/fixtures")
fs = require("fs-extra")
path = require("path")
appData = require("#{root}lib/util/app_data")
{ toHashName } = require("#{root}lib/util/saved_state")

preprocessor = require("#{root}lib/preprocessor")

describe "lib/preprocessor", ->
  beforeEach ->
    Fixtures.scaffold()
    @todosPath = Fixtures.projectPath("todos")

    @testPath = path.join(@todosPath, "test.coffee")
    @localPreprocessorPath = path.join(@todosPath, "prep.coffee")

    @config = {
      preprocessor: "custom"
      projectRoot: @todosPath
    }

    @registerPreprocessor = (customPreprocessor) =>
      mockery.registerMock("cypress-custom-preprocessor", customPreprocessor)

  afterEach ->
    mockery.deregisterMock("cypress-custom-preprocessor")

  context "#prep", ->
    beforeEach ->
      @originalCwd = process.cwd()

    afterEach ->
      process.chdir(@originalCwd)

    it "throws if config.preprocessor is not a string", ->
      expect(-> preprocessor.prep({ preprocessor: null })).to.throw("config.preprocessor must be a string")

    it "can load an npm package preprocessor", ->
      @registerPreprocessor(=> => @testPath)
      expect(-> preprocessor.prep({ preprocessor: "custom" })).not.to.throw()

    it "can load a local preprocessor", ->
      fs.outputFileSync(@testPath, "it('pends')")
      fs.outputFileSync(@localPreprocessorPath, "module.exports = -> -> '#{@testPath}'")
      process.chdir(@todosPath)
      expect(-> preprocessor.prep({ preprocessor: "prep" })).not.to.throw()

    it "calls preprocessor with shouldWatch: false when isTextTerminal: true", ->
      customPreprocessor = @sandbox.stub().returns(=> @testPath)
      @registerPreprocessor(customPreprocessor)
      preprocessor.prep({ preprocessor: "custom", isTextTerminal: true })
      expect(customPreprocessor).to.be.calledWith({ shouldWatch: false })

    it "calls preprocessor with shouldWatch: true when isTextTerminal: false", ->
      customPreprocessor = @sandbox.stub().returns(=> @testPath)
      @registerPreprocessor(customPreprocessor)
      preprocessor.prep({ preprocessor: "custom", isTextTerminal: false })
      expect(customPreprocessor).to.be.calledWith({ shouldWatch: true })

    it "calls preprocessor with event emitter", ->
      customPreprocessor = @sandbox.stub().returns(=> @testPath)
      @registerPreprocessor(customPreprocessor)
      preprocessor.prep({ preprocessor: "custom" })
      expect(customPreprocessor.lastCall.args[1]).to.be.an.instanceOf(EE)

    it "calls preprocessor with util to get output path", ->
      customPreprocessor = @sandbox.stub().returns(=> @testPath)
      @registerPreprocessor(customPreprocessor)
      preprocessor.prep({ preprocessor: "custom", projectRoot: @todosPath })
      expect(customPreprocessor.lastCall.args[2].getOutputPath).to.be.a("function")
      actualPath = customPreprocessor.lastCall.args[2].getOutputPath("/output/path.js")
      expectedPath = appData.projectsPath(toHashName(@todosPath), "bundles", "/output/path.js")
      expect(actualPath).to.equal(expectedPath)

    it "throws if it cannot find the preprocessor", ->
      expect(-> preprocessor.prep({preprocessor: "nonexistent" })).to.throw("""
          Could not find preprocessor 'nonexistent'

          We looked for one of the following, but could not find it:
          * An npm package named 'cypress-nonexistent-preprocessor'
          * A file located at '#{path.join(process.cwd(), "nonexistent")}'
      """)

    it "throws if preprocessor is not a function", ->
      @registerPreprocessor(null)
      expect(-> preprocessor.prep({ preprocessor: "custom" })).to.throw("preprocessor must be a function")

    it "throws if preprocessor does not return a function", ->
      @registerPreprocessor(-> null)
      expect(-> preprocessor.prep({ preprocessor: "custom" })).to.throw("preprocessor must return a function")

  context "#getFile", ->
    it "throws if preprocessor has not been prepped", ->
      expect(=> preprocessor.getFile(@testPath, @config)).to.throw("preprocessor must be prepped before getting file")

    it "calls the preprocessor with the file path", ->
      customPreprocessor = @sandbox.stub()
      @registerPreprocessor(-> customPreprocessor)
      preprocessor.prep({ preprocessor: "custom" })
      preprocessor.getFile("/path/to/test.coffee", @config)
      expect(customPreprocessor).to.be.calledWith(path.join(@todosPath, "/path/to/test.coffee"))

    it "returns a promise resolved with the preprocessor's outputPath", ->
      customPreprocessor = @sandbox.stub().returns("/output/path/test.js")
      @registerPreprocessor(-> customPreprocessor)
      preprocessor.prep({ preprocessor: "custom" })
      preprocessor.getFile("/path/to/test.coffee", @config).then (filePath) ->
        expect(filePath).to.equal("/output/path/test.js")

    it "call onChange option when update:<file> is emitted", ->
      customPreprocessor = @sandbox.stub().returns(->)
      @registerPreprocessor(customPreprocessor)
      preprocessor.prep({ preprocessor: "custom" })
      onChange = @sandbox.spy()
      preprocessor.getFile("/path/to/test.coffee", @config, { onChange })
      emitter = customPreprocessor.lastCall.args[1]
      emitter.emit("update:#{path.join(@todosPath, "/path/to/test.coffee")}")
      expect(onChange).to.be.called

    it "invokes preprocessor again when isTextTerminal: false", ->
      @config.isTextTerminal = false
      customPreprocessor = @sandbox.stub().returns("/output/path/test.js")
      @registerPreprocessor(-> customPreprocessor)
      preprocessor.prep({ preprocessor: "custom" })
      preprocessor.getFile("/path/to/test.coffee", @config)
      preprocessor.getFile("/path/to/test.coffee", @config)
      expect(customPreprocessor).to.be.calledTwice

    it "does not invoke preprocessor again when isTextTerminal: true", ->
      preprocessor.close()
      @config.isTextTerminal = true
      customPreprocessor = @sandbox.stub().returns("/output/path/test.js")
      @registerPreprocessor(-> customPreprocessor)
      preprocessor.prep({ preprocessor: "custom" })
      preprocessor.getFile("/path/to/test.coffee", @config)
      preprocessor.getFile("/path/to/test.coffee", @config)
      expect(customPreprocessor).to.be.calledOnce

  context "#removeFile", ->
    it "emits close:<file> event", (done) ->
      customPreprocessor = @sandbox.stub().returns(->)
      @registerPreprocessor(customPreprocessor)
      preprocessor.prep({ preprocessor: "custom" })
      preprocessor.getFile("/path/to/test.coffee", @config)
      emitter = customPreprocessor.lastCall.args[1]
      fullPath = path.join(@todosPath, "/path/to/test.coffee")
      emitter.on "close:#{fullPath}", ->
        done()
      preprocessor.removeFile(fullPath)

  context "#close", ->
    it "emits close event", (done) ->
      customPreprocessor = @sandbox.stub().returns(->)
      @registerPreprocessor(customPreprocessor)
      preprocessor.prep({ preprocessor: "custom" })
      preprocessor.getFile("/path/to/test.coffee", @config)
      emitter = customPreprocessor.lastCall.args[1]
      emitter.on "close", ->
        done()
      preprocessor.close()

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
