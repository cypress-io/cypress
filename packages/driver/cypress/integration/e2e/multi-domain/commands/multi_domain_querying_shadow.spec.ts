// @ts-ignore / session support is needed for visiting about:blank between tests
context('multi-domain shadow dom', { experimentalSessionSupport: true, experimentalMultiDomain: true }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="shadow-dom-link"]').click()
  })

  it('types into input', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.get('#shadow-element-1').shadow().find('input')
    })
  })
})
