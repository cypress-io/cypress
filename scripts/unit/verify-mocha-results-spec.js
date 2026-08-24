const fs = require('fs').promises
const sinon = require('sinon')
const { expect } = require('chai')
const { verifyMochaResults } = require('../verify-mocha-results')

if (process.platform !== 'win32') {
  describe('verify-mocha-results', () => {
    let cachedEnv = { ...process.env }

    afterEach(() => {
      sinon.restore()
      Object.assign(process.env, cachedEnv)
    })

    beforeEach(() => {
      sinon.stub(fs, 'readFile')

      sinon.stub(fs, 'readdir').withArgs('/tmp/cypress/junit').resolves([
        'report.xml',
      ])
    })

    it('does not fail with normal report', async () => {
      fs.readFile
      .withArgs('/tmp/cypress/junit/report.xml')
      .resolves('<testsuites name="foo" time="1" tests="10" failures="0">')

      await verifyMochaResults()
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
