describe('Cypress Config upgrade workflow', () => {
  beforeEach(() => {
    cy.setupE2E('old-cypress-config')
  })

  it('Checks if you have a cypress config file', () => {
    cy.visitLaunchpad()
    cy.get('some-button').click()
    cy.hash().should('contain', '#some-page')
    cy.get('something-else')
    cy.visitApp()
    cy.click()
    cy.withCtx((ctx) => {
      expect(ctx.app.isGlobalMode).to.be.true
    })
  })
})
