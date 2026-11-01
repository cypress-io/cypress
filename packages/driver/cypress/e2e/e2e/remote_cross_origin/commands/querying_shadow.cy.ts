describe('remote driver: shadow dom in a cross-origin AUT', { experimentalRemoteDriver: true }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="shadow-dom-link"]').click()
  })

  it('.shadow()', () => {
    cy.get('#shadow-element-1').shadow().find('p.shadow-1')
    .should('have.text', 'Shadow Content 1')
  })
})
