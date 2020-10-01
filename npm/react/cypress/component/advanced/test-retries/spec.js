import React from 'react'
import { mount } from 'cypress-react-unit-test'

// test retries from
// https://github.com/cypress-io/cypress/pull/3968
// you can skip the tests if there is no retries feature
const describeOrSkip = Cypress.getTestRetries ? describe : describe.skip
describeOrSkip('Test', () => {
  const Hello = () => {
    // this is how you can get the current retry number
    // attempt 1: (first test execution) retry = 0
    // attempt 2: (second test execution) retry = 1
    // attempt 3: retry = 2,
    // etc
    const n = cy.state('test').currentRetry
      ? cy.state('test').currentRetry()
      : 0
    return <div>retry {n}</div>
  }

  it('does not retry', { retries: 0 }, () => {
    mount(<Hello />)
    cy.contains('retry 0')

    // now let's fail the test - it won't retry it
    // enable manually to observe
    // cy.contains('retry 1')
  })

  it('retries', { retries: 3 }, () => {
    mount(<Hello />)
    // now let's fail the test - it will retry several times and pass
    cy.contains('retry 3', { timeout: 1500 })
  })
})
