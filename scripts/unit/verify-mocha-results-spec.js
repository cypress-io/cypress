const fs = require('fs').promises
const sinon = require('sinon')
const { expect } = require('chai')
const { verifyMochaResults } = require('../verify-mocha-results')

if (process.platform !== 'win32') {
  describe('verify-mocha-results', () => {
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
    })

    it('exits normally when report directory does not exist', async () => {
      fsAccessStub.rejects()

      await verifyMochaResults({ expectedResultCount: 0 })
    })

    it('does not fail with normal report', async () => {
      fs.readFile
      .withArgs('/tmp/cypress/junit/report.xml')
      .resolves('<testsuites name="foo" time="1" tests="10" failures="0">')

      await verifyMochaResults({ expectedResultCount: 0 })
    })

    it('checks for non-passing tests and fails when found', async () => {
      fs.readFile
      .withArgs('/tmp/cypress/junit/report.xml')
      .resolves('<testsuites name="foo" time="1" tests="10" failures="3">')

      await expect(verifyMochaResults({ expectedResultCount: 0 })).to.be.rejectedWith('Expected the number of failures to be equal to 0')
    })

    it('checks for 0 tests run and fails when found', async () => {
      fs.readFile
      .withArgs('/tmp/cypress/junit/report.xml')
      .resolves('<testsuites name="foo" time="1" tests="0" failures="0">')

      await expect(verifyMochaResults({ expectedResultCount: 0 })).to.be.rejectedWith('Expected the total number of tests to be >0')
    })

    it('checks if the expectedResultCount matches and fails when different', async () => {
      fs.readFile
      .withArgs('/tmp/cypress/junit/report.xml')
      .resolves('<testsuites name="foo" time="1" tests="10" failures="0">')

      await expect(verifyMochaResults({ expectedResultCount: 2 })).to.be.rejectedWith('Expected 2 reports, but found 1 instead. Verify that all tests ran as expected.')
    })
  })
}
