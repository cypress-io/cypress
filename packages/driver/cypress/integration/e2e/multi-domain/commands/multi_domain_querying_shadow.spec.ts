// @ts-ignore / session support is needed for visiting about:blank between tests
context('multi-domain shadow dom', { experimentalSessionSupport: true }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="shadow-dom-link"]').click()
  })

  it('.shadow()', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.get('#shadow-element-1').shadow().find('p.shadow-1')
      .should('have.text', 'Shadow Content 1')
    })
  })
})
