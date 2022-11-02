context('cy.server', () => {
  it('throws error on use of cy.server', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.equal('`cy.server()` was removed in Cypress version 12.0.0. Please update to use `cy.intercept()` instead.')
      expect(err.docsUrl).to.equal('https://on.cypress.io/intercept')

      done()
    })

    cy.server()
  })
})

context('cy.route', () => {
  it('throws error on use of cy.route', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.equal('`cy.route()` was removed in Cypress version 12.0.0. Please update to use `cy.intercept()` instead.')
      expect(err.docsUrl).to.equal('https://on.cypress.io/intercept')

      done()
    })

    cy.route('/foo')
  })
})

context('Cypress.server.defaults', () => {
  it('throws error on use of Cypress.Server.defaults', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.equal('`Cypress.Server.defaults()` was removed in Cypress version 12.0.0. Please update to use `cy.intercept()` instead.')
      expect(err.docsUrl).to.equal('https://on.cypress.io/intercept')

      done()
    })

    Cypress.Server.defaults({})
  })
})

context('Cypress.Cookies.defaults', () => {
  it('throws error on use of Cookies.defaults()', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.equal('`Cypress.Cookies.defaults()` was removed in Cypress version 12.0.0. Please update to use `cy.session()` instead.')
      expect(err.docsUrl).to.equal('https://on.cypress.io/session')

      done()
    })

    Cypress.Cookies.defaults({})
  })
})

context('Cypress.Cookies.preserveOnce', () => {
  it('throws error on use of Cookies.preserveOnce', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.equal('`Cypress.Cookies.preserveOnce()` was removed in Cypress version 12.0.0. Please update to use `cy.session()` instead.')
      expect(err.docsUrl).to.equal('https://on.cypress.io/session')

      done()
    })

    Cypress.Cookies.preserveOnce({})
  })
})
