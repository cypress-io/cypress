describe('WebKit-specific behavior', { browser: 'webkit' }, () => {
  it('cy.origin() is disabled', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.equal('`cy.origin()` is not currently supported in experimental WebKit.')
      expect(err.docsUrl).to.equal('https://on.cypress.io/webkit-experiment')
      done()
    })

    cy.origin('foo', () => {})
  })

  it('forceNetworkError intercept option is disabled', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.include('`forceNetworkError` was passed, but it is not currently supported in experimental WebKit.')
      expect(err.docsUrl).to.equal('https://on.cypress.io/intercept')
      done()
    })

    cy.intercept('http://foo.com', { forceNetworkError: true })
  })
})
