// @ts-ignore / session support is needed for visiting about:blank between tests
context('multi-domain route', { experimentalSessionSupport: true, experimentalMultiDomain: true }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="multi-domain-secondary-link"]').click()
  })

  it('throws an error that the `cy.route()` method is deprecated and forbidden when attempted use is in multi-domain', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.equal('`cy.route()` has been deprecated and use is forbidden in `cy.switchToDomain()`. Consider migrating to using `cy.intercept()` instead.')
      done()
    })

    cy.switchToDomain('foobar.com', () => {
      cy.route('api')
    })
  })
})
