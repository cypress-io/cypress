require('../spec_helper')

const os = require('os')
const path = require('path')
const Promise = require('bluebird')
const tmp = Promise.promisifyAll(require('tmp'))

const fs = require(`${lib}/fs`)
const open = require(`${lib}/exec/open`)
const run = require(`${lib}/exec/run`)
const cypress = require(`${lib}/cypress`)

describe('cypress', function () {
  context('#open', function () {
    it('calls open#start, passing in options', function () {
      this.sandbox.stub(open, 'start').resolves()
      cypress.open({ foo: 'foo' })
      expect(open.start).to.be.calledWith({ foo: 'foo' })
    })
  })

  context('#run', function () {
    beforeEach(function () {
      this.outputPath = path.join(os.tmpdir(), 'cypress/monorepo/cypress_spec/output.json')
      this.sandbox.stub(tmp, 'fileAsync').resolves(this.outputPath)
      this.sandbox.stub(run, 'start').resolves()
      return fs.outputJsonAsync(this.outputPath, {
        code: 0,
        failingTests: [],
      })
    })

    it('calls run#start, passing in options', function () {
      return cypress.run({ foo: 'foo' }).then(() => {
        expect(run.start).to.be.called
        expect(run.start.lastCall.args[0].foo).to.equal('foo')
      })
    })

    it('gets random tmp file and passes it to run#start', function () {
      return cypress.run().then(() => {
        expect(run.start.lastCall.args[0].outputPath).to.equal(this.outputPath)
      })
    })

    it('resolves with contents of tmp file', function () {
      return cypress.run().then((results) => {
        expect(results).to.eql({
          code: 0,
          failingTests: [],
        })
      })
    })
  })
})
