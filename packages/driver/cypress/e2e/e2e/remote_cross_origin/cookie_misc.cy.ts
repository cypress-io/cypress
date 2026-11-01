let requestId = 0

// The AUT is cross-origin, so code reaches it as an inline handler rather than through cy.window()
const runInAut = (code: string) => {
  cy.get('body').invoke('attr', 'onclick', `document.body.removeAttribute('onclick'); ${code}`)
  cy.get('body').trigger('click', { force: true })
}

const fetchInAut = (url: string) => {
  const id = `request-${++requestId}`

  runInAut(`fetch(${JSON.stringify(url)}).then(() => document.body.dataset.request = '${id}:ok', () => document.body.dataset.request = '${id}:error')`)
  cy.get('body').should('have.attr', 'data-request', `${id}:ok`)
}

describe('remote driver: misc cookie tests in a cross-origin AUT', { experimentalRemoteDriver: true }, () => {
  // NOTE: For this test to work correctly, we need to have a FQDN, not localhost (www.foobar.com).
  it('does not duplicate cookies with a prepended dot for cookies that are stored inside the server side cookie jar (host only)', () => {
    cy.visit('https://www.foobar.com:3502/fixtures/trigger-cross-origin-redirect-to-self.html')

    // does a 302 redirect back to www.foobar.com primary-origin page, but sets a sameSite=None cookie
    cy.get('[data-cy="cookie-cross-origin-redirects-host-only"]').click()

    cy.getCookies({ domain: 'www.foobar.com' }).should((cookies) => {
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

    cy.getCookies({ domain: 'www.foobar.com' }).should((cookies) => {
      expect(cookies).to.have.length(1)

      const singleCookie = cookies[0]

      expect(singleCookie).to.have.property('name', 'foo')
      expect(singleCookie).to.have.property('value', 'bar')
      expect(singleCookie).to.have.property('domain', '.www.foobar.com')
    })
  })

  it('cookies are not set for XHR sync requests', () => {
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
    cy.visit('http://www.foobar.com:3500/')
    runInAut(`
      const xhr = new XMLHttpRequest()

      xhr.open('GET', '/set-cookie?cookie=foo=bar', false)
      xhr.send()

      const xhr2 = new XMLHttpRequest()

      xhr2.open('GET', '/async', true)
      xhr2.send()
    `)

    // wait for the async XHR response to arrive
    cy.wait('@async')

    cy.getAllCookies().should((cookies) => {
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

  describe('expiring cookies', () => {
    describe('removes cookies that are set with an expired expiry time from the server side cookie jar / browser via CDP', () => {
      const expireCookieFromServer = (expiringCookie: string) => {
        cy.visit(`https://www.foobar.com:3502/fixtures/primary-origin.html`)

        cy.visit(`https://app.foobar.com:3503/fixtures/secondary-origin.html`)
        fetchInAut(`/set-cookie?cookie=foo=bar; Domain=.foobar.com;`)

        cy.getCookie('foo').its('value').should('eq', 'bar')

        fetchInAut(`/set-cookie?cookie=${expiringCookie}`)

        cy.getCookie('foo').should('eq', null)
      }

      it('works with Max-Age=0', () => {
        expireCookieFromServer('foo=deleted; Domain=.foobar.com; Max-Age=0;')
      })

      it('works with expires=Thu, 01-Jan-1970 00:00:01 GMT', () => {
        expireCookieFromServer('foo=deleted; Domain=.foobar.com; expires=Thu, 01-Jan-1970 00:00:01 GMT;')
      })

      it('works with expires=Tues, 01-Jan-1980 00:00:01 GMT', () => {
        expireCookieFromServer('foo=deleted; Domain=.foobar.com; expires=Tues, 01-Jan-1980 00:00:01 GMT; Max-Age=0;')
      })

      it('work with expires=Thu, 01-Jan-1970 00:00:01 GMT and Max-Age=0', () => {
        expireCookieFromServer('foo=deleted; Domain=.foobar.com; expires=Thu, 01-Jan-1970 00:00:01 GMT; Max-Age=0;')
      })
    })

    describe('removes cookies that are set with an expired expiry time from document.cookie / browser via CDP', () => {
      const expireCookieFromPage = (expiringCookie: string) => {
        cy.visit(`https://www.foobar.com:3502/fixtures/primary-origin.html`)

        cy.visit(`https://app.foobar.com:3503/fixtures/secondary-origin.html`)
        runInAut(`document.cookie = 'foo=bar'`)

        cy.getCookie('foo').its('value').should('eq', 'bar')

        runInAut(`document.cookie = ${JSON.stringify(expiringCookie)}`)

        cy.getCookie('foo').should('eq', null)
      }

      it('works with Max-Age=0', () => {
        expireCookieFromPage('foo=deleted; expires=Thu, 01-Jan-1970 00:00:01 GMT; Max-Age=0;')
      })

      it('works with expires=Thu, 01-Jan-1970 00:00:01 GMT', () => {
        expireCookieFromPage('foo=deleted; Max-Age=0')
      })

      it('works with expires=Tues, 01-Jan-1980 00:00:01 GMT', () => {
        expireCookieFromPage('foo=deleted; expires=Tues, 01-Jan-1980 00:00:01 GMT')
      })

      it('expires=Thu, 01-Jan-1970 00:00:01 GMT; Max-Age=0', () => {
        expireCookieFromPage('foo=deleted; expires=Thu, 01-Jan-1970 00:00:01 GMT; Max-Age=0')
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
      // 1. the AUT visits www.foobar.com:3500 and sets a cookie via Set-Cookie response header
      cy.visit(`http://${hostnameA}`)
      fetchInAut(`http://${hostnameA}/set-cookie?cookie=${cookie}; Domain=${site}`)

      // 2. the AUT navigates to app.foobar.com:3500, same-site but cross-origin to the first page, and sets it again
      cy.visit(`http://${hostnameB}`)
      fetchInAut(`http://${hostnameB}/set-cookie?cookie=${cookie}; Domain=${site}`)

      // 3. back on the first domain, the cookie is attached to its request
      cy.visit(`http://${hostnameA}`)
      fetchInAut(`http://${hostnameA}/test-request`)

      cy.wait('@cookiedRequest').then(({ request }) => {
        expect(request.headers.cookie).to.equal(cookie)
      })
    })
  })
})

export {}
