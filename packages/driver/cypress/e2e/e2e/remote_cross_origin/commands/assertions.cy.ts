describe('remote driver: assertions in a cross-origin AUT', { experimentalRemoteDriver: true }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="dom-link"]').click()
  })

  it('.should() and .and()', () => {
    cy.get(':checkbox[name="colors"][value="blue"]')
    .should('not.be.checked').and('not.be.disabled')
  })

  it('.should() and .and() on a non-DOM subject', () => {
    cy.wrap(true)
    .should('be.true').and('not.be.false')
  })
})
