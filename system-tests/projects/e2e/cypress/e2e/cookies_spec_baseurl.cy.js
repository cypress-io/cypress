/* eslint-disable no-undef */
const { _ } = Cypress

const expectedDomain = Cypress.env('expectedDomain')
const httpUrl = Cypress.env('httpUrl')
const httpsUrl = Cypress.env('httpsUrl')
const otherUrl = Cypress.env('otherUrl')
const otherHttpsUrl = Cypress.env('otherHttpsUrl')

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

  it('sends set cookies to path', () => {
    cy.clearCookies()
    cy.setCookie('asdf', 'jkl')
    .request('/requestCookies')
    .its('body').should('deep.eq', { asdf: 'jkl' })
  })

  it('handles expired cookies secure', () => {
    cy.visit('/set')
    cy.getCookie('shouldExpire').should('exist')
    cy.visit('/expirationMaxAge')
    cy.getCookie('shouldExpire').should('not.exist')
    cy.visit('/set')
    cy.getCookie('shouldExpire').should('exist')
    cy.visit('/expirationExpires')
    cy.getCookie('shouldExpire').should('not.exist')
  })

  it('issue: #224 sets expired cookies between redirects', () => {
    cy.visit('/set')
    cy.getCookie('shouldExpire').should('exist')
    cy.visit('/expirationRedirect')
    cy.url().should('include', '/logout')
    cy.getCookie('shouldExpire').should('not.exist')

    cy.visit('/set')
    cy.getCookie('shouldExpire').should('exist')
    cy.request('/expirationRedirect')
    cy.getCookie('shouldExpire').should('not.exist')
  })

  it('issue: #1321 failing to set or parse cookie', () => {
    // this is happening because the original cookie was set
    // with a secure flag, and then expired without the secure flag.
    cy.visit(`${httpsUrl}/setOneHourFromNowAndSecure`)
    cy.getCookies().should('have.length', 1)

    // secure cookies should have been attached
    cy.request(`${httpsUrl}/requestCookies`)
    .its('body').should('deep.eq', { shouldExpire: 'oneHour' })

    const hostName = new Cypress.Location(httpUrl).getHostName()

    // TODO(origin): remove 'if' check once https://github.com/cypress-io/cypress/issues/24332 is resolved
    if (!['localhost', '127.0.0.1'].includes(hostName)) {
      // secure cookies should not have been attached
      cy.request(`${httpUrl}/requestCookies`)
      .its('body').should('deep.eq', {})
    }

    cy.visit(`${httpsUrl}/expirationMaxAge`)
    cy.getCookies().should('be.empty')
  })

  it('issue: #2724 does not fail on invalid cookies', () => {
    cy.request(`${httpsUrl}/invalidCookies`)
  })

  // https://github.com/cypress-io/cypress/issues/5453
  it('can set and clear cookie', () => {
    cy.setCookie('foo', 'bar')
    cy.clearCookie('foo')
    cy.getCookie('foo').should('be.null')
  });

  [
    'visit',
    'request',
  ].forEach((cmd) => {
    context(`in a cy.${cmd}`, () => {
      // https://github.com/cypress-io/cypress/issues/5894
      it('can successfully send cookies as a Cookie header', () => {
        cy[cmd]({
          url: `/requestCookies${cmd === 'visit' ? 'Html' : ''}`,
          headers: {
            Cookie: 'a=b;b=c;c=s%3APtCc3lNiuqN0AtR9ffgKUnUsDzR5n_4B.qzFDJDvqx8PZNvmOkmcexDs7fRJLOel56Z8Ii6PL%2BFo',
          },
          method: cmd === 'visit' ? 'POST' : 'PATCH',
        })
        .then((res) => {
          if (cmd === 'visit') {
            return cy.get('body').then((body) => {
              return JSON.parse(body.text())
            })
          }

          return res.body
        }).then((cookies) => {
          expect(cookies).to.deep.eq({
            a: 'b',
            b: 'c',
            c: 's:PtCc3lNiuqN0AtR9ffgKUnUsDzR5n_4B.qzFDJDvqx8PZNvmOkmcexDs7fRJLOel56Z8Ii6PL+Fo',
          })
        })
      })

      // https://github.com/cypress-io/cypress/issues/6890
      it('ignores invalid set-cookie headers that contain control chars', () => {
        cy[cmd]('/invalidControlCharCookie')

        cy.request('/requestCookies')
        .then((res) => {
          return res.body
        }).then((cookies) => {
          expect(cookies).to.deep.eq({
            _valid: 'true',
          })
        })
      })

      context('with Domain = hostname', () => {
        const getCookieUrl = () => {
          return cy.location().its('hostname').then((hostname) => {
            let setCookieDomain = hostname

            if (['localhost', '127.0.0.1'].includes(expectedDomain)) {
              setCookieDomain = expectedDomain
            }

            return `${Cypress.config('baseUrl')}/setDomainCookie?domain=${setCookieDomain}`
          })
        }

        const requestCookiesUrl = `${Cypress.config('baseUrl')}/requestCookies`

        it('is set properly with no redirects', () => {
          getCookieUrl().then((setDomainCookieUrl) => {
            cy[cmd](setDomainCookieUrl)
          })

          cy.getCookies()
          .then((cookies) => {
            expect(cookies).to.have.length(1)
            expect(cookies[0]).to.include({
              name: 'domaincookie',
              value: 'foo',
            })
          })

          cy.request(requestCookiesUrl).its('body').should('include', { 'domaincookie': 'foo' })
          cy.request('POST', requestCookiesUrl).its('body').should('include', { 'domaincookie': 'foo' })
        })

        it('is set properly with redirects', () => {
          getCookieUrl().then((setDomainCookieUrl) => {
            cy[cmd](`${setDomainCookieUrl}&redirect=/requestCookiesHtml`)
          })

          cy.getCookies()
          .then((cookies) => {
            expect(cookies).to.have.length(1)
            expect(cookies[0]).to.include({
              name: 'domaincookie',
              value: 'foo',
            })
          })

          if (cmd === 'visit') {
            cy.url().should('include', requestCookiesUrl)
            cy.contains('domaincookie')
          }

          cy.request(requestCookiesUrl).its('body').should('include', { 'domaincookie': 'foo' })
          cy.request('POST', requestCookiesUrl).its('body').should('include', { 'domaincookie': 'foo' })
        })
      })

      context('with SameSite', () => {
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
                  const domain = (i % 2) === (8 - n) ? expectedDomain : altDomain

                  const expectedCookie = {
                    'name': `name${tag}${i}`,
                    'value': `val${tag}${i}`,
                    'path': '/',
                    // eslint-disable-next-line object-shorthand
                    'domain': domain,
                    'secure': false,
                    'httpOnly': false,
                    ...(domain[0] !== '.' && domain !== 'localhost' && domain !== '127.0.0.1' ? {
                      'hostOnly': true,
                    } : {}),
                  }

                  if (defaultSameSite) {
                    expectedCookie.sameSite = defaultSameSite
                  }

                  expectedGetCookiesArray.push(expectedCookie)
                })
              })

              expectedGetCookiesArray = _.reverse(_.sortBy(expectedGetCookiesArray, _.property('name')))

              // sanity check
              cy.clearAllCookies()
              cy.getAllCookies().should('have.length', 0)

              cy[cmd](`/setCascadingCookies?n=${n}&a=${altUrl}&b=${Cypress.env('baseUrl')}`)

              cy.getAllCookies().then((cookies) => {
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
