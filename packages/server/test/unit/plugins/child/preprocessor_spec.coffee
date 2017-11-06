require("../../../spec_helper")

EE = require('events')

util = require("#{root}../../lib/plugins/child/util")
preprocessor = require("#{root}../../lib/plugins/child/preprocessor")

describe "lib/plugins/child/preprocessor", ->
  beforeEach ->
    @ipc = {
      send: @sandbox.spy()
      on: @sandbox.stub()
      removeListener: @sandbox.spy()
    }
    @invoke = @sandbox.spy()
    @ids = {}
    @config = {
      filePath: 'file/path'
      outputPath: 'output/path'
      shouldWatch: true
    }

    @sandbox.stub(util, "wrapPromise")

    preprocessor.wrap(@ipc, @invoke, @ids, [@config])

  afterEach ->
    ## clear out configs state
    @ipc.on.withArgs("preprocessor:close").yield(@config.filePath)

  it "passes through ipc, invoke function, and ids", ->
    expect(util.wrapPromise).to.be.calledWith(@ipc, @invoke, @ids)

  it "passes through simple config values", ->
    config = util.wrapPromise.lastCall.args[3][0]
    expect(config.filePath).to.equal(@config.filePath)
    expect(config.outputPath).to.equal(@config.outputPath)
    expect(config.shouldWatch).to.equal(@config.shouldWatch)

  it "enhances config with event emitter", ->
    expect(util.wrapPromise.lastCall.args[3][0]).to.be.an.instanceOf(EE)

  it "sends 'preprocessor:rerun' through ipc on 'rerun' event", ->
    config = util.wrapPromise.lastCall.args[3][0]
    config.emit("rerun")
    expect(@ipc.send).to.be.calledWith("preprocessor:rerun", @config.filePath)

  it "emits 'close' on config when ipc emits 'preprocessor:close' with same file path", ->
    config = util.wrapPromise.lastCall.args[3][0]
    handler = @sandbox.spy()
    config.on("close", handler)
    @ipc.on.withArgs("preprocessor:close").yield(@config.filePath)
    expect(handler).to.be.called

  it "does not 'close' on config when ipc emits 'preprocessor:close' with different file path", ->
    config = util.wrapPromise.lastCall.args[3][0]
    handler = @sandbox.spy()
    config.on("close", handler)
    @ipc.on.withArgs("preprocessor:close").yield("different/path")
    expect(handler).not.to.be.called

  it "passes existing config if called again with same file path", ->
    preprocessor.wrap(@ipc, @invoke, @ids, [@config])
    config1 = util.wrapPromise.firstCall.args[3][0]
    config2 = util.wrapPromise.lastCall.args[3][0]
    expect(config1).to.equal(config2)
