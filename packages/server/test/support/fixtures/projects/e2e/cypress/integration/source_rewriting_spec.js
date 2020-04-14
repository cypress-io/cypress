describe('source rewriting spec', function () {
  it('obstructive code is replaced', function () {
    // based off of driver e2e security_spec
    cy.visit('/obstructive_code.html')
    cy.contains('html ran')
    cy.contains('js ran')
    cy.get('body').then(([body]) => {
      expect(body.innerText).to.not.contain('security triggered')
    })
  })

  // TODO: trying to reproduce https://github.com/cypress-io/cypress/issues/3975
  context.skip('issue 3975', function () {
    it('can redirect in a xhr onload', function () {
      cy.visit('/xhr_onload_redirect.html')
      cy.get('button').click()
    })

    it('Login demo', function () {
      // cy.on('fail', console.error)
      cy.visit('https://apex.oracle.com/pls/apex/f?p=54707:LOGIN_DESKTOP', { timeout: 60000 })
      cy.get('#P9999_USERNAME').type('ApexUser')
      cy.get('#P9999_PASSWORD').type('Oradoc_db1')
      cy.get('.t-Button').click()
    })
  })

  context('can load some well-known sites in a timely manner', () => {
    [
      'http://apple.com',
      'http://google.com',
      'http://facebook.com',
      'http://cypress.io',
      'http://docs.cypress.io',
      'http://github.com',
    ].forEach((url) => {
      it(url, () => {
        cy.visit(url, { timeout: 60000 })
      })
    })
  })
})
