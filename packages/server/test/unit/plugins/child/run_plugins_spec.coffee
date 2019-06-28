require("../../../spec_helper")

_ = require("lodash")
cp = require("child_process")
snapshot = require("snap-shot-it")

preprocessor = require("#{root}../../lib/plugins/child/preprocessor")
task = require("#{root}../../lib/plugins/child/task")
runPlugins = require("#{root}../../lib/plugins/child/run_plugins")
util = require("#{root}../../lib/plugins/util")
Fixtures = require("#{root}../../test/support/helpers/fixtures")

colorCodeRe = /\[[0-9;]+m/gm
pathRe = /\/?([a-z0-9_-]+\/)*[a-z0-9_-]+\/([a-z_]+\.\w+)[:0-9]+/gmi
stackPathRe = /\(?\/?([a-z0-9_-]+\/)*([a-z0-9_-]+\.\w+)[:0-9]+\)?/gmi

withoutStack = (err) -> _.omit(err, "stack")
withoutColorCodes = (str) -> str.replace(colorCodeRe, "<color-code>")
withoutPath = (str) -> str.replace(pathRe, '<path>$2)')
withoutStackPaths = (stack) -> stack.replace(stackPathRe, '<path>$2')

describe "lib/plugins/child/run_plugins", ->
  beforeEach ->
    @ipc = {
      send: sinon.spy()
      on: sinon.stub()
      removeListener: sinon.spy()
    }

  afterEach ->
    mockery.deregisterMock("plugins-file")
    mockery.deregisterSubstitute("plugins-file")

  it "sends error message if pluginsFile is missing", ->
    mockery.registerSubstitute("plugins-file", "/does/not/exist.coffee")
    runPlugins(@ipc, "plugins-file")
    expect(@ipc.send).to.be.calledWith("load:error", "PLUGINS_FILE_ERROR", "plugins-file")
    snapshot(withoutStackPaths(@ipc.send.lastCall.args[3]))

  it "sends error message if requiring pluginsFile errors", ->
    ## path for substitute is relative to lib/plugins/child/plugins_child.js
    mockery.registerSubstitute(
      "plugins-file",
      Fixtures.path("server/throws_error.coffee")
    )
    runPlugins(@ipc, "plugins-file")
    expect(@ipc.send).to.be.calledWith("load:error", "PLUGINS_FILE_ERROR", "plugins-file")
    snapshot(withoutStackPaths(@ipc.send.lastCall.args[3]))

  it "sends error message if pluginsFile has syntax error", ->
    ## path for substitute is relative to lib/plugins/child/plugins_child.js
    mockery.registerSubstitute(
      "plugins-file",
      Fixtures.path("server/syntax_error.coffee")
    )
    runPlugins(@ipc, "plugins-file")
    expect(@ipc.send).to.be.calledWith("load:error", "PLUGINS_FILE_ERROR", "plugins-file")
    snapshot(withoutColorCodes(withoutPath(@ipc.send.lastCall.args[3])))

  it "sends error message if pluginsFile does not export a function", ->
    mockery.registerMock("plugins-file", null)
    runPlugins(@ipc, "plugins-file")
    expect(@ipc.send).to.be.calledWith("load:error", "PLUGINS_DIDNT_EXPORT_FUNCTION", "plugins-file")
    snapshot(JSON.stringify(@ipc.send.lastCall.args[3]))

  describe "on 'load' message", ->
    it "sends error if pluginsFile function rejects the promise", (done) ->
      err = new Error('foo')
      pluginsFn = sinon.stub().rejects(err)

      mockery.registerMock("plugins-file", pluginsFn)
      @ipc.on.withArgs("load").yields({})
      runPlugins(@ipc, "plugins-file")

      @ipc.send = _.once (event, errorType, pluginsFile, stack) ->
        expect(event).to.eq("load:error")
        expect(errorType).to.eq("PLUGINS_FUNCTION_ERROR")
        expect(pluginsFile).to.eq("plugins-file")
        expect(stack).to.eq(err.stack)
        done()

    it "calls function exported by pluginsFile with register function and config", ->
      pluginsFn = sinon.spy()
      mockery.registerMock("plugins-file", pluginsFn)
      runPlugins(@ipc, "plugins-file")
      config = {}
      @ipc.on.withArgs("load").yield(config)
      expect(pluginsFn).to.be.called
      expect(pluginsFn.lastCall.args[0]).to.be.a("function")
      expect(pluginsFn.lastCall.args[1]).to.equal(config)

    it "sends error if pluginsFile function throws an error", (done) ->
      err = new Error('foo')

      mockery.registerMock "plugins-file", -> throw err
      runPlugins(@ipc, "plugins-file")
      @ipc.on.withArgs("load").yield()

      @ipc.send = _.once (event, errorType, pluginsFile, stack) ->
        expect(event).to.eq("load:error")
        expect(errorType).to.eq("PLUGINS_FUNCTION_ERROR")
        expect(pluginsFile).to.eq("plugins-file")
        expect(stack).to.eq(err.stack)
        done()

  describe "on 'execute' message", ->
    beforeEach ->
      sinon.stub(preprocessor, "wrap")
      @onFilePreprocessor = sinon.stub().resolves()
      @beforeBrowserLaunch = sinon.stub().resolves()
      @taskRequested = sinon.stub().resolves("foo")
      pluginsFn = (register) =>
        register("file:preprocessor", @onFilePreprocessor)
        register("before:browser:launch", @beforeBrowserLaunch)
        register("task", @taskRequested)
      mockery.registerMock("plugins-file", pluginsFn)
      runPlugins(@ipc, "plugins-file")
      @ipc.on.withArgs("load").yield()

    context "file:preprocessor", ->
      beforeEach ->
        @ids = { eventId: 0, invocationId: "00" }

      it "calls preprocessor handler", ->
        args = ["arg1", "arg2"]
        @ipc.on.withArgs("execute").yield("file:preprocessor", @ids, args)
        expect(preprocessor.wrap).to.be.called
        expect(preprocessor.wrap.lastCall.args[0]).to.equal(@ipc)
        expect(preprocessor.wrap.lastCall.args[1]).to.be.a("function")
        expect(preprocessor.wrap.lastCall.args[2]).to.equal(@ids)
        expect(preprocessor.wrap.lastCall.args[3]).to.equal(args)

      it "invokes registered function when invoked by preprocessor handler", ->
        @ipc.on.withArgs("execute").yield("file:preprocessor", @ids, [])
        preprocessor.wrap.lastCall.args[1](2, ["one", "two"])
        expect(@onFilePreprocessor).to.be.calledWith("one", "two")

    context "before:browser:launch", ->
      beforeEach ->
        sinon.stub(util, "wrapChildPromise")
        @ids = { eventId: 1, invocationId: "00" }

      it "wraps child promise", ->
        args = ["arg1", "arg2"]
        @ipc.on.withArgs("execute").yield("before:browser:launch", @ids, args)
        expect(util.wrapChildPromise).to.be.called
        expect(util.wrapChildPromise.lastCall.args[0]).to.equal(@ipc)
        expect(util.wrapChildPromise.lastCall.args[1]).to.be.a("function")
        expect(util.wrapChildPromise.lastCall.args[2]).to.equal(@ids)
        expect(util.wrapChildPromise.lastCall.args[3]).to.equal(args)

      it "invokes registered function when invoked by preprocessor handler", ->
        @ipc.on.withArgs("execute").yield("before:browser:launch", @ids, [])
        args = ["one", "two"]
        util.wrapChildPromise.lastCall.args[1](3, args)
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
      mockery.registerMock("plugins-file", ->)
      sinon.stub(process, "on")

      @err = {
        name: "error name"
        message: "error message"
      }
      runPlugins(@ipc, "plugins-file")

    it "sends the serialized error via ipc on process uncaughtException", ->
      process.on.withArgs("uncaughtException").yield(@err)
      expect(@ipc.send).to.be.calledWith("error", @err)

    it "sends the serialized error via ipc on process unhandledRejection", ->
      process.on.withArgs("unhandledRejection").yield(@err)
      expect(@ipc.send).to.be.calledWith("error", @err)

    it "sends the serialized reason via ipc on process unhandledRejection", ->
      process.on.withArgs("unhandledRejection").yield({ reason: @err })
      expect(@ipc.send).to.be.calledWith("error", @err)
