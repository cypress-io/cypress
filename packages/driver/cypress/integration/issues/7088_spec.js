/// <reference types="cypress" />

describe('slatejs', () => {
  it('test', () => {
    cy.visit('fixtures/issue-7088.html')

    const testString = 'Hello world'

    cy.get('[data-slate-editor="true"]')
    .type(testString)

    cy.contains('[data-slate-string="true"]', testString)
    .should('be.visible')

    cy.get('[data-slate-editor="true"]')
    .type('{ctrl}{shift}{backspace}', { release: false })

    // In Firefox, {ctrl}{shift}{backspace} deletes only one word.
    if (Cypress.isBrowser('firefox')) {
      cy.get('[data-slate-editor="true"]')
      .type('{ctrl}{shift}{backspace}', { release: false })
    }

    cy.get('span[contenteditable="false"]').should('have.text', 'Enter some plain text...')
  })
})
