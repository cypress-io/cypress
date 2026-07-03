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

  // @see https://github.com/cypress-io/cypress/issues/3975
  context('issue 3975', function () {
    it('can relative redirect in a xhr onload', function () {
      cy.visit('/static/xhr_onload_redirect.html')
      cy.location('pathname').should('eq', '/static/index.html')
    })

    context('it can relative redirect in a settimeout', function () {
      it('with location.href', function () {
        cy.visit('/static/settimeout_redirect_href.html')
        cy.location('pathname').should('eq', '/static/index.html')
      })

      it('with window.location.href', function () {
        cy.visit('/static/settimeout_redirect_window_href.html')
        cy.location('pathname').should('eq', '/static/index.html')
      })

      it('with document.location.href', function () {
        cy.visit('/static/settimeout_redirect_document_href.html')
        cy.location('pathname').should('eq', '/static/index.html')
      })

      it('with window.document.location.href', function () {
        cy.visit('/static/settimeout_redirect_window_document_href.html')
        cy.location('pathname').should('eq', '/static/index.html')
      })

      it('with location.href = #hash', function () {
        cy.visit('/static/settimeout_redirect_href_hash.html')
        cy.location().should('include', {
          pathname: '/static/settimeout_redirect_href_hash.html',
          hash: '#foo',
        })
      })

      it('with location.replace()', function () {
        cy.visit('/static/settimeout_redirect_replace.html')
        cy.location('pathname').should('eq', '/static/index.html')
      })

      it('with location.assign()', function () {
        cy.visit('/static/settimeout_redirect_assign.html')
        cy.location('pathname').should('eq', '/static/index.html')
      })

      it('with location = ...', function () {
        cy.visit('/static/settimeout_redirect_set_location.html')
        cy.location('pathname').should('eq', '/static/index.html')
      })

      it('with window.location = ...', function () {
        cy.visit('/static/settimeout_redirect_set_window_location.html')
        cy.location('pathname').should('eq', '/static/index.html')
      })

      it('with document.location = ...', function () {
        cy.visit('/static/settimeout_redirect_set_document_location.html')
        cy.location('pathname').should('eq', '/static/index.html')
      })

      it('with window.document.location = ...', function () {
        cy.visit('/static/settimeout_redirect_set_window_document_location.html')
        cy.location('pathname').should('eq', '/static/index.html')
      })

      it('with document.location = #hash', function () {
        cy.visit('/static/settimeout_redirect_set_document_location_hash.html')
        cy.location().should('include', {
          pathname: '/static/settimeout_redirect_set_document_location_hash.html',
          hash: '#foo',
        })
      })

      it('with location.search', function () {
        cy.visit('/static/settimeout_redirect_search.html')
        cy.location().should('include', {
          pathname: '/static/settimeout_redirect_search.html',
          search: '?foo',
        })
      })

      it('with location.pathname', function () {
        cy.visit('/static/settimeout_redirect_pathname.html')
        cy.location('pathname').should('eq', '/index.html')
      })
    })

    it('can relative redirect in a onclick handler', function () {
      cy.visit('/static/onclick_redirect.html')
      cy.get('button').click()
      cy.location('pathname').should('eq', '/static/index.html')
    })

    it('can relative redirect in a settimeout with a base tag', function () {
      cy.visit('/static/settimeout_basetag_redirect.html')
      cy.location('pathname').should('eq', '/static/foo/bar/index.html')
    })

    // NOTE: user's repro
    it.skip('Login demo', function () {
      // cy.on('fail', console.error)
      cy.visit('https://apex.oracle.com/pls/apex/f?p=54707:LOGIN_DESKTOP', { timeout: 60000 })
      cy.get('#P9999_USERNAME').type('ApexUser')
      cy.get('#P9999_PASSWORD').type('Oradoc_db1')
      cy.get('.t-Button').click()
    })
  })

  // NOTE: skip in CI for now - can be flaky
  context.skip('can load some well-known sites in a timely manner', () => {
    [
      // FIXME: has to be HTTPS - https://github.com/cypress-io/cypress/issues/7268
      // 'http://apple.com',
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
