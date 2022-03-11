describe('baseUrl', () => {
  it('should show baseUrl warning if Cypress cannot connect to provided baseUrl', () => {
    cy.scaffoldProject('config-with-base-url-warning')
    cy.openProject('config-with-base-url-warning')
    cy.visitLaunchpad()

    cy.get('[data-cy-testingtype="e2e"]').click()
    cy.get('[data-cy="alert"]').contains('Warning: Cannot Connect Base Url Warning')

    cy.withCtx((ctx) => {
      ctx._apis.projectApi.isListening = sinon.stub().resolves(null)
    })

    cy.contains('button', 'Retry').click()
    cy.get('[data-cy="alert"]').should('not.exist')
  })
})
