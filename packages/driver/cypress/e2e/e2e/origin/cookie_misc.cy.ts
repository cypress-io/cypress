import { makeRequestForCookieBehaviorTests as makeRequest } from '../../../support/utils'

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

  it('cookies are not set for XHR sync requests', { browser: '!webkit' }, () => {
    // this intercept won't get hit because the request is sync
    cy.intercept('http://www.foobar.com:3500/set-cookie*', (req) => {
      req.reply({
        headers: {
          'set-cookie': 'SYNC_COOKIE=sync',
        },
        body: '',
      })
    })

    cy.intercept('http://www.foobar.com:3500/async', {
      headers: {
        'set-cookie': 'ASYNC_COOKIE=async',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ foo: 1, bar: 2 }),
    }).as('async')

    cy.visit('http://localhost:3500/fixtures/empty.html')
    cy.origin('http://www.foobar.com:3500', () => {
      cy.visit('http://www.foobar.com:3500/')
      cy.window().then((win) => {
        const xhr = new win.XMLHttpRequest()

        xhr.open('GET', '/set-cookie?cookie=foo=bar', false)
        xhr.send()

        const xhr2 = new win.XMLHttpRequest()

        xhr2.open('GET', '/async', true)
        xhr2.send()
      })
    })

    // wait for the async XHR response to arrive
    cy.wait('@async')
    // cy.getAllCookies does not wait for the cookies to be set, so we need to wait manually
    cy.wait(500)

    cy.getAllCookies().then((cookies) => {
      const isFirefox = Cypress.isBrowser({ family: 'firefox' })

      // For a cookie set via Set-Cookie with no SameSite attribute, Firefox's BiDi
      // layer can report `sameSite` as either `default` (→ Cypress 'unspecified')
      // or `lax`. Both describe the same cookie state — per `cli/types/cypress.d.ts`,
      // `'unspecified'` is the documented default for Firefox 140+. Coerce to
      // `'lax'` so the assertion matches the effective SameSite behavior used by
      // every other browser.
      const normalizeFirefoxSameSiteToLax = (cookie: Cypress.Cookie) => {
        if (cookie.sameSite === 'unspecified') {
          return { ...cookie, sameSite: 'lax' }
        }

        return cookie
      }

      const asyncCookie = {
        name: 'ASYNC_COOKIE',
        value: 'async',
        path: '/',
        secure: false,
        hostOnly: true,
        httpOnly: false,
        domain: 'www.foobar.com',
        sameSite: 'lax',
      }

      const fooBarCookie = {
        name: 'foo',
        value: 'bar',
        path: '/',
        secure: false,
        hostOnly: true,
        httpOnly: false,
        domain: 'www.foobar.com',
        sameSite: 'lax',
      }

      if (isFirefox) {
        // in Firefox both the foo=bar and ASYNC_COOKIE=async cookies will be set
        // SYNC_COOKIE=sync is not set because the intercept is not hit
        expect(cookies).to.have.length(2)
        expect(normalizeFirefoxSameSiteToLax(cookies[0])).to.deep.equal(fooBarCookie)
        expect(normalizeFirefoxSameSiteToLax(cookies[1])).to.deep.equal(asyncCookie)
      } else {
        // in other browsers only the ASYNC_COOKIE=async cookie will be set
        // SYNC_COOKIE=sync is not set because the intercept is not hit
        // foo=bar is not set because the request is sync and we are not able to sync the cookie with the automation
        expect(cookies).to.have.length(1)
        expect(cookies[0]).to.deep.equal(asyncCookie)
      }
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

    describe('removes cookies that are set with an expired expiry time from the server side cookie jar / browser via CDP', () => {
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

    describe('removes cookies that are set with an expired expiry time from the document.cookie patch / browser via CDP', () => {
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

  describe('Same-Site Cross-Origin cookie behavior', () => {
    const cookie = 'foo1=bar2'
    const site = 'foobar.com'
    const hostnameA = `www.${site}:3500`
    const hostnameB = `app.${site}:3500`

    beforeEach(() => {
      cy.intercept(`http://${hostnameA}/test-request`, (req) => {
        req.reply({
          statusCode: 200,
        })
      }).as('cookiedRequest')
    })

    it('attaches cookies to proxied requests in a same-site cross-origin context', () => {
      // 1. visits www.foobar.com:3500: The AUT and top are the same-origin
      cy.visit(`http://${hostnameA}`).then(() => {
        // 2. set a cookie via Set-Cookie Response header. Since top and AUT are the same-origin, this works
        // @ts-expect-error
        cy.wrap(makeRequest(window.top, `http://${hostnameA}/set-cookie?cookie=${cookie}; Domain=${site}`, 'fetch'))
      })

      // 3. navigate the AUT to app.foobar.com:3500. Now AUT and top are same-site, but cross-origin.
      // in an actual browser, the AUT and top would both be app.foobar.com:3500 and would be same-origin
      cy.visit(`http://${hostnameB}`).then(() => {
        // 4. set a cookie via Set-Cookie Response header. This FAILS in Cypress <= 13 here because the AUT is cross-origin to top,
        // but WOULD PASS in an actual browser because AUT and top would both be same-origin.

        // This also does NOT get simulated in Cypress <= 13 because the simulation conditions in the Cypress middleware check
        // for same super domain origin and not same origin in Cypress <= 13, so the cookies are NOT simulated.
        // In Cypress 14, we are changing this to check for same origin for simulation conditions, which will allow this cookie
        // to be set and correctly simulate the AUT as top.
        // @ts-expect-error
        cy.wrap(makeRequest(window.top, `http://${hostnameB}/set-cookie?cookie=${cookie}; Domain=${site}`, 'fetch'))
      })

      // 5. mock a navigation back to the first domain (this isn't necessary but makes the test cleaner) now AUT and top are same-origin
      cy.visit(`http://${hostnameA}`).then(() => {
        // @ts-expect-error
        cy.wrap(makeRequest(window.top, `http://${hostnameA}/test-request`, 'fetch'))

        cy.wait('@cookiedRequest').then(({ request }) => {
          // in Cypress <= 13, this should be (which is wrong)
          // expect(req['headers']['cookie']).to.equal('foo1=bar1')

          // in Cypress 14, this should be (which is correct)
          expect(request.headers.cookie).to.equal(cookie)
        })
      })
    })
  })
})
