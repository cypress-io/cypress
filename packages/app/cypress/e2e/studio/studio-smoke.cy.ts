import { launchStudio } from './helper'

describe('Cypress Studio', () => {
  it('updates an existing test with a click action', () => {
    launchStudio()

    cy.getAutIframe().within(() => {
      cy.get('p').contains('Count is 0')

      // (1) First Studio action - get
      cy.get('#increment')

      // (2) Second Studio action - click
      .realClick().then(() => {
        cy.get('p').contains('Count is 1')
      })
    })

    cy.get('[data-cy="hook-name-studio commands"]').closest('.hook-studio').within(() => {
      cy.get('.command').should('have.length', 2)
      // (1) Get Command
      cy.get('.command-name-get').should('contain.text', '#increment')

      // (2) Click Command
      cy.get('.command-name-click').should('contain.text', 'click')
    })

    cy.get('button').contains('Save Commands').click()

    cy.withCtx(async (ctx) => {
      const spec = await ctx.actions.file.readFileInProject('cypress/e2e/spec.cy.js')

      expect(spec.trim()).to.eq(`
it('visits a basic html page', () => {
  cy.visit('cypress/e2e/index.html')
  /* ==== Generated with Cypress Studio ==== */
  cy.get('#increment').click();
  /* ==== End Cypress Studio ==== */
})`.trim())
    })
  })
})
