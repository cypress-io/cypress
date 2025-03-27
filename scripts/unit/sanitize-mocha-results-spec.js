const fs = require('fs').promises
const sinon = require('sinon')
const { expect } = require('chai')
const { sanitizeMochaResults } = require('../sanitize-mocha-results')

if (process.platform !== 'win32') {
  describe('sanitize-mocha-results', () => {
    let cachedEnv = { ...process.env }
    let fsAccessStub

    beforeEach(() => {
      sinon.stub(fs, 'readFile')
      fsAccessStub = sinon.stub(fs, 'access').withArgs('/tmp/cypress/junit').resolves()

      sinon.stub(fs, 'readdir').withArgs('/tmp/cypress/junit').resolves([
        'report.xml',
      ])
    })

    afterEach(() => {
      sinon.restore()
      process.env = cachedEnv
    })

    it('exits normally when report directory does not exist', async () => {
      fsAccessStub.rejects()

      await sanitizeMochaResults()
    })

    it('checks for protected env and passes when not found', async () => {
      process.env = { somekey: 'someval' }

      fs.readFile
      .withArgs('/tmp/cypress/junit/report.xml')
      .resolves('<testsuites name="foo" time="1" tests="10" failures="0">')

      await sanitizeMochaResults()
    })

    it('checks for protected env and removes results when found', async () => {
      process.env = { somekey: 'someval' }
      const spy = sinon.stub(fs, 'rm').withArgs('/tmp/cypress/junit', { recursive: true, force: true })

      fs.readFile
      .withArgs('/tmp/cypress/junit/report.xml')
      .resolves('<testsuites name="foo" time="1" tests="10" failures="0">someval')

      await expect(sanitizeMochaResults()).to.be.rejectedWith('Report contained the value of somekey, which is a CI environment variable. This means that a failing test is exposing environment variables. Test reports will not be persisted for this job.')
      expect(spy.getCalls().length).to.equal(1)
    })

    it('checks for allowlisted env and passes when found', async () => {
      process.env = { nodejs_version: 'someval' }

      fs.readFile
      .withArgs('/tmp/cypress/junit/report.xml')
      .resolves('<testsuites name="foo" time="1" tests="10" failures="0">someval')

      await sanitizeMochaResults()
    })

    it('checks for protected env and passes when value is a boolean', async () => {
      process.env = { somekey: 'true' }

      fs.readFile
      .withArgs('/tmp/cypress/junit/report.xml')
      .resolves('<testsuites name="foo" time="1" tests="10" failures="0">true')

      await sanitizeMochaResults()
    })

    it('checks for protected env and passes when value is less than four characters', async () => {
      process.env = { somekey: 'abc' }

      fs.readFile
      .withArgs('/tmp/cypress/junit/report.xml')
      .resolves('<testsuites name="foo" time="1" tests="10" failures="0">abc')

      await sanitizeMochaResults()
    })
  })
}
