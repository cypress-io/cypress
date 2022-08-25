describe('Cypress Studio', () => {
  it('updates an existing test with a click action', () => {
    cy.scaffoldProject('experimental-studio')
    cy.openProject('experimental-studio')
    cy.startAppServer('e2e')
    cy.visitApp()
    cy.visit(`http://localhost:4455/__/#/specs/runner?file=cypress/e2e/spec.cy.js`)

    cy.waitForSpecToFinish()

    // Should not show "Studio Commands" until we've started a new Studio session.
    cy.get('[data-cy="hook-name-studio commands"]').should('not.exist')

    cy
    .contains('visits a basic html page')
    .closest('.runnable-wrapper')
    .realHover()
    .findByTestId('launch-studio')
    .click()

    // Studio re-executes spec before waiting for commands - wait for the spec to finish executing.
    cy.waitForSpecToFinish()

    cy.get('[data-cy="hook-name-studio commands"]').should('exist')

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

  // TODO: Can we somehow do the "Create Test" workflow within Cypress in Cypress?
  it.skip('creates a brand new test', () => {
    cy.scaffoldProject('experimental-studio')
    cy.openProject('experimental-studio')
    cy.startAppServer('e2e')
    cy.visitApp()
    cy.visit(`http://localhost:4455/__/#/specs/runner?file=cypress/e2e/empty.cy.js`)

    cy.waitForSpecToFinish()

    cy.contains('Create test with Cypress Studio').click()
    cy.get('[data-cy="aut-url"]').as('urlPrompt')

    cy.get('@urlPrompt').within(() => {
      cy.contains('Continue ➜').should('be.disabled')
    })

    cy.get('@urlPrompt').type('http://localhost:4455/cypress/e2e/index.html')

    cy.get('@urlPrompt').within(() => {
      cy.contains('Continue ➜').should('not.be.disabled')
      cy.contains('Cancel').click()
    })

    // TODO: Can we somehow do the "Create Test" workflow within Cypress in Cypress?
  })
})
