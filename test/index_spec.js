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

    this.config = {
      isTextTerminal: true,
    }
    this.userOptions = {}
    this.filePath = 'path/to/file.js'
    this.outputPath = 'output/output.js'
    this.util = {
      getOutputPath: sandbox.stub().returns(this.outputPath),
      fileUpdated: sandbox.spy(),
      onClose: sandbox.stub(),
    }

    this.run = () => {
      return preprocessor(this.config, this.userOptions)(this.filePath, this.util)
    }
  })

  describe('exported function', function () {
    it('receives user options and returns a preprocessor function', function () {
      expect(preprocessor(this.config, this.userOptions)).to.be.a('function')
    })

    it('throws error if config is not the first argument', function () {
      expect(preprocessor).to.throw('must be called with the Cypress config')
    })
  })

  describe('preprocessor function', function () {
    afterEach(function () {
      this.util.onClose.yield() // resets the cached bundles
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

        const run = preprocessor(this.config, this.userOptions)
        run(this.filePath, this.util)
        run(this.filePath, this.util)
        expect(webpack).to.be.calledOnce
      })

      it('specifies the entry file', function () {
        return this.run().then(() => {
          expect(webpack.lastCall.args[0].entry).to.equal(this.filePath)
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

      it('runs when isTextTerminal is true', function () {
        return this.run().then(() => {
          expect(this.compilerApi.run).to.be.called
        })
      })

      it('watches when isTextTerminal is false', function () {
        this.config.isTextTerminal = false
        this.compilerApi.watch.yields(null, this.statsApi)
        return this.run().then(() => {
          expect(this.compilerApi.watch).to.be.called
        })
      })

      it('includes watchOptions if provided', function () {
        this.config.isTextTerminal = false
        this.compilerApi.watch.yields(null, this.statsApi)
        this.userOptions.watchOptions = { poll: true }
        return this.run().then(() => {
          expect(this.compilerApi.watch.lastCall.args[0]).to.eql({
            poll: true,
          })
        })
      })

      it('resolves with the output path', function () {
        return this.run().then((outputPath) => {
          expect(this.util.getOutputPath).to.be.calledWith(this.filePath)
          expect(outputPath).to.be.equal(this.outputPath)
        })
      })

      it('calls util.fileUpdated when there is an update', function () {
        this.compilerApi.plugin.withArgs('compile').yields()
        return this.run().then(() => {
          expect(this.util.fileUpdated).to.be.calledWith(this.filePath)
        })
      })

      it('registers onClose callback', function () {
        return this.run().then(() => {
          expect(this.util.onClose).to.be.called
          expect(this.util.onClose.lastCall.args[0]).to.be.a('function')
        })
      })

      it('closes bundler when isTextTerminal is false and onClose callback is called', function () {
        this.config.isTextTerminal = false
        this.compilerApi.watch.yields(null, this.statsApi)
        return this.run().then(() => {
          this.util.onClose.lastCall.args[0]()
          expect(this.watchApi.close).to.be.called
        })
      })

      it('does not close bundler when isTextTerminal is true and onClose callback is called', function () {
        return this.run().then(() => {
          this.util.onClose.lastCall.args[0]()
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
