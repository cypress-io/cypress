const fs = require('fs').promises
const sinon = require('sinon')
const { expect } = require('chai')
const { verifyMochaResults } = require('../verify-mocha-results')

if (process.platform !== 'win32') {
  describe('verify-mocha-results', () => {
    let cachedEnv = { ...process.env }

    let fsAccessStub

    afterEach(() => {
      sinon.restore()
      Object.assign(process.env, cachedEnv)
    })

    beforeEach(() => {
      process.env.CIRCLE_INTERNAL_CONFIG = '/foo.json'
      sinon.stub(fs, 'readFile')
      .withArgs('/foo.json').resolves(JSON.stringify({
        Dispatched: { TaskInfo: { Environment: { somekey: 'someval' } } },
      }))

      fsAccessStub = sinon.stub(fs, 'access').withArgs('/tmp/cypress/junit').resolves()

      sinon.stub(fs, 'readdir').withArgs('/tmp/cypress/junit').resolves([
        'report.xml',
      ])
    })

    it('exits normally when report directory does not exist', async () => {
      fsAccessStub.rejects()

      await verifyMochaResults()
    })

    it('does not fail with normal report', async () => {
      fs.readFile
      .withArgs('/tmp/cypress/junit/report.xml')
      .resolves('<testsuites name="foo" time="1" tests="10" failures="0">')

      await verifyMochaResults()
    })

    context('env checking', () => {
      it('checks for protected env and fails and removes results when found', async () => {
        const spy = sinon.stub(fs, 'rm').withArgs('/tmp/cypress/junit', { recursive: true, force: true })

        fs.readFile
        .withArgs('/tmp/cypress/junit/report.xml')
        .resolves('<testsuites name="foo" time="1" tests="10" failures="0">someval')

        try {
          await verifyMochaResults()
          throw new Error('should not reach')
        } catch (err) {
          expect(err.message).to.include('somekey').and.not.include('someval')
          expect(spy.getCalls().length).to.equal(1)
        }
      })
    })

    context('test result checking', () => {
      it('checks for non-passing tests and fails when found', async () => {
        fs.readFile
        .withArgs('/tmp/cypress/junit/report.xml')
        .resolves('<testsuites name="foo" time="1" tests="10" failures="3">')

        try {
          await verifyMochaResults()
          throw new Error('should not reach')
        } catch (err) {
          expect(err.message).to.include('Expected the number of failures to be equal to 0')
        }
      })

      it('checks for 0 tests run and fails when found', async () => {
        fs.readFile
        .withArgs('/tmp/cypress/junit/report.xml')
        .resolves('<testsuites name="foo" time="1" tests="0" failures="0">')

        try {
          await verifyMochaResults()
          throw new Error('should not reach')
        } catch (err) {
          expect(err.message).to.include('Expected the total number of tests to be >0')
        }
      })
    })
  })
}
