context('multi-domain aliasing', () => {
  beforeEach(() => {
    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="dom-link"]').click()
  })

  it('.as()', () => {
    cy.switchToDomain('http://foobar.com:3500', () => {
      cy.get(':checkbox[name="colors"][value="blue"]').as('checkbox')
      cy.get('@checkbox').click().should('be.checked')
    })
  })
})
