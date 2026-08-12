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

context('cy.end', () => {
  it('throws error on use of cy.end', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.equal('`cy.end()` was removed in Cypress version 16.0.0. A Cypress chain is already terminated when the next `cy.<command>()` starts a new chain, so `.end()` calls can be removed.')
      expect(err.docsUrl).to.equal('https://on.cypress.io/migration-guide')

      done()
    })

    cy.end()
  })

  it('throws error when chained off another command', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.equal('`cy.end()` was removed in Cypress version 16.0.0. A Cypress chain is already terminated when the next `cy.<command>()` starts a new chain, so `.end()` calls can be removed.')

      done()
    })

    cy.wrap({}).end()
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
  const removalMessage = '`Cypress.env()` was removed in Cypress version 16.0.0. Please update to use `Cypress.expose()` for non-sensitive values, or `cy.env()` for sensitive values.'
  const pluginMessage = 'This call may come from a plugin. Update the plugin to a version that supports Cypress 16.'

  it('throws error when reading a key', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.equal(`${removalMessage}\n\nThe key being accessed was: \`FOO\`\n\n${pluginMessage}`)
      expect(err.docsUrl).to.equal('https://on.cypress.io/cypress-env-migration')

      done()
    })

    Cypress.env('FOO')
  })

  it('throws error when writing a single key', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.equal(`${removalMessage}\n\nThe key being accessed was: \`FOO\`\n\n${pluginMessage}`)

      done()
    })

    Cypress.env('FOO', 'bar')
  })

  it('throws error when writing an object of keys', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.equal(`${removalMessage}\n\nThe keys being accessed were: \`FOO\`, \`BAR\`\n\n${pluginMessage}`)

      done()
    })

    Cypress.env({ FOO: 'foo', BAR: 'bar' })
  })

  it('throws error when reading every key', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.equal(`${removalMessage}\n\n${pluginMessage}`)

      done()
    })

    Cypress.env()
  })

  // TODO: Webkit does not have correct stack traces on errors currently
  it('points the code frame and stack at the call site', { browser: '!webkit' }, (done) => {
    cy.on('fail', (err) => {
      expect(err.codeFrame).to.exist
      expect(err.codeFrame.relativeFile).to.include('removed_commands.cy.js')
      expect(err.codeFrame.frame).to.include('Cypress.env')
      expect(err.stack).to.include('From Your Spec Code:')
      expect(err.stack).not.to.include('bluebird')

      done()
    })

    Cypress.env('FOO')
  })

  // the spec bridge constructs its own Cypress instance
  it('throws error inside a cy.origin() callback', { browser: '!webkit' }, (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.include(removalMessage)
      expect(err.message).to.include('The key being accessed was: `FOO`')

      done()
    })

    cy.origin('http://www.foobar.com:3500', () => {
      Cypress.env('FOO')
    })
  })
})
