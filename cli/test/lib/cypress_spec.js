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
    it('calls open#start, passing in options', function () {
      this.sandbox.stub(open, 'start').resolves()
      cypress.open({ foo: 'foo' })
      expect(open.start).to.be.calledWith({ foo: 'foo' })
    })
  })

  context('.run', function () {
    let outputPath
    beforeEach(function () {
      outputPath = path.join(os.tmpdir(), 'cypress/monorepo/cypress_spec/output.json')
      this.sandbox.stub(tmp, 'fileAsync').resolves(outputPath)
      this.sandbox.stub(run, 'start').resolves()
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
