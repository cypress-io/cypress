/* eslint-disable no-undef */
const { _ } = Cypress

const expectedDomain = Cypress.env('expectedDomain')
const httpUrl = Cypress.env('httpUrl')
const httpsUrl = Cypress.env('httpsUrl')
const otherUrl = Cypress.env('otherUrl')
const otherHttpsUrl = Cypress.env('otherHttpsUrl')

const baseUrlLocation = new Cypress.Location(Cypress.config('baseUrl'))

// setcookie sets on the superdomain by default
let setCookieDomain = `.${baseUrlLocation.getSuperDomain()}`

if (['localhost', '127.0.0.1'].includes(expectedDomain)) {
  setCookieDomain = expectedDomain
}

// chrome defaults to "unspecified"
let defaultSameSite = undefined

if (Cypress.isBrowser('firefox')) {
  // firefox will default to "no_restriction"
  // @see https://bugzilla.mozilla.org/show_bug.cgi?id=1624668
  defaultSameSite = 'no_restriction'
}

describe('cookies', () => {
  before(() => {
    if (Cypress.env('noBaseUrl')) {
      return
    }

    // assert we're running on expected baseurl
    expect(Cypress.env('baseUrl')).to.be.a('string')
    .and.have.length.gt(0)
    .and.eq(Cypress.config('baseUrl'))
  })

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
      let expectedCookieKeys = ['domain', 'name', 'value', 'path', 'secure', 'httpOnly', 'expiry']

      if (defaultSameSite) {
        // samesite will only be present if it is defined
        expectedCookieKeys.push('sameSite')
      }

      const assertFirstCookie = (c) => {
        expect(c.domain).to.eq(setCookieDomain)
        expect(c.httpOnly).to.eq(false)
        expect(c.name).to.eq('foo')
        expect(c.value).to.eq('bar')
        expect(c.path).to.eq('/')
        expect(c.secure).to.eq(false)
        expect(c.expiry).to.be.a('number')
        expect(c.sameSite).to.eq(defaultSameSite)
        expect(c).to.have.keys(expectedCookieKeys)
      }

      cy.clearCookie('foo1')
      cy.setCookie('foo', 'bar').then(assertFirstCookie)
      cy.getCookies()
      .should('have.length', 1)
      .its(0)
      .then(assertFirstCookie)

      cy.clearCookies()
      .should('be.null')

      cy.setCookie('wtf', 'bob', { httpOnly: true, path: '/foo', secure: true })
      cy.getCookie('wtf').then((c) => {
        expect(c.domain).to.eq(setCookieDomain)
        expect(c.httpOnly).to.eq(true)
        expect(c.name).to.eq('wtf')
        expect(c.value).to.eq('bob')
        expect(c.path).to.eq('/foo')
        expect(c.secure).to.eq(true)
        expect(c.expiry).to.be.a('number')
        expect(c.sameSite).to.eq(defaultSameSite)
        expect(c).to.have.keys(expectedCookieKeys)
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
      cy.visit('/cookieWithNoName')
    })
  })

  context('without preserve', () => {
    before(() => {
      Cypress.Cookies.defaults({
        preserve: [],
      })
    })

    ;[
      'visit',
      'request',
    ].forEach((cmd) => {
      context(`in a cy.${cmd}`, () => {
      // https://github.com/cypress-io/cypress/issues/5894

        context.only('with SameSite', () => {
          [
            { header: 'None', sameSite: 'no_restriction' },
            { header: 'Strict', sameSite: 'strict' },
            { header: 'Lax', sameSite: 'lax' },
          ].forEach(({ header, sameSite }) => {
            it(`${header} is set and sent with subsequent requests`, () => {
              const name = `ss${header}`

              cy.getCookie(name).should('be.null')

              let sameSiteUrl = `/samesite/${header}`
              let cookieDumpUrl = '/requestCookies'

              if (header === 'None') {
              // None should only be sent + set with HTTPS requests
                cookieDumpUrl = [httpsUrl, cookieDumpUrl].join('')
                sameSiteUrl = [httpsUrl, sameSiteUrl].join('')
              }

              cy[cmd](sameSiteUrl)

              cy.getCookie(name).should('include', {
                name,
                value: 'someval',
                sameSite,
              })

              cy.visit(`${cookieDumpUrl}Html`)
              .then((res) => {
                cy.get('body').then((body) => {
                  return JSON.parse(body.text())
                })
              }).then((body) => {
                expect(body).to.have.property(name).and.eq('someval')
              })

              cy.request(cookieDumpUrl)
              .then(({ body }) => {
                expect(body).to.have.property(name).and.eq('someval')
              })
            })
          })
        });

        [
          ['HTTP', otherUrl],
          ['HTTPS', otherHttpsUrl],
        ].forEach(([protocol, altUrl]) => {
          context(`when redirected to a ${protocol} URL`, () => {
            [
              ['different domain', 7],
              ['same domain', 8],
            ].forEach(([title, n]) => {
              it(`can set cookies on lots of redirects, ending with ${title}`, () => {
                const altDomain = (new Cypress.Location(altUrl)).getHostName()

                let expectedGetCookiesArray = []

                _.times(n + 1, (i) => {
                  ['foo', 'bar'].forEach((tag) => {
                    const expectedCookie = {
                      'name': `name${tag}${i}`,
                      'value': `val${tag}${i}`,
                      'path': '/',
                      'domain': (i % 2) === (8 - n) ? expectedDomain : altDomain,
                      'secure': false,
                      'httpOnly': false,
                    }

                    if (defaultSameSite) {
                      expectedCookie.sameSite = defaultSameSite
                    }

                    expectedGetCookiesArray.push(expectedCookie)
                  })
                })

                expectedGetCookiesArray = _.reverse(_.sortBy(expectedGetCookiesArray, _.property('name')))

                // sanity check
                cy.clearCookies({ domain: null })
                cy.getCookies({ domain: null }).should('have.length', 0)

                cy[cmd](`/setCascadingCookies?n=${n}&a=${altUrl}&b=${Cypress.env('baseUrl')}`)

                cy.getCookies({ domain: null }).then((cookies) => {
                // reverse them so they'll be in the order they were set
                  cookies = _.reverse(_.sortBy(cookies, _.property('name')))

                  expect(cookies).to.deep.eq(expectedGetCookiesArray)
                })
              })
            })
          })
        })
      })
    })
  })
})
