// @ts-ignore / session support is needed for visiting about:blank between tests
context('multi-domain waiting', { experimentalSessionSupport: true }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="multi-domain-secondary-link"]').click()
  })

  it('.wait()', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.wait(500)
    })
  })
})
