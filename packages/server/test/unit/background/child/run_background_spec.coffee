require("../../../spec_helper")

_ = require("lodash")
cp = require("child_process")
snapshot = require("snap-shot-it")

preprocessor = require("#{root}../../lib/background/child/preprocessor")
task = require("#{root}../../lib/background/child/task")
runBackground = require("#{root}../../lib/background/child/run_background")
util = require("#{root}../../lib/background/util")
Fixtures = require("#{root}../../test/support/helpers/fixtures")

colorCodeRe = /\[[0-9;]+m/gm
pathRe = /\/?([a-z0-9_-]+\/)*[a-z0-9_-]+\/([a-z_]+\.\w+)[:0-9]+/gmi
stackPathRe = /\(?\/?([a-z0-9_-]+\/)*([a-z0-9_-]+\.\w+)[:0-9]+\)?/gmi

withoutStack = (err) -> _.omit(err, "stack")
withoutColorCodes = (str) -> str.replace(colorCodeRe, "<color-code>")
withoutPath = (str) -> str.replace(pathRe, '<path>$2)')
withoutStackPaths = (stack) -> stack.replace(stackPathRe, '<path>$2')

describe "lib/background/child/run_background", ->
  beforeEach ->
    @process = {
      on: sinon.stub()
    }

    @ipc = {
      send: sinon.spy()
      on: sinon.stub()
      removeListener: sinon.spy()
    }

  afterEach ->
    mockery.deregisterMock("background-file")
    mockery.deregisterSubstitute("background-file")

  it "sends error message if backgroundFile is missing", ->
    mockery.registerSubstitute("background-file", "/does/not/exist.coffee")
    runBackground(@process, @ipc, "background-file")
    expect(@ipc.send).to.be.calledWith("load:error", "BACKGROUND_FILE_ERROR", "background-file")
    snapshot(withoutStackPaths(@ipc.send.lastCall.args[3]))

  it "sends error message if requiring backgroundFile errors", ->
    ## path for substitute is relative to lib/background/child/BACKGROUND_child.js
    mockery.registerSubstitute(
      "background-file",
      Fixtures.path("server/throws_error.coffee")
    )
    runBackground(@process, @ipc, "background-file")
    expect(@ipc.send).to.be.calledWith("load:error", "BACKGROUND_FILE_ERROR", "background-file")
    snapshot(withoutStackPaths(@ipc.send.lastCall.args[3]))

  it "sends error message if backgroundFile has syntax error", ->
    ## path for substitute is relative to lib/background/child/BACKGROUND_child.js
    mockery.registerSubstitute(
      "background-file",
      Fixtures.path("server/syntax_error.coffee")
    )
    runBackground(@process, @ipc, "background-file")
    expect(@ipc.send).to.be.calledWith("load:error", "BACKGROUND_FILE_ERROR", "background-file")
    snapshot(withoutColorCodes(withoutPath(@ipc.send.lastCall.args[3])))

  it "sends error message if backgroundFile does not export a function", ->
    mockery.registerMock("background-file", null)
    runBackground(@process, @ipc, "background-file")
    expect(@ipc.send).to.be.calledWith("load:error", "BACKGROUND_DIDNT_EXPORT_FUNCTION", "background-file")
    snapshot(JSON.stringify(@ipc.send.lastCall.args[3]))

  describe "on 'load' message", ->
    afterEach ->
      @ipc.send = ->

    it "sends error if backgroundFile function rejects the promise", (done) ->
      err = new Error('foo')
      backgroundFn = sinon.stub().rejects(err)
      mockery.registerMock("background-file", backgroundFn)
      @ipc.on.withArgs("load").yields({})
      runBackground(@process, @ipc, "background-file")

      @ipc.send = (event, errorType, backgroundFile, stack) ->
        expect(event).to.eq("load:error")
        expect(errorType).to.eq("BACKGROUND_FUNCTION_ERROR")
        expect(backgroundFile).to.eq("background-file")
        expect(stack).to.eq(err.stack)
        done()

    it "calls function exported by backgroundFile with register function and config", ->
      backgroundFn = sinon.spy()
      mockery.registerMock("background-file", backgroundFn)
      runBackground(@process, @ipc, "background-file")
      config = {}
      @ipc.on.withArgs("load").yield(config)
      expect(backgroundFn).to.be.called
      expect(backgroundFn.lastCall.args[0]).to.be.a("function")
      expect(backgroundFn.lastCall.args[1]).to.equal(config)

    it "sends error if backgroundFile function throws an error", (done) ->
      err = new Error('foo')

      mockery.registerMock "background-file", -> throw err
      runBackground(@process, @ipc, "background-file")
      @ipc.on.withArgs("load").yield()

      @ipc.send = (event, errorType, backgroundFile, stack) ->
        expect(event).to.eq("load:error")
        expect(errorType).to.eq("BACKGROUND_FUNCTION_ERROR")
        expect(backgroundFile).to.eq("background-file")
        expect(stack).to.eq(err.stack)
        done()

  describe "on 'execute' message", ->
    beforeEach ->
      sinon.stub(preprocessor, "wrap")
      @onFilePreprocessor = sinon.stub().resolves()
      @beforeBrowserLaunch = sinon.stub().resolves()
      backgroundFn = (register) =>
        register("browser:filePreprocessor", @onFilePreprocessor)
        register("browser:launch", @beforeBrowserLaunch)
        register("task", {})
      mockery.registerMock("background-file", backgroundFn)
      runBackground(@process, @ipc, "background-file")
      @ipc.on.withArgs("load").yield()

    context "browser:filePreprocessor", ->
      beforeEach ->
        @ids = { eventId: 0, invocationId: "00" }

      it "calls preprocessor handler", ->
        args = ["arg1", "arg2"]
        @ipc.on.withArgs("execute").yield("browser:filePreprocessor", @ids, args)
        expect(preprocessor.wrap).to.be.called
        expect(preprocessor.wrap.lastCall.args[0]).to.equal(@ipc)
        expect(preprocessor.wrap.lastCall.args[1]).to.be.a("function")
        expect(preprocessor.wrap.lastCall.args[2]).to.equal(@ids)
        expect(preprocessor.wrap.lastCall.args[3]).to.equal(args)

      it "invokes registered function when invoked by preprocessor handler", ->
        @ipc.on.withArgs("execute").yield("browser:filePreprocessor", @ids, [])
        preprocessor.wrap.lastCall.args[1](4, ["one", "two"])
        expect(@onFilePreprocessor).to.be.calledWith("one", "two")

    context "browser:launch", ->
      beforeEach ->
        sinon.stub(util, "wrapChildPromise")
        @ids = { eventId: 1, invocationId: "00" }

      it "wraps child promise", ->
        args = ["arg1", "arg2"]
        @ipc.on.withArgs("execute").yield("browser:launch", @ids, args)
        expect(util.wrapChildPromise).to.be.called
        expect(util.wrapChildPromise.lastCall.args[0]).to.equal(@ipc)
        expect(util.wrapChildPromise.lastCall.args[1]).to.be.a("function")
        expect(util.wrapChildPromise.lastCall.args[2]).to.equal(@ids)
        expect(util.wrapChildPromise.lastCall.args[3]).to.equal(args)

      it "invokes registered function when invoked by preprocessor handler", ->
        @ipc.on.withArgs("execute").yield("browser:launch", @ids, [])
        args = ["one", "two"]
        util.wrapChildPromise.lastCall.args[1](5, args)
        expect(@beforeBrowserLaunch).to.be.calledWith("one", "two")

    context "task", ->
      beforeEach ->
        sinon.stub(task, "wrap")
        @ids = { eventId: 5, invocationId: "00" }

      it "calls task handler", ->
        args = ["arg1"]
        @ipc.on.withArgs("execute").yield("task", @ids, args)
        expect(task.wrap).to.be.called
        expect(task.wrap.lastCall.args[0]).to.equal(@ipc)
        expect(task.wrap.lastCall.args[1]).to.be.an("object")
        expect(task.wrap.lastCall.args[2]).to.equal(@ids)
        expect(task.wrap.lastCall.args[3]).to.equal(args)

  describe "errors", ->
    beforeEach ->
      mockery.registerMock("background-file", ->)

      @err = {
        name: "error name"
        message: "error message"
      }
      runBackground(@process, @ipc, "background-file")

    it "sends the serialized error via ipc on process uncaughtException", ->
      @process.on.withArgs("uncaughtException").yield(@err)
      expect(@ipc.send).to.be.calledWith("error", @err)

    it "sends the serialized error via ipc on process unhandledRejection", ->
      @process.on.withArgs("unhandledRejection").yield(@err)
      expect(@ipc.send).to.be.calledWith("error", @err)

    it "sends the serialized reason via ipc on process unhandledRejection", ->
      @process.on.withArgs("unhandledRejection").yield({ reason: @err })
      expect(@ipc.send).to.be.calledWith("error", @err)
