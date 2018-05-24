require('../spec_helper')

const os = require('os')
const path = require('path')
const R = require('ramda')
const snapshot = require('snap-shot-it')
const Promise = require('bluebird')
const tmp = Promise.promisifyAll(require('tmp'))

const fs = require(`${lib}/fs`)
const open = require(`${lib}/exec/open`)
const run = require(`${lib}/exec/run`)
const cypress = require(`${lib}/cypress`)

describe('cypress', function () {
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
      cypress.open({ foo: 'foo' })
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
      cypress.open({ config })
      .then(getStartArgs)
      .then(snapshot)
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

    it('calls run#start, passing in options', () =>
      cypress.run({ foo: 'foo' })
      .then(getStartArgs)
      .then((args) => {
        expect(args.foo).to.equal('foo')
      })
    )

    it('normalizes config object', () => {
      const config = {
        pageLoadTime: 10000,
        watchForFileChanges: false,
      }
      return cypress.run({ config })
      .then(getStartArgs)
      .then(snapshot)
    })

    it('normalizes env option if passed an object', () =>
      cypress.run({ env: { foo: 'bar' } })
      .then(getStartArgs)
      .then(snapshot)
    )

    it('normalizes env option if passed an object with multiple properties', () =>
      cypress.run({ env: { foo: 'bar', another: 'one' } })
      .then(getStartArgs)
      .then(snapshot)
    )

    it('gets random tmp file and passes it to run#start', function () {
      return cypress.run().then(() => {
        expect(run.start.lastCall.args[0].outputPath).to.equal(outputPath)
      })
    })

    it('resolves with contents of tmp file', () =>
      cypress.run().then(snapshot)
    )
  })
})
