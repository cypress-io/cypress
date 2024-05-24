/// <reference types="cypress" />

import { flattenTestsFromSuites, loadPassedTests, savePassedTests, setSkipOnPassedTests } from '../../../src/cypress/runner'

// Sample data for testing
const sampleSuite = {
  suites: [
    {
      tests: [
        { id: 1, body: 'test1', state: 'passed' },
        { id: 2, body: 'test2', state: 'failed' },
      ],
      suites: [
        {
          tests: [
            { id: 3, body: 'test3', state: 'passed' },
            { id: 4, body: 'test4', state: 'failed' },
          ],
        },
      ],
    },
  ],
}

describe('Test Suite Processing Functions', () => {
  beforeEach(() => {
    cy.window().then((win) => {
      win.passedTestsInfo = {}
    })
  })

  it('should flatten all tests from nested suites', () => {
    const result = flattenTestsFromSuites(sampleSuite)

    expect(result).to.have.length(4)
    expect(result.map((test) => test.id)).to.include.members([1, 2, 3, 4])
  })

  it('should return passed tests from window object', () => {
    const testLocation = 'testPath'

    cy.window().then((win) => {
      win.passedTestsInfo[testLocation] = [{ id: 1, body: 'test1' }]

      const result = loadPassedTests(testLocation)

      expect(result).to.have.length(1)
      expect(result[0].id).to.equal(1)
    })
  })

  it('should return an empty array if no passed tests are found', () => {
    const testLocation = 'testPath'

    cy.window().then((win) => {
      win.passedTestsInfo = {}

      const result = loadPassedTests(testLocation)

      expect(result).to.be.an('array').that.is.empty
    })
  })

  it('should save passed tests and remove failed ones', () => {
    const savedInfo = [{ id: 1, body: 'test1' }]
    const testLocation = 'testPath'

    savePassedTests(sampleSuite, savedInfo, testLocation)

    cy.window().then((win) => {
      const info = win.passedTestsInfo[testLocation]

      expect(info).to.have.length(2)
      expect(info.map((test) => test.id)).to.include.members([1, 3])
    })
  })

  it('should set tests to pending if they were previously passed', () => {
    const savedInfo = [{ id: 1, body: 'test1' }, { id: 3, body: 'test3' }]

    setSkipOnPassedTests(sampleSuite, savedInfo)

    const allTests = flattenTestsFromSuites(sampleSuite)
    const pendingTests = allTests.filter((test) => test.pending === 'true')

    expect(pendingTests).to.have.length(2)
    expect(pendingTests.map((test) => test.id)).to.include.members([1, 3])
  })
})
