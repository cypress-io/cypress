// @ts-ignore / session support is needed for visiting about:blank between tests
context('multi-domain assertions', { experimentalSessionSupport: true }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="dom-link"]').click()
  })

  it('.should() and .and()', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.get(':checkbox[name="colors"][value="blue"]')
      .should('not.be.checked').and('not.be.disabled')
    })
  })
})
