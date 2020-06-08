require('../../../spec_helper')

const EE = require('events')

const util = require(`${root}../../lib/plugins/util`)
const preprocessor = require(`${root}../../lib/plugins/child/preprocessor`)

describe('lib/plugins/child/preprocessor', () => {
  beforeEach(function () {
    this.ipc = {
      send: sinon.spy(),
      on: sinon.stub(),
      removeListener: sinon.spy(),
    }

    this.invoke = sinon.spy()
    this.ids = {}
    this.file = {
      filePath: 'file/path',
      outputPath: 'output/path',
      shouldWatch: true,
    }

    this.file2 = {
      filePath: 'file2/path',
      outputPath: 'output/path2',
      shouldWatch: true,
    }

    sinon.stub(util, 'wrapChildPromise')

    return preprocessor.wrap(this.ipc, this.invoke, this.ids, [this.file])
  })

  afterEach(() => {
    return preprocessor._clearFiles()
  })

  it('passes through ipc, invoke function, and ids', function () {
    expect(util.wrapChildPromise).to.be.calledWith(this.ipc, this.invoke, this.ids)
  })

  it('passes through simple file values', function () {
    const file = util.wrapChildPromise.lastCall.args[3][0]

    expect(file.filePath).to.equal(this.file.filePath)
    expect(file.outputPath).to.equal(this.file.outputPath)

    expect(file.shouldWatch).to.equal(this.file.shouldWatch)
  })

  it('re-applies event emitter methods to file', () => {
    expect(util.wrapChildPromise.lastCall.args[3][0]).to.be.an.instanceOf(EE)
  })

  it('sends \'preprocessor:rerun\' through ipc on \'rerun\' event', function () {
    const file = util.wrapChildPromise.lastCall.args[3][0]

    file.emit('rerun')

    expect(this.ipc.send).to.be.calledWith('preprocessor:rerun', this.file.filePath)
  })

  it('emits \'close\' when ipc emits \'preprocessor:close\' with same file path', function () {
    const file = util.wrapChildPromise.lastCall.args[3][0]
    const handler = sinon.spy()

    file.on('close', handler)
    this.ipc.on.withArgs('preprocessor:close').yield(this.file.filePath)

    expect(handler).to.be.called
  })

  it('does not close file when ipc emits \'preprocessor:close\' with different file path', function () {
    const file = util.wrapChildPromise.lastCall.args[3][0]
    const handler = sinon.spy()

    file.on('close', handler)
    this.ipc.on.withArgs('preprocessor:close').yield('different/path')

    expect(handler).not.to.be.called
  })

  it('passes existing file if called again with same file path', function () {
    preprocessor.wrap(this.ipc, this.invoke, this.ids, [this.file])
    const file1 = util.wrapChildPromise.firstCall.args[3][0]
    const file2 = util.wrapChildPromise.lastCall.args[3][0]

    expect(file1).to.equal(file2)
  })

  it('deletes stored file objects on close(filePath)', function () {
    preprocessor.wrap(this.ipc, this.invoke, this.ids, [this.file2])
    this.ipc.on.withArgs('preprocessor:close').yield(this.file.filePath)
    const files = preprocessor._getFiles()

    expect(Object.keys(files).length).to.equal(1)
    expect(files[this.file2.filePath]).to.exist

    expect(files[this.file.filePath]).to.be.undefined
  })

  it('deletes all stored file objects on close()', function () {
    preprocessor.wrap(this.ipc, this.invoke, this.ids, [this.file2])
    this.ipc.on.withArgs('preprocessor:close').yield()
    const files = preprocessor._getFiles()

    expect(Object.keys(files).length).to.equal(0)
  })
})
