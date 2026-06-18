describe('WebKit-specific behavior', { browser: 'webkit' }, () => {
  it('cy.origin() is disabled', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.equal('`cy.origin()` is not currently supported in experimental WebKit.')
      expect(err.docsUrl).to.equal('https://on.cypress.io/webkit-experiment')
      done()
    })

    cy.origin('foo', () => {})
  })

  it('req.destroy() works in intercept handler', (done) => {
    cy.intercept('/foo', (req) => {
      req.destroy()
    }).then(() => {
      $.get('/foo').fail((xhr) => {
        expect(xhr).to.include({
          status: 0,
          statusText: 'error',
          readyState: 0,
        })

        done()
      })
    })
  })
})
