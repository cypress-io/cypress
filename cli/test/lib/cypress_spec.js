require('../spec_helper')

const os = require('os')
const path = require('path')
const R = require('ramda')
const snapshot = require('../support/snapshot')
const Promise = require('bluebird')
const tmp = Promise.promisifyAll(require('tmp'))
const mockfs = require('mock-fs')

const fs = require(`${lib}/fs`)
const open = require(`${lib}/exec/open`)
const run = require(`${lib}/exec/run`)
const cypress = require(`${lib}/cypress`)

describe('cypress', function () {
  beforeEach(function () {
    mockfs({})
  })

  afterEach(() => {
    mockfs.restore()
  })

  context('.open', function () {
    beforeEach(function () {
      sinon.stub(open, 'start').resolves()
    })

    const getCallArgs = R.path(['lastCall', 'args', 0])
    const getStartArgs = () => {
      expect(open.start).to.be.called

      return getCallArgs(open.start)
    }

    it('calls open#start, passing in options', function () {
      return cypress.open({ foo: 'foo' })
      .then(getStartArgs)
      .then((args) => {
        expect(args.foo).to.equal('foo')
      })
    })

    it('normalizes config object', () => {
      const config = {
        pageLoadTime: 10000,
        watchForFileChanges: false,
      }

      return cypress.open({ config })
      .then(getStartArgs)
      .then((args) => {
        expect(args).to.deep.eq({ config: JSON.stringify(config) })
      })
    })

    it('passes configFile: false', () => {
      const opts = {
        configFile: false,
      }

      return cypress.open(opts)
      .then(getStartArgs)
      .then((args) => {
        expect(args).to.deep.eq(opts)
      })
    })
  })

  context('.run', function () {
    let outputPath

    beforeEach(function () {
      outputPath = path.join(os.tmpdir(), 'cypress/monorepo/cypress_spec/output.json')
      sinon.stub(tmp, 'fileAsync').resolves(outputPath)
      sinon.stub(run, 'start').resolves()

      return fs.outputJsonAsync(outputPath, {
        code: 0,
        failingTests: [],
      })
    })

    const getCallArgs = R.path(['lastCall', 'args', 0])
    const normalizeCallArgs = (args) => {
      expect(args.outputPath).to.equal(outputPath)
      delete args.outputPath

      return args
    }
    const getStartArgs = () => {
      expect(run.start).to.be.called

      return normalizeCallArgs(getCallArgs(run.start))
    }

    it('calls run#start, passing in options', () => {
      return cypress.run({ spec: 'foo' })
      .then(getStartArgs)
      .then((args) => {
        expect(args.spec).to.equal('foo')
      })
    })

    it('normalizes config object', () => {
      const config = {
        pageLoadTime: 10000,
        watchForFileChanges: false,
      }

      return cypress.run({ config })
      .then(getStartArgs)
      .then((args) => {
        expect(args).to.deep.eq({ config: JSON.stringify(config) })
      })
    })

    it('normalizes env option if passed an object', () => {
      const env = { foo: 'bar', another: 'one' }

      return cypress.run({ env })
      .then(getStartArgs)
      .then((args) => {
        expect(args).to.deep.eq({ env: JSON.stringify(env) })
      })
    })

    it('gets random tmp file and passes it to run#start', function () {
      return cypress.run().then(() => {
        expect(run.start.lastCall.args[0].outputPath).to.equal(outputPath)
      })
    })

    it('resolves with contents of tmp file', () => {
      return cypress.run().then(snapshot)
    })

    it('passes configFile: false', () => {
      const opts = {
        configFile: false,
      }

      return cypress.run(opts)
      .then(getStartArgs)
      .then((args) => {
        expect(args).to.deep.eq(opts)
      })
    })

    it('rejects if project is an empty string', () => {
      return expect(cypress.run({ project: '' })).to.be.rejected
    })

    it('rejects if project is true', () => {
      return expect(cypress.run({ project: true })).to.be.rejected
    })

    it('rejects if project is false', () => {
      return expect(cypress.run({ project: false })).to.be.rejected
    })

    it('passes quiet: true', () => {
      const opts = {
        quiet: true,
      }

      return cypress.run(opts)
      .then(getStartArgs)
      .then((args) => {
        expect(args).to.deep.eq(opts)
      })
    })

    it('passes bail: true', () => {
      const opts = {
        bail: true,
      }

      return cypress.run(opts)
      .then(getStartArgs)
      .then((args) => {
        expect(args).to.deep.eq(opts)
      })
    })
  })
})
