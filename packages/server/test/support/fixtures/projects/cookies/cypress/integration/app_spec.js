/* eslint-disable
    no-undef,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
Cypress.Cookies.defaults({
  preserve: 'foo1',
})

describe('Cookies', () => {
  beforeEach(() => {
    return cy.wrap({ foo: 'bar' })
  })

  it('can get all cookies', () => {
    return cy
    .setCookie('foo', 'bar').then((c) => {
      expect(c.domain).to.eq('localhost')
      expect(c.httpOnly).to.eq(false)
      expect(c.name).to.eq('foo')
      expect(c.value).to.eq('bar')
      expect(c.path).to.eq('/')
      expect(c.secure).to.eq(false)
      expect(c.expiry).to.be.a('number')

      expect(c).to.have.keys(
        'domain', 'name', 'value', 'path', 'secure', 'httpOnly', 'expiry',
      )
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

      expect(c).to.have.keys(
        'domain', 'name', 'value', 'path', 'secure', 'httpOnly', 'expiry',
      )
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

      expect(c).to.have.keys(
        'domain', 'name', 'value', 'path', 'secure', 'httpOnly', 'expiry',
      )
    }).clearCookie('wtf')
    .should('be.null')
    .getCookie('doesNotExist')
    .should('be.null')
    .document()
    .its('cookie')
    .should('be.empty')
  })

  it('resets cookies between tests correctly', () => {
    beforeEach(() => {
      return Cypress.Cookies.preserveOnce('foo2')
    })

    for (let i = 1; i <= 100; i++) {
      (((i) => {
        return cy.setCookie(`foo${i}`, `${i}`)
      }))(i)
    }

    return cy.getCookies().should('have.length', 100)
  })

  it('should be zero now', () => {
    return cy.getCookies().should('have.length', 2)
  })

  it('sends cookies to localhost:2121', () => {
    return cy
    .clearCookies()
    .setCookie('asdf', 'jkl')
    .request('http://localhost:2121/foo')
    .its('body').should('deep.eq', { foo1: '1', asdf: 'jkl' })
    .setCookie('wow', 'bob', { domain: 'brian.dev.local' })
    .request({
      url: 'http://localhost:2121/foo',
      domain: 'brian.dev.local',
    })
    .its('body').should('deep.eq', { wow: 'bob' })
  })
})
