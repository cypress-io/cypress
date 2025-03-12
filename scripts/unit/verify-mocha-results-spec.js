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
      process.env = cachedEnv
    })

    beforeEach(() => {
      process.env = { somekey: 'someval' }
      sinon.stub(fs, 'readFile')
      fsAccessStub = sinon.stub(fs, 'access').withArgs('/tmp/cypress/junit').resolves()

      sinon.stub(fs, 'readdir').withArgs('/tmp/cypress/junit').resolves([
        'report.xml',
      ])
    })

    it('exits normally when report directory does not exist', async () => {
      fsAccessStub.rejects()

      await verifyMochaResults({ expectedResultCount: 0, expectFailures: false })
    })

    it('does not fail with normal report', async () => {
      fs.readFile
      .withArgs('/tmp/cypress/junit/report.xml')
      .resolves('<testsuites name="foo" time="1" tests="10" failures="0">')

      await verifyMochaResults({ expectedResultCount: 0, expectFailures: false })
    })

    context('env checking', () => {
      it('checks for protected env and fails and removes results when found', async () => {
        const spy = sinon.stub(fs, 'rm').withArgs('/tmp/cypress/junit', { recursive: true, force: true })

        fs.readFile
        .withArgs('/tmp/cypress/junit/report.xml')
        .resolves('<testsuites name="foo" time="1" tests="10" failures="0">someval')

        try {
          await verifyMochaResults({ expectedResultCount: 0, expectFailures: false })
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
          await verifyMochaResults({ expectedResultCount: 0, expectFailures: false })
          throw new Error('should not reach')
        } catch (err) {
          expect(err.message).to.include('Expected the number of failures to be equal to 0')
        }
      })

      it('removes results even when non-passing tests', async () => {
        const spy = sinon.stub(fs, 'rm').withArgs('/tmp/cypress/junit', { recursive: true, force: true })

        fs.readFile
        .withArgs('/tmp/cypress/junit/report.xml')
        .resolves('<testsuites name="foo" time="1" tests="10" failures="3">someval')

        try {
          await verifyMochaResults({ expectedResultCount: 2, expectFailures: false })
          throw new Error('should not reach')
        } catch (err) {
          expect(err.message).to.include('somekey').and.not.include('someval')
          expect(spy.getCalls().length).to.equal(1)
        }
      })

      it('checks for non-passing tests and passed when expectFailures is set', async () => {
        fs.readFile
        .withArgs('/tmp/cypress/junit/report.xml')
        .resolves('<testsuites name="foo" time="1" tests="10" failures="3">')

        await verifyMochaResults({ expectedResultCount: 0, expectFailures: true })
      })

      it('checks for 0 tests run and fails when found', async () => {
        fs.readFile
        .withArgs('/tmp/cypress/junit/report.xml')
        .resolves('<testsuites name="foo" time="1" tests="0" failures="0">')

        try {
          await verifyMochaResults({ expectedResultCount: 0, expectFailures: false })
          throw new Error('should not reach')
        } catch (err) {
          expect(err.message).to.include('Expected the total number of tests to be >0')
        }
      })

      it('removes results even when 0 tests run', async () => {
        const spy = sinon.stub(fs, 'rm').withArgs('/tmp/cypress/junit', { recursive: true, force: true })

        fs.readFile
        .withArgs('/tmp/cypress/junit/report.xml')
        .resolves('<testsuites name="foo" time="1" tests="0" failures="0">someval')

        try {
          await verifyMochaResults({ expectedResultCount: 2, expectFailures: false })
          throw new Error('should not reach')
        } catch (err) {
          expect(err.message).to.include('somekey').and.not.include('someval')
          expect(spy.getCalls().length).to.equal(1)
        }
      })

      it('checks if the expectedResultCount matches and fails when found', async () => {
        fs.readFile
        .withArgs('/tmp/cypress/junit/report.xml')
        .resolves('<testsuites name="foo" time="1" tests="10" failures="0">')

        try {
          await verifyMochaResults({ expectedResultCount: 2, expectFailures: false })
          throw new Error('should not reach')
        } catch (err) {
          expect(err.message).to.include('Expected 2 reports, but found 1 instead. Verify that all tests ran as expected.')
        }
      })

      it('removes results even when the expectedResultCount does not match', async () => {
        const spy = sinon.stub(fs, 'rm').withArgs('/tmp/cypress/junit', { recursive: true, force: true })

        fs.readFile
        .withArgs('/tmp/cypress/junit/report.xml')
        .resolves('<testsuites name="foo" time="1" tests="10" failures="0">someval')

        try {
          await verifyMochaResults({ expectedResultCount: 2, expectFailures: false })
          throw new Error('should not reach')
        } catch (err) {
          expect(err.message).to.include('somekey').and.not.include('someval')
          expect(spy.getCalls().length).to.equal(1)
        }
      })
    })
  })
}
