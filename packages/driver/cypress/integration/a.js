/// <reference types="cypress" />

describe('slatejs', () => {
  it('test', () => {
    cy.visit('http://www.slatejs.org/examples/plaintext')

    const testString = 'Hello world'

    cy.get('[data-slate-editor="true"]')
    .type('{ctrl}{shift}{backspace}', { release: false, noUpdate: true })
    .type(testString, { noUpdate: true })

    cy.contains('[data-slate-string="true"]', testString)
    .should('be.visible')
  })
})
