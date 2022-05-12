context('cy.origin unsupported commands', () => {
  beforeEach(() => {
    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="cross-origin-secondary-link"]').click()
  })

  afterEach(() => {
    // FIXME: Tests that end with a cy.origin command and enqueue no further cy
    // commands may have origin's unload event bleed into subsequent tests
    // and prevent stability from being reached, causing those tests to hang.
    // We enqueue another cy command after each test to ensure stability
    // is reached for the next test. This additional command can be removed with the
    // completion of: https://github.com/cypress-io/cypress/issues/21300
    cy.then(() => { /* ensuring stability */ })
  })

  it('cy.route() method is deprecated', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.equal('`cy.route()` has been deprecated and its use is not supported in the `cy.origin()` callback. Consider using `cy.intercept()` (outside of the callback) instead.')
      expect(err.docsUrl).to.equal('https://on.cypress.io/intercept')
      done()
    })

    cy.origin('http://foobar.com:3500', () => {
      cy.route('api')
    })
  })

  it('cy.server() method is deprecated', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.equal('`cy.server()` has been deprecated and its use is not supported in the `cy.origin()` callback. Consider using `cy.intercept()` (outside of the callback) instead.')
      expect(err.docsUrl).to.equal('https://on.cypress.io/intercept')
      done()
    })

    cy.origin('http://foobar.com:3500', () => {
      cy.server()
    })
  })

  it('cy.origin() is not yet supported', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.equal('`cy.origin()` use is not currently supported in the `cy.origin()` callback, but is planned for a future release. Please 👍 the following issue and leave a comment with your use-case:')
      expect(err.docsUrl).to.equal('https://on.cypress.io/github-issue/20718')
      done()
    })

    cy.origin('http://foobar.com:3500', () => {
      cy.origin('barbaz.com', () => {})
    })
  })

  it('cy.intercept() is not supported', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.equal('`cy.intercept()` use is not supported in the `cy.origin()` callback. Consider using it outside of the callback instead. Otherwise, please 👍 the following issue and leave a comment with your use-case:')
      expect(err.docsUrl).to.equal('https://on.cypress.io/github-issue/20720')
      done()
    })

    cy.origin('http://foobar.com:3500', () => {
      cy.intercept('/foo')
    })
  })

  it('cy.session() is not supported', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.equal('`cy.session()` use is not supported in the `cy.origin()` callback. Consider using it outside of the callback instead. Otherwise, please 👍 the following issue and leave a comment with your use-case:')
      expect(err.docsUrl).to.equal('https://on.cypress.io/github-issue/20721')
      done()
    })

    cy.origin('http://foobar.com:3500', () => {
      cy.session('/foo')
    })
  })
})
