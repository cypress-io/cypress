/* eslint-disable
    brace-style,
    no-undef,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const httpUrl = Cypress.env('httpUrl')
const httpsUrl = Cypress.env('httpsUrl')

describe('cookies', () => {
  beforeEach(() => {
    return cy.wrap({ foo: 'bar' })
  })

  context('with preserve', () => {
    before(() => {
      return Cypress.Cookies.defaults({
        preserve: 'foo1',
      })
    })

    it('can get all cookies', () => {
      const expectedKeys = ['domain', 'name', 'value', 'path', 'secure', 'httpOnly', 'expiry']

      if (Cypress.isBrowser('firefox')) {
        expectedKeys.push('sameSite')
      }

      return cy
      .clearCookie('foo1')
      .setCookie('foo', 'bar').then((c) => {
        expect(c.domain).to.eq('localhost')
        expect(c.httpOnly).to.eq(false)
        expect(c.name).to.eq('foo')
        expect(c.value).to.eq('bar')
        expect(c.path).to.eq('/')
        expect(c.secure).to.eq(false)
        expect(c.expiry).to.be.a('number')

        expect(c).to.have.keys(expectedKeys)
      }).getCookies()
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
      }).clearCookies()
      .should('be.null')
      .setCookie('wtf', 'bob', { httpOnly: true, path: '/foo', secure: true })
      .getCookie('wtf').then((c) => {
        expect(c.domain).to.eq('localhost')
        expect(c.httpOnly).to.eq(true)
        expect(c.name).to.eq('wtf')
        expect(c.value).to.eq('bob')
        expect(c.path).to.eq('/foo')
        expect(c.secure).to.eq(true)
        expect(c.expiry).to.be.a('number')

        expect(c).to.have.keys(expectedKeys)
      }).clearCookie('wtf')
      .should('be.null')
      .getCookie('doesNotExist')
      .should('be.null')
      .document()
      .its('cookie')
      .should('be.empty')
    })

    it('resets cookies between tests correctly', () => {
      Cypress.Cookies.preserveOnce('foo2')

      for (let i = 1; i <= 100; i++) {
        (((i) => {
          return cy.setCookie(`foo${i}`, `${i}`)
        }))(i)
      }

      return cy.getCookies().should('have.length', 100)
    })

    it('should be only two left now', () => {
      return cy.getCookies().should('have.length', 2)
    })

    it('handles undefined cookies', () => {
      return cy.visit(`${httpUrl}/cookieWithNoName`)
    })
  })

  context('without preserve', () => {
    before(() => {
      return Cypress.Cookies.defaults({
        preserve: [],
      })
    })

    it('sends cookies to localhost:2121', () => {
      return cy
      .clearCookies()
      .setCookie('asdf', 'jkl')
      .request(`${httpUrl}/requestCookies`)
      .its('body').should('deep.eq', { asdf: 'jkl' })
    })

    it('handles expired cookies secure', () => {
      return cy
      .visit(`${httpUrl}/set`)
      .getCookie('shouldExpire').should('exist')
      .visit(`${httpUrl}/expirationMaxAge`)
      .getCookie('shouldExpire').should('not.exist')
      .visit(`${httpUrl}/set`)
      .getCookie('shouldExpire').should('exist')
      .visit(`${httpUrl}/expirationExpires`)
      .getCookie('shouldExpire').should('not.exist')
    })

    it('issue: #224 sets expired cookies between redirects', () => {
      return cy
      .visit(`${httpUrl}/set`)
      .getCookie('shouldExpire').should('exist')
      .visit(`${httpUrl}/expirationRedirect`)
      .url().should('include', '/logout')
      .getCookie('shouldExpire').should('not.exist')

      .visit(`${httpUrl}/set`)
      .getCookie('shouldExpire').should('exist')
      .request(`${httpUrl}/expirationRedirect`)
      .getCookie('shouldExpire').should('not.exist')
    })

    it('issue: #1321 failing to set or parse cookie', () => // this is happening because the original cookie was set
    // with a secure flag, and then expired without the secure
    // flag.
    {
      return cy
      .visit(`${httpsUrl}/setOneHourFromNowAndSecure`)
      .getCookies().should('have.length', 1)

      // secure cookies should have been attached
      .request(`${httpsUrl}/requestCookies`)
      .its('body').should('deep.eq', { shouldExpire: 'oneHour' })

      // secure cookies should not have been attached
      .request(`${httpUrl}/requestCookies`)
      .its('body').should('deep.eq', {})

      .visit(`${httpsUrl}/expirationMaxAge`)
      .getCookies().should('be.empty')
    })

    it('issue: #2724 does not fail on invalid cookies', () => {
      return cy.request(`${httpsUrl}/invalidCookies`)
    })
  })
})
