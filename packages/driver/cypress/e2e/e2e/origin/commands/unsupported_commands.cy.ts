context('cy.origin unsupported commands', { browser: '!webkit' }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="cross-origin-secondary-link"]').click()
  })

  it('cy.route() method is deprecated', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.equal('`cy.route()` has been deprecated and its use is not supported in the `cy.origin()` callback. Consider using `cy.intercept()` (outside of the callback) instead.')
      expect(err.docsUrl).to.equal('https://on.cypress.io/intercept')
      done()
    })

    cy.origin('http://www.foobar.com:3500', () => {
      cy.route('api')
    })
  })

  it('cy.server() method is deprecated', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.equal('`cy.server()` has been deprecated and its use is not supported in the `cy.origin()` callback. Consider using `cy.intercept()` (outside of the callback) instead.')
      expect(err.docsUrl).to.equal('https://on.cypress.io/intercept')
      done()
    })

    cy.origin('http://www.foobar.com:3500', () => {
      cy.server()
    })
  })

  it('cy.origin() is not yet supported', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.equal('`cy.origin()` use is not currently supported in the `cy.origin()` callback, but is planned for a future release. Please 👍 the following issue and leave a comment with your use-case:')
      expect(err.docsUrl).to.equal('https://on.cypress.io/github-issue/20718')
      done()
    })

    cy.origin('http://www.foobar.com:3500', () => {
      cy.origin('barbaz.com', () => {})
    })
  })

  it('cy.intercept() is not supported', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.equal('`cy.intercept()` use is not supported in the `cy.origin()` callback. Consider using it outside of the callback instead. Otherwise, please 👍 the following issue and leave a comment with your use-case:')
      expect(err.docsUrl).to.equal('https://on.cypress.io/github-issue/20720')
      done()
    })

    cy.origin('http://www.foobar.com:3500', () => {
      cy.intercept('/foo')
    })
  })

  it('cy.session() is not supported', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.equal('`cy.session()` use is not supported in the `cy.origin()` callback. Consider using it outside of the callback instead. Otherwise, please 👍 the following issue and leave a comment with your use-case:')
      expect(err.docsUrl).to.equal('https://on.cypress.io/github-issue/20721')
      done()
    })

    cy.origin('http://www.foobar.com:3500', () => {
      cy.session('/foo')
    })
  })
})
