describe('protocol events w/ shadow DOM', () => {
  it('has protocol events with shadow DOM selectors', () => {
    cy.visit('cypress/fixtures/shadow-dom.html')
    cy.get('#in-shadow', { includeShadowDom: true }).should('exist')
  })
})
