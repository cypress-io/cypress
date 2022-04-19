context('cy.origin waiting', () => {
  beforeEach(() => {
    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="cross-origin-secondary-link"]').click()
  })

  it('.wait()', () => {
    cy.origin('http://foobar.com:3500', () => {
      const delay = cy.spy(Cypress.Promise, 'delay')

      cy.wait(50).then(() => {
        expect(delay).to.be.calledWith(50, 'wait')
      })
    })
  })
})
