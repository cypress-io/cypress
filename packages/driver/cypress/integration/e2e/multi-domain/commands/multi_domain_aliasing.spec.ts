// @ts-ignore / session support is needed for visiting about:blank between tests
context('multi-domain aliasing', { experimentalSessionSupport: true }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="dom-link"]').click()
  })

  it('.as()', () => {
    cy.origin('http://foobar.com:3500', () => {
      cy.get(':checkbox[name="colors"][value="blue"]').as('checkbox')
      cy.get('@checkbox').click().should('be.checked')
    })
  })
})
