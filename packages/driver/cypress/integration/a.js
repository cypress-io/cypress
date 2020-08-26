/// <reference types="cypress" />

// There is uncaught exception on the editor side, when using cy.type
Cypress.on('uncaught:exception', (err, runnable) => {
  return false
})

describe('page', () => {
  it('works in Firefox, fails in Chrome', () => {
    cy.visit('http://www.slatejs.org/examples/plaintext')

    const testString = 'Hello world'

    cy.get('[data-slate-editor="true"]')
    .type('{ctrl}{shift}{backspace}', { release: false, noUpdate: true })
    .type(testString, { noUpdate: true })

    cy.contains('[data-slate-string="true"]', testString)
    .should('be.visible')
  })
})
