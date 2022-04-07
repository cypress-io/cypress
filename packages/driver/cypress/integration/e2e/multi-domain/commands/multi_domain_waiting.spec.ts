context('cy.origin waiting', () => {
  beforeEach(() => {
    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="cross-origin-secondary-link"]').click()
  })

  it('.wait()', () => {
    cy.origin('http://foobar.com:3500', () => {
      cy.wait(500)
    })
  })
})
