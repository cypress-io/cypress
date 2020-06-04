require("../../../spec_helper")

EE = require('events')

util = require("#{root}../../lib/plugins/util")
preprocessor = require("#{root}../../lib/plugins/child/preprocessor")

describe "lib/plugins/child/preprocessor", ->
  beforeEach ->
    @ipc = {
      send: sinon.spy()
      on: sinon.stub()
      removeListener: sinon.spy()
    }
    @invoke = sinon.spy()
    @ids = {}
    @file = {
      filePath: 'file/path'
      outputPath: 'output/path'
      shouldWatch: true
    }
    @file2 = {
      filePath: 'file2/path'
      outputPath: 'output/path2'
      shouldWatch: true
    }

    sinon.stub(util, "wrapChildPromise")

    preprocessor.wrap(@ipc, @invoke, @ids, [@file])

  afterEach ->
    preprocessor._clearFiles()

  it "passes through ipc, invoke function, and ids", ->
    expect(util.wrapChildPromise).to.be.calledWith(@ipc, @invoke, @ids)

  it "passes through simple file values", ->
    file = util.wrapChildPromise.lastCall.args[3][0]
    expect(file.filePath).to.equal(@file.filePath)
    expect(file.outputPath).to.equal(@file.outputPath)
    expect(file.shouldWatch).to.equal(@file.shouldWatch)

  it "re-applies event emitter methods to file", ->
    expect(util.wrapChildPromise.lastCall.args[3][0]).to.be.an.instanceOf(EE)

  it "sends 'preprocessor:rerun' through ipc on 'rerun' event", ->
    file = util.wrapChildPromise.lastCall.args[3][0]
    file.emit("rerun")
    expect(@ipc.send).to.be.calledWith("preprocessor:rerun", @file.filePath)

  it "emits 'close' when ipc emits 'preprocessor:close' with same file path", ->
    file = util.wrapChildPromise.lastCall.args[3][0]
    handler = sinon.spy()
    file.on("close", handler)
    @ipc.on.withArgs("preprocessor:close").yield(@file.filePath)
    expect(handler).to.be.called

  it "does not close file when ipc emits 'preprocessor:close' with different file path", ->
    file = util.wrapChildPromise.lastCall.args[3][0]
    handler = sinon.spy()
    file.on("close", handler)
    @ipc.on.withArgs("preprocessor:close").yield("different/path")
    expect(handler).not.to.be.called

  it "passes existing file if called again with same file path", ->
    preprocessor.wrap(@ipc, @invoke, @ids, [@file])
    file1 = util.wrapChildPromise.firstCall.args[3][0]
    file2 = util.wrapChildPromise.lastCall.args[3][0]
    expect(file1).to.equal(file2)

  it "deletes stored file objects on close(filePath)", ->
    preprocessor.wrap(@ipc, @invoke, @ids, [@file2])
    @ipc.on.withArgs("preprocessor:close").yield(@file.filePath)
    files = preprocessor._getFiles()
    expect(Object.keys(files).length).to.equal(1)
    expect(files[@file2.filePath]).to.exist
    expect(files[@file.filePath]).to.be.undefined

  it "deletes all stored file objects on close()", ->
    preprocessor.wrap(@ipc, @invoke, @ids, [@file2])
    @ipc.on.withArgs("preprocessor:close").yield()
    files = preprocessor._getFiles()
    expect(Object.keys(files).length).to.equal(0)
