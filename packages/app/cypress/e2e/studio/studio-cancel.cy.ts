import { launchStudio } from './helper'

describe('Cypress Studio', () => {
  it('creates a test using Studio, but cancels and does not write to file', () => {
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

    cy.get('[data-cy="hook-name-studio commands"]').should('exist')

    cy.get('a').contains('Cancel').click()

    // Cyprss re-runs after you cancel Studio.
    // Original spec should pass
    cy.waitForSpecToFinish({ passCount: 1 })

    cy.get('.command').should('have.length', 1)

    // Assert the spec was executed without any new commands.
    cy.get('.command-name-visit').within(() => {
      cy.contains('visit')
      cy.contains('cypress/e2e/index.html')
    })

    cy.get('[data-cy="hook-name-studio commands"]').should('not.exist')

    cy.withCtx(async (ctx) => {
      const spec = await ctx.actions.file.readFileInProject('cypress/e2e/spec.cy.js')

      // No change, since we cancelled.
      expect(spec.trim()).to.eq(`
it('visits a basic html page', () => {
  cy.visit('cypress/e2e/index.html')
})`.trim())
    })
  })
})
