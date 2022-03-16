require('../spec_helper')

const os = require('os')
const path = require('path')
const _ = require('lodash')
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

    const getStartArgs = () => {
      expect(open.start).to.be.called

      return _.get(open.start, ['lastCall', 'args', 0])
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
  })

  context('.run fails to write results file', function () {
    it('resolves with error object', function () {
      const outputPath = path.join(os.tmpdir(), 'cypress/monorepo/cypress_spec/output.json')

      sinon.stub(tmp, 'fileAsync').resolves(outputPath)
      sinon.stub(run, 'start').resolves(2)
      sinon.stub(fs, 'readJsonAsync').withArgs(outputPath).resolves()

      return cypress.run().then((result) => {
        expect(result).to.deep.equal({
          status: 'failed',
          failures: 2,
          message: 'Could not find Cypress test run results',
        })
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

    const normalizeCallArgs = (args) => {
      expect(args.outputPath).to.equal(outputPath)
      delete args.outputPath

      return args
    }
    const getStartArgs = () => {
      expect(run.start).to.be.called

      return normalizeCallArgs(_.get(run.start, ['lastCall', 'args', 0]))
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
  })

  context('cli', function () {
    describe('.parseRunArguments', function () {
      it('parses CLI cypress run arguments', async () => {
        const args = 'cypress run --browser chrome --spec my/test/spec.js'.split(' ')
        const options = await cypress.cli.parseRunArguments(args)

        expect(options).to.deep.equal({
          browser: 'chrome',
          spec: 'my/test/spec.js',
        })
      })

      it('parses CLI cypress run shorthand arguments', async () => {
        const args = 'cypress run -b firefox -p 5005 --headed --quiet'.split(' ')
        const options = await cypress.cli.parseRunArguments(args)

        expect(options).to.deep.equal({
          browser: 'firefox',
          port: 5005,
          headed: true,
          quiet: true,
        })
      })

      it('coerces --record and --dev', async () => {
        const args = 'cypress run --record false --dev true'.split(' ')
        const options = await cypress.cli.parseRunArguments(args)

        expect(options).to.deep.equal({
          record: false,
          dev: true,
        })
      })

      it('coerces --config-file cypress.config.js to string', async () => {
        const args = 'cypress run --config-file cypress.config.js'.split(' ')
        const options = await cypress.cli.parseRunArguments(args)

        expect(options).to.deep.equal({
          configFile: 'cypress.config.js',
        })
      })

      it('parses config', async () => {
        const args = 'cypress run --config baseUrl=localhost,video=true'.split(' ')
        const options = await cypress.cli.parseRunArguments(args)

        // we don't need to convert the config into an object
        // since the logic inside cypress.run handles that
        expect(options).to.deep.equal({
          config: 'baseUrl=localhost,video=true',
        })
      })

      it('parses env', async () => {
        const args = 'cypress run --env MY_NUMBER=42,MY_FLAG=true'.split(' ')
        const options = await cypress.cli.parseRunArguments(args)

        // we don't need to convert the environment into an object
        // since the logic inside cypress.run handles that
        expect(options).to.deep.equal({
          env: 'MY_NUMBER=42,MY_FLAG=true',
        })
      })
    })
  })
})
