/* eslint-disable
    @cypress/dev/skip-comment,
    no-undef,
*/
describe('subdomains', () => {
  const help = 'http://help.foobar.com:2292'
  const session = 'http://session.foobar.com:2292'

  beforeEach(() => {
    cy.visit('http://www.foobar.com:2292')
  })

  it('can swap to help.foobar.com:2292', () => {
    cy.get('a').click()
    cy.origin(help, () => {
      cy.get('h1').should('contain', 'Help')
    })
  })

  it('can visit a subdomain in another test with cy.origin', () => {
    cy.visit('http://help.foobar.com:2292')
    cy.origin('http://help.foobar.com:2292', () => {
      cy.get('h1').should('contain', 'Help')
      cy.document().then((document) => {
        // set cookies that are just on this subdomain
        // and cookies on the superdomain
        // and then regular cookies too
        document.cookie = 'help=true; domain=help.foobar.com'
        document.cookie = 'asdf=asdf; domain=foobar.com'
        document.cookie = 'foo=bar'
      })

      cy.getCookies().then((cookies) => {
        expect(cookies.length).to.eq(3)
      })
    })
  })

  it('issue: #207: does not duplicate or hostOnly cookies as a domain cookie', () => {
    cy.visit('http://session.foobar.com:2292')
    cy.origin(session, () => {
      cy.getCookies().should('have.length', 1)
      cy.window().then((win) => {
        return new Cypress.Promise((resolve) => {
          const xhr = new win.XMLHttpRequest

          xhr.open('GET', '/cookies')
          xhr.send()
          xhr.onload = () => {
            return resolve(JSON.parse(xhr.response).cookie)
          }
        })
      }).then((cookie) => {
      // there should have been only a single secret-session
      // request cookie sent on this XHR request
        const occurrences = Cypress._.compact(cookie.split('secret-session'))

        expect(occurrences).to.have.length(1)
      })
    })
  })

  it('correctly sets domain based cookies', () => {
    const origin = 'http://domain.foobar.com:2292'

    cy.visit(origin)
    cy.origin(origin, () => {
      cy.getCookies().should('have.length', 1)
      cy.getCookie('nomnom').should('include', {
        domain: '.domain.foobar.com',
        name: 'nomnom',
        value: 'good',
        path: '/',
        secure: false,
        httpOnly: false,
      })

      cy.window().then((win) => {
        return new Cypress.Promise((resolve) => {
          const xhr = new win.XMLHttpRequest

          xhr.withCredentials = true
          xhr.open('GET', 'http://domain.foobar.com:2292/cookies')
          xhr.send()
          xhr.onload = () => {
            return resolve(JSON.parse(xhr.response).cookie)
          }
        })
      }).then((cookie) => {
        // only a single nomnom cookie should have been sent
        // since we set a domain cookie that matches this request
        expect(cookie).to.eq('nomnom=good')
      })
    })
  })

  // https://github.com/cypress-io/cypress/issues/363
  it('does not set domain based (non hostOnly) cookies by default', () => {
    cy.setCookie('foobar', '1', {
      domain: 'subdomain.foobar.com',
    })

    // sends a request to localhost but gets redirected back
    // to www.foobar.com
    cy.request('http://localhost:2292/redirect')
    .its('body.cookie')
    .should('not.exist')
  })

  it('sets a hostOnly cookie by default', () => {
    // this sets a hostOnly cookie for www.foobar.com
    cy.setCookie('foobar', '1')

    cy.request('http://domain.foobar.com:2292/cookies')
    .its('body.cookie')
    .should('not.exist')
  })

  it('issue #361: incorrect cookie synchronization between cy.request redirects', () => {
    // start with a cookie on foobar
    cy.setCookie('foobar', '1')

    // send a request to localhost but get
    // redirected back to foobar
    cy.request('http://localhost:2292/redirect')
    .its('body.cookie')
    .should('eq', 'foobar=1')
  })

  it('issue #362: incorrect cookie synchronization between cy.visit redirects', () => {
    // start with a cookie on foobar specifically for www
    cy.setCookie('foobar', '1', { domain: 'www.foobar.com' })

    // send a request to domain.foobar but get
    // redirected back to www.foobar.com
    cy.visit('http://domain.foobar.com:2292/domainRedirect')
    cy.get('#cookie')
    .should('have.text', 'foobar=1')
  })

  it('issue #600 can visit between nested subdomains', () => {
    cy.visit('http://qa.sub.foobar.com:2292')
    cy.origin('http://qa.sub.foobar.com:2292', () => {
      cy.contains('Nested Subdomains')
    })

    cy.visit('http://staging.sub.foobar.com:2292')
    cy.origin('http://staging.sub.foobar.com:2292', () => {
      cy.contains('Nested Subdomains')
    })
  })
})
