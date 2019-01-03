/// <reference path="@/../../../../../../../cli/types/index.d.ts"/>

// https://github.com/cypress-io/cypress/issues/2956
describe('mousemove mouseleave events', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3500/fixtures/issue-2956.html')
  })
  it('sends mouseenter/mouseleave event', () => {
    cy.get('#outer').click()
    cy.get('#inner').should('be.visible')
    cy.get('body').click()
    cy.get('#inner').should('not.be.visible')
  })
})
