/* eslint-disable no-undef */
const httpUrl = Cypress.env('httpUrl')
const httpsUrl = Cypress.env('httpsUrl')

describe('cookies', () => {
  beforeEach(() => {
    cy.wrap({ foo: 'bar' })
  })

  context('with preserve', () => {
    before(() => {
      Cypress.Cookies.defaults({
        preserve: 'foo1',
      })
    })

    it('can get all cookies', () => {
      let expectedKeys = ['domain', 'name', 'value', 'path', 'secure', 'httpOnly', 'expiry']

      if (Cypress.isBrowser('firefox')) {
        expectedKeys.push('sameSite')
      }

      cy.clearCookie('foo1')
      cy.setCookie('foo', 'bar').then((c) => {
        expect(c.domain).to.eq('localhost')
        expect(c.httpOnly).to.eq(false)
        expect(c.name).to.eq('foo')
        expect(c.value).to.eq('bar')
        expect(c.path).to.eq('/')
        expect(c.secure).to.eq(false)
        expect(c.expiry).to.be.a('number')
        expect(c).to.have.keys(expectedKeys)
      })

      cy.getCookies()
      .should('have.length', 1)
      .then((cookies) => {
        const c = cookies[0]

        expect(c.domain).to.eq('localhost')
        expect(c.httpOnly).to.eq(false)
        expect(c.name).to.eq('foo')
        expect(c.value).to.eq('bar')
        expect(c.path).to.eq('/')
        expect(c.secure).to.eq(false)
        expect(c.expiry).to.be.a('number')
        expect(c).to.have.keys(expectedKeys)
      })

      cy.clearCookies().should('be.null')

      cy.setCookie('wtf', 'bob', { httpOnly: true, path: '/foo', secure: true })
      cy.getCookie('wtf').then((c) => {
        expect(c.domain).to.eq('localhost')
        expect(c.httpOnly).to.eq(true)
        expect(c.name).to.eq('wtf')
        expect(c.value).to.eq('bob')
        expect(c.path).to.eq('/foo')
        expect(c.secure).to.eq(true)
        expect(c.expiry).to.be.a('number')
        expect(c).to.have.keys(expectedKeys)
      })

      cy.clearCookie('wtf').should('be.null')
      cy.getCookie('doesNotExist').should('be.null')

      cy.document()
      .its('cookie')
      .should('be.empty')
    })

    it('resets cookies between tests correctly', () => {
      Cypress.Cookies.preserveOnce('foo2')

      Cypress._.times(100, (i) => {
        cy.setCookie(`foo${i}`, `${i}`)
      })

      cy.getCookies().should('have.length', 100)
    })

    it('should be only two left now', () => {
      cy.getCookies().should('have.length', 2)
    })

    it('handles undefined cookies', () => {
      cy.visit(`${httpUrl}/cookieWithNoName`)
    })
  })

  context('without preserve', () => {
    before(() => {
      Cypress.Cookies.defaults({
        preserve: [],
      })
    })

    it('sends cookies to localhost:2121', () => {
      cy.clearCookies()
      cy.setCookie('asdf', 'jkl')
      cy.request(`${httpUrl}/requestCookies`)
      .its('body').should('deep.eq', { asdf: 'jkl' })
    })

    it('handles expired cookies secure', () => {
      cy.visit(`${httpUrl}/set`)
      cy.getCookie('shouldExpire').should('exist')
      cy.visit(`${httpUrl}/expirationMaxAge`)
      cy.getCookie('shouldExpire').should('not.exist')
      cy.visit(`${httpUrl}/set`)
      cy.getCookie('shouldExpire').should('exist')
      cy.visit(`${httpUrl}/expirationExpires`)
      cy.getCookie('shouldExpire').should('not.exist')
    })

    it('issue: #224 sets expired cookies between redirects', () => {
      cy.visit(`${httpUrl}/set`)
      cy.getCookie('shouldExpire').should('exist')
      cy.visit(`${httpUrl}/expirationRedirect`)
      cy.url().should('include', '/logout')
      cy.getCookie('shouldExpire').should('not.exist')

      cy.visit(`${httpUrl}/set`)
      cy.getCookie('shouldExpire').should('exist')
      cy.request(`${httpUrl}/expirationRedirect`)
      cy.getCookie('shouldExpire').should('not.exist')
    })

    it('issue: #1321 failing to set or parse cookie', () => {
      // this is happening because the original cookie was set
      // with a secure flag, and then expired without the secure
      // flag.
      cy.visit(`${httpsUrl}/setOneHourFromNowAndSecure`)
      cy.getCookies().should('have.length', 1)

      // secure cookies should have been attached
      cy.request(`${httpsUrl}/requestCookies`)
      .its('body').should('deep.eq', { shouldExpire: 'oneHour' })

      // secure cookies should not have been attached
      cy.request(`${httpUrl}/requestCookies`)
      .its('body').should('deep.eq', {})

      cy.visit(`${httpsUrl}/expirationMaxAge`)
      cy.getCookies().should('be.empty')
    })

    it('issue: #2724 does not fail on invalid cookies', () => {
      cy.request(`${httpsUrl}/invalidCookies`)
    })
  })
})
