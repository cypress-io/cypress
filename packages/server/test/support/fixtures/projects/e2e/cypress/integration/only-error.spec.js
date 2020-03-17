/// <reference types="cypress"/>
/* eslint-disable mocha/no-exclusive-tests */

// this spec should have only one failure
// 1st test fails, 2nd test should pass

const err = new Error('foo error')

describe('error with .only', () => {
  it.only('fails', () => {
    throw err
  })

  it.only('had error', () => {
    cy.spy(top.console, 'error')
    // click on the 'print-error-to-console' button
    cy.$$('.runnable-err-print', top.document).eq(0).click()
    expect(top.console.error).calledWithMatch(err.toString())
  })
})
