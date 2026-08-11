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

context('Cypress.env', () => {
  const removalMessage = '`Cypress.env()` was removed in Cypress version 16.0.0. Please update to use `Cypress.expose()` for non-sensitive values, or `cy.env()` for sensitive values that must remain in the Node process.'

  it('throws error when reading a variable', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.equal(`${removalMessage}\n\nThe variable being accessed was: \`FOO\``)
      expect(err.docsUrl).to.equal('https://on.cypress.io/cypress-env-migration')

      done()
    })

    Cypress.env('FOO')
  })

  it('throws error when writing a single variable', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.equal(`${removalMessage}\n\nThe variable being accessed was: \`FOO\``)

      done()
    })

    Cypress.env('FOO', 'bar')
  })

  it('throws error when writing an object of variables', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.equal(`${removalMessage}\n\nThe variables being accessed were: \`FOO\`, \`BAR\``)

      done()
    })

    Cypress.env({ FOO: 'foo', BAR: 'bar' })
  })

  it('throws error when reading every variable', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.equal(removalMessage)

      done()
    })

    Cypress.env()
  })

  // the spec bridge constructs its own Cypress instance
  it('throws error inside a cy.origin() callback', { browser: '!webkit' }, (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.include(removalMessage)
      expect(err.message).to.include('The variable being accessed was: `FOO`')

      done()
    })

    cy.origin('http://www.foobar.com:3500', () => {
      Cypress.env('FOO')
    })
  })
})
