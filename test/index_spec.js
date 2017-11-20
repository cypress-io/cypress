'use strict'

const chai = require('chai')
const mockery = require('mockery')
const sinon = require('sinon')

const expect = chai.expect
chai.use(require('sinon-chai'))

const sandbox = sinon.sandbox.create()
const webpack = sandbox.stub()
mockery.enable({
  warnOnUnregistered: false,
})
mockery.registerMock('webpack', webpack)

const preprocessor = require('../index')

describe('webpack preprocessor', function () {
  beforeEach(function () {
    sandbox.restore()

    this.watchApi = {
      close: sandbox.spy(),
    }

    this.compilerApi = {
      run: sandbox.stub(),
      watch: sandbox.stub().returns(this.watchApi),
      plugin: sandbox.stub(),
    }
    webpack.returns(this.compilerApi)

    this.statsApi = {
      toJson () { return { warnings: [], errors: [] } },
    }

    this.file = {
      filePath: 'path/to/file.js',
      outputPath: 'output/output.js',
      shouldWatch: false,
      on: sandbox.stub(),
      emit: sandbox.spy(),
    }
    this.options = {}
    this.util = {
      getOutputPath: sandbox.stub().returns(this.outputPath),
      fileUpdated: sandbox.spy(),
      onClose: sandbox.stub(),
    }

    this.run = () => {
      return preprocessor(this.options)(this.file)
    }
  })

  describe('exported function', function () {
    it('receives user options and returns a preprocessor function', function () {
      expect(preprocessor(this.options)).to.be.a('function')
    })

    it('has defaultOptions attached to it', function () {
      expect(preprocessor.defaultOptions).to.be.an('object')
      expect(preprocessor.defaultOptions.webpackOptions.module.rules).to.be.an('array')
    })
  })

  describe('preprocessor function', function () {
    afterEach(function () {
      this.file.on.withArgs('close').yield() // resets the cached bundles
    })

    describe('when it finishes cleanly', function () {
      beforeEach(function () {
        this.compilerApi.run.yields(null, this.statsApi)
      })

      it('runs webpack', function () {
        return this.run().then(() => {
          expect(webpack).to.be.called
        })
      })

      it('returns existing bundle if called again with same filePath', function () {
        webpack.reset()
        webpack.returns(this.compilerApi)

        const run = preprocessor(this.options)
        run(this.file)
        run(this.file)
        expect(webpack).to.be.calledOnce
      })

      it('specifies the entry file', function () {
        return this.run().then(() => {
          expect(webpack.lastCall.args[0].entry).to.equal(this.file.filePath)
        })
      })

      it('specifies output path and filename', function () {
        return this.run().then(() => {
          expect(webpack.lastCall.args[0].output).to.eql({
            path: 'output',
            filename: 'output.js',
          })
        })
      })

      it('runs when shouldWatch is false', function () {
        return this.run().then(() => {
          expect(this.compilerApi.run).to.be.called
        })
      })

      it('watches when shouldWatch is true', function () {
        this.file.shouldWatch = true
        this.compilerApi.watch.yields(null, this.statsApi)
        return this.run().then(() => {
          expect(this.compilerApi.watch).to.be.called
        })
      })

      it('includes watchOptions if provided', function () {
        this.file.shouldWatch = true
        this.compilerApi.watch.yields(null, this.statsApi)
        this.options.watchOptions = { poll: true }
        return this.run().then(() => {
          expect(this.compilerApi.watch.lastCall.args[0]).to.eql({
            poll: true,
          })
        })
      })

      it('resolves with the output path', function () {
        return this.run().then((outputPath) => {
          expect(outputPath).to.be.equal(this.file.outputPath)
        })
      })

      it('emits `rerun` when there is an update', function () {
        this.compilerApi.plugin.withArgs('compile').yields()
        return this.run().then(() => {
          expect(this.file.emit).to.be.calledWith('rerun')
        })
      })

      it('closes bundler when shouldWatch is true and `close` is emitted', function () {
        this.file.shouldWatch = true
        this.compilerApi.watch.yields(null, this.statsApi)
        return this.run().then(() => {
          this.file.on.withArgs('close').yield()
          expect(this.watchApi.close).to.be.called
        })
      })

      it('does not close bundler when shouldWatch is false and `close` is emitted', function () {
        return this.run().then(() => {
          this.file.on.withArgs('close').yield()
          expect(this.watchApi.close).not.to.be.called
        })
      })
    })

    describe('when it errors', function () {
      beforeEach(function () {
        this.err = {
          stack: 'Failed to preprocess...',
        }
      })

      it('it rejects with error', function () {
        this.compilerApi.run.yields(this.err)
        return this.run().catch((err) => {
          expect(err.stack).to.equal(this.err.stack)
        })
      })

      it('backs up stack as originalStack', function () {
        this.compilerApi.run.yields(this.err)
        return this.run().catch((err) => {
          expect(err.originalStack).to.equal(this.err.stack)
        })
      })
    })
  })
})
