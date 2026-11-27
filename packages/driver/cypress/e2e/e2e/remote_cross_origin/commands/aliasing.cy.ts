describe('experimental driver: aliasing in a cross-origin AUT', () => {
  beforeEach(() => {
    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="dom-link"]').click()
  })

  context('.as()', () => {
    it('supports dom elements', () => {
      cy.get(':checkbox[name="colors"][value="blue"]').as('checkbox')
      cy.get('@checkbox').click().should('be.checked')
    })
  })
})
