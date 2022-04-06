context('multi-domain waiting', () => {
  beforeEach(() => {
    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="multi-domain-secondary-link"]').click()
  })

  it('.wait()', () => {
    cy.origin('http://foobar.com:3500', () => {
      cy.wait(500)
    })
  })
})
