describe('protocol events w/ shadow DOM', () => {
  it('has protocol events with shadow DOM selectors', () => {
    cy.visit('cypress/fixtures/shadow-dom.html')
    cy.get('#in-shadow', { includeShadowDom: true }).should('exist')
  })

  it('does not have cypress errors when visiting closed shadow roots', () => {
    cy.visit('cypress/fixtures/shadow-dom-closed.html')
    cy.get('#in-shadow', { includeShadowDom: true }).should('not.exist')
  })
})
