context('multi-domain shadow dom', () => {
  beforeEach(() => {
    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="shadow-dom-link"]').click()
  })

  it('.shadow()', () => {
    cy.origin('http://foobar.com:3500', () => {
      cy.get('#shadow-element-1').shadow().find('p.shadow-1')
      .should('have.text', 'Shadow Content 1')
    })
  })
})
