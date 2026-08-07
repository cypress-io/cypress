import '../../../spec_helper'
import EE from 'events'
import * as util from '../../../../lib/plugins/util'
import * as preprocessor from '../../../../lib/plugins/child/preprocessor'

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

    preprocessor.wrap(this.ipc, this.invoke, this.ids, [this.file])
  })

  afterEach(() => {
    preprocessor._clearFiles()
  })

  context('#wrap', () => {
    it('passes through simple file values', function () {
      const file = util.wrapChildPromise.lastCall.args[3][0]

      expect(file.filePath).to.equal(this.file.filePath)
      expect(file.outputPath).to.equal(this.file.outputPath)

      expect(file.shouldWatch).to.equal(this.file.shouldWatch)
    })

    it('re-applies event emitter methods to file', () => {
      expect(util.wrapChildPromise.lastCall.args[3][0]).to.be.an.instanceOf(EE)
    })

    it(`sends 'preprocessor:rerun' through ipc on 'rerun' event`, function () {
      const file = util.wrapChildPromise.lastCall.args[3][0]

      file.emit('rerun')

      expect(this.ipc.send).to.be.calledWith('preprocessor:rerun', this.file.filePath)
    })

    it('passes existing file if called again with same file path', function () {
      preprocessor.wrap(this.ipc, this.invoke, this.ids, [this.file])
      const file1 = util.wrapChildPromise.firstCall.args[3][0]
      const file2 = util.wrapChildPromise.lastCall.args[3][0]

      expect(file1).to.equal(file2)
    })
  })

  context('#close', () => {
    it(`emits 'close' on the file with the given path`, function () {
      const file = util.wrapChildPromise.lastCall.args[3][0]
      const handler = sinon.spy()

      file.on('close', handler)
      preprocessor.close(this.file.filePath)

      expect(handler).to.be.called
    })

    it('does not close file when given a different file path', function () {
      const file = util.wrapChildPromise.lastCall.args[3][0]
      const handler = sinon.spy()

      file.on('close', handler)
      preprocessor.close('different/path')

      expect(handler).not.to.be.called
    })

    it('deletes stored file object when given a file path', function () {
      preprocessor.wrap(this.ipc, this.invoke, this.ids, [this.file2])
      preprocessor.close(this.file.filePath)
      const files = preprocessor._getFiles()

      expect(Object.keys(files).length).to.equal(1)
      expect(files[this.file2.filePath]).to.exist

      expect(files[this.file.filePath]).to.be.undefined
    })

    it(`emits 'close' on every file when given no file path`, function () {
      const file = util.wrapChildPromise.lastCall.args[3][0]

      preprocessor.wrap(this.ipc, this.invoke, this.ids, [this.file2])

      const file2 = util.wrapChildPromise.lastCall.args[3][0]
      const handler = sinon.spy()
      const handler2 = sinon.spy()

      file.on('close', handler)
      file2.on('close', handler2)

      preprocessor.close()

      expect(handler).to.be.called
      expect(handler2).to.be.called
    })

    it('deletes all stored file objects when given no file path', function () {
      preprocessor.wrap(this.ipc, this.invoke, this.ids, [this.file2])
      preprocessor.close()
      const files = preprocessor._getFiles()

      expect(Object.keys(files).length).to.equal(0)
    })
  })
})
