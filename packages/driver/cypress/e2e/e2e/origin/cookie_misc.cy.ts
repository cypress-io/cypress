// FIXME: currently cookies aren't cleared properly in headless mode with webkit between tests, as the below tests (excluding cy.origin) pass headfully locally.
describe('misc cookie tests', { browser: '!webkit' }, () => {
  // NOTE: For this test to work correctly, we need to have a FQDN, not localhost (www.foobar.com).
  // FIXES: https://github.com/cypress-io/cypress/issues/25174 (cookies are duplicated with prepended dot (.))
  it('does not duplicate cookies with a prepended dot for cookies that are stored inside the server side cookie jar (host only)', () => {
    cy.visit('https://www.foobar.com:3502/fixtures/trigger-cross-origin-redirect-to-self.html')

    // does a 302 redirect back to www.foobar.com primary-origin page, but sets a sameSite=None cookie
    cy.get('[data-cy="cookie-cross-origin-redirects-host-only"]').click()

    cy.getCookies({ domain: 'www.foobar.com' }).then((cookies) => {
      expect(cookies).to.have.length(1)

      const singleCookie = cookies[0]

      expect(singleCookie).to.have.property('name', 'foo')
      expect(singleCookie).to.have.property('value', 'bar')
      expect(singleCookie).to.have.property('domain', 'www.foobar.com')
    })
  })

  it('does not duplicate cookies with a prepended dot for cookies that are stored inside the server side cookie jar (non-host only)', () => {
    cy.visit('https://www.foobar.com:3502/fixtures/trigger-cross-origin-redirect-to-self.html')

    // does a 302 redirect back to www.foobar.com primary-origin page, but sets a sameSite=None cookie
    cy.get('[data-cy="cookie-cross-origin-redirects"]').click()

    cy.getCookies({ domain: 'www.foobar.com' }).then((cookies) => {
      expect(cookies).to.have.length(1)

      const singleCookie = cookies[0]

      expect(singleCookie).to.have.property('name', 'foo')
      expect(singleCookie).to.have.property('value', 'bar')
      expect(singleCookie).to.have.property('domain', '.www.foobar.com')
    })
  })

  /**
   * FIXES:
   * https://github.com/cypress-io/cypress/issues/25205 (cookies set with expired time with value deleted show up as set with value deleted)
   * https://github.com/cypress-io/cypress/issues/25495 (session cookies set with expired time with value deleted show up as set with value deleted)
   * https://github.com/cypress-io/cypress/issues/25148 (cannot log into azure, shows cookies are disabled/blocked)
   */
  describe('expiring cookies', { browser: '!webkit' }, () => {
    before(() => {
      cy.origin(`https://app.foobar.com:3503`, () => {
        window.makeRequest = Cypress.require('../../../support/utils').makeRequestForCookieBehaviorTests
      })
    })

    describe('removes cookies that are set with an expired expiry time from the server side cookie jar / browser via CDP/BiDi', () => {
      it('works with Max-Age=0', () => {
        cy.visit(`https://www.foobar.com:3502/fixtures/primary-origin.html`)

        cy.visit(`https://app.foobar.com:3503/fixtures/secondary-origin.html`)
        cy.origin(`https://app.foobar.com:3503`, () => {
          cy.window().then((win) => {
            return cy.wrap(window.makeRequest(win, `/set-cookie?cookie=foo=bar; Domain=.foobar.com;`))
          })

          cy.getCookie('foo').its('value').should('eq', 'bar')

          cy.window().then((win) => {
            return cy.wrap(window.makeRequest(win, `/set-cookie?cookie=foo=deleted; Domain=.foobar.com; Max-Age=0;`))
          })

          cy.getCookie('foo').should('eq', null)
        })
      })

      it('works with expires=Thu, 01-Jan-1970 00:00:01 GMT', () => {
        cy.visit(`https://www.foobar.com:3502/fixtures/primary-origin.html`)

        cy.visit(`https://app.foobar.com:3503/fixtures/secondary-origin.html`)
        cy.origin(`https://app.foobar.com:3503`, () => {
          cy.window().then((win) => {
            return cy.wrap(window.makeRequest(win, `/set-cookie?cookie=foo=bar; Domain=.foobar.com;`))
          })

          cy.getCookie('foo').its('value').should('eq', 'bar')

          cy.window().then((win) => {
            return cy.wrap(window.makeRequest(win, `/set-cookie?cookie=foo=deleted; Domain=.foobar.com; expires=Thu, 01-Jan-1970 00:00:01 GMT;`))
          })

          cy.getCookie('foo').should('eq', null)
        })
      })

      it('works with expires=Tues, 01-Jan-1980 00:00:01 GMT', () => {
        cy.visit(`https://www.foobar.com:3502/fixtures/primary-origin.html`)

        cy.visit(`https://app.foobar.com:3503/fixtures/secondary-origin.html`)
        cy.origin(`https://app.foobar.com:3503`, () => {
          cy.window().then((win) => {
            return cy.wrap(window.makeRequest(win, `/set-cookie?cookie=foo=bar; Domain=.foobar.com;`))
          })

          cy.getCookie('foo').its('value').should('eq', 'bar')

          cy.window().then((win) => {
            return cy.wrap(window.makeRequest(win, `/set-cookie?cookie=foo=deleted; Domain=.foobar.com; expires=Tues, 01-Jan-1980 00:00:01 GMT; Max-Age=0;`))
          })

          cy.getCookie('foo').should('eq', null)
        })
      })

      it('work with expires=Thu, 01-Jan-1970 00:00:01 GMT and Max-Age=0', () => {
        cy.visit(`https://www.foobar.com:3502/fixtures/primary-origin.html`)

        cy.visit(`https://app.foobar.com:3503/fixtures/secondary-origin.html`)
        cy.origin(`https://app.foobar.com:3503`, () => {
          cy.window().then((win) => {
            return cy.wrap(window.makeRequest(win, `/set-cookie?cookie=foo=bar; Domain=.foobar.com;`))
          })

          cy.getCookie('foo').its('value').should('eq', 'bar')

          cy.window().then((win) => {
            return cy.wrap(window.makeRequest(win, `/set-cookie?cookie=foo=deleted; Domain=.foobar.com; expires=Thu, 01-Jan-1970 00:00:01 GMT; Max-Age=0;`))
          })

          cy.getCookie('foo').should('eq', null)
        })
      })
    })

    describe('removes cookies that are set with an expired expiry time from the document.cookie patch / browser via CDP/BiDi', () => {
      it('works with Max-Age=0', () => {
        cy.visit(`https://www.foobar.com:3502/fixtures/primary-origin.html`)

        cy.visit(`https://app.foobar.com:3503/fixtures/secondary-origin.html`)
        cy.origin(`https://app.foobar.com:3503`, () => {
          cy.window().then((win) => {
            win.document.cookie = 'foo=bar'
          })

          cy.getCookie('foo').its('value').should('eq', 'bar')

          cy.window().then((win) => {
            win.document.cookie = 'foo=deleted; expires=Thu, 01-Jan-1970 00:00:01 GMT; Max-Age=0;'
          })

          cy.getCookie('foo').should('eq', null)
        })
      })

      it('works with expires=Thu, 01-Jan-1970 00:00:01 GMT', () => {
        cy.visit(`https://www.foobar.com:3502/fixtures/primary-origin.html`)

        cy.visit(`https://app.foobar.com:3503/fixtures/secondary-origin.html`)
        cy.origin(`https://app.foobar.com:3503`, () => {
          cy.window().then((win) => {
            win.document.cookie = 'foo=bar'
          })

          cy.getCookie('foo').its('value').should('eq', 'bar')

          cy.window().then((win) => {
            win.document.cookie = 'foo=deleted; Max-Age=0'
          })

          cy.getCookie('foo').should('eq', null)
        })
      })

      it('works with expires=Tues, 01-Jan-1980 00:00:01 GMT', () => {
        cy.visit(`https://www.foobar.com:3502/fixtures/primary-origin.html`)

        cy.visit(`https://app.foobar.com:3503/fixtures/secondary-origin.html`)
        cy.origin(`https://app.foobar.com:3503`, () => {
          cy.window().then((win) => {
            win.document.cookie = 'foo=bar'
          })

          cy.getCookie('foo').its('value').should('eq', 'bar')

          cy.window().then((win) => {
            win.document.cookie = 'foo=deleted; expires=Tues, 01-Jan-1980 00:00:01 GMT'
          })

          cy.getCookie('foo').should('eq', null)
        })
      })

      it('expires=Thu, 01-Jan-1970 00:00:01 GMT; Max-Age=0', () => {
        cy.visit(`https://www.foobar.com:3502/fixtures/primary-origin.html`)

        cy.visit(`https://app.foobar.com:3503/fixtures/secondary-origin.html`)
        cy.origin(`https://app.foobar.com:3503`, () => {
          cy.window().then((win) => {
            win.document.cookie = 'foo=bar'
          })

          cy.getCookie('foo').its('value').should('eq', 'bar')

          cy.window().then((win) => {
            win.document.cookie = 'foo=deleted; expires=Thu, 01-Jan-1970 00:00:01 GMT; Max-Age=0'
          })

          cy.getCookie('foo').should('eq', null)
        })
      })
    })
  })
})
