/// <reference types="cypress" />

it('fails', () => {
  cy.get('#does-not-exist', { timeout: 1 })
})

it('tests out file opening for above failure', () => {
  cy.wrap(Cypress.$(window.top.document.body))
  .find('.reporter')
  .contains('fails')
  .closest('.runnable-wrapper')
  .within(() => {
    // TODO: click the link and test that it opens the right thing
    cy.get('.runnable-err-stack-trace')
    // TODO: click the link and test that it opens the right thing
    cy.get('.test-err-code-frame .runnable-err-file-path')
  })
})
