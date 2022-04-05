context('multi-domain assertions', () => {
  beforeEach(() => {
    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="dom-link"]').click()
  })

  it('.should() and .and()', () => {
    cy.switchToDomain('http://foobar.com:3500', () => {
      cy.get(':checkbox[name="colors"][value="blue"]')
      .should('not.be.checked').and('not.be.disabled')
    })
  })
})
