import { makeRequestForCookieBehaviorTests as makeRequest } from '../../../../support/utils'

declare global {
  interface Window {
    makeRequest: (
      win: Cypress.AUTWindow,
      url: string,
      client?: 'fetch' | 'xmlHttpRequest',
      credentials?: 'same-origin' | 'include' | 'omit' | boolean,
    ) => Promise<any>
  }
}

describe('Cookie Behavior', { browser: '!webkit' }, () => {
  const serverConfig = {
    http: {
      sameOriginPort: 3500,
      crossOriginPort: 3501,
    },
    https: {
      sameOriginPort: 3502,
      crossOriginPort: 3503,
    },
  }

  beforeEach(() => {
    cy.clearCookies()
  })

  Object.keys(serverConfig).forEach((scheme) => {
    const sameOriginPort = serverConfig[scheme].sameOriginPort
    const crossOriginPort = serverConfig[scheme].crossOriginPort

    describe(`Scheme: ${scheme}://`, () => {
      // without cy.origin means the AUT has the same origin as top
      describe('w/o cy.origin', () => {
        describe('misc', () => {
          describe('domains', () => {
            it('attaches subdomain and TLD cookies when making subdomain requests', () => {
              cy.intercept(`${scheme}://app.foobar.com:${crossOriginPort}/test-request`, (req) => {
                expect(req['headers']['cookie']).to.equal('foo=bar; bar=baz')

                req.reply({
                  statusCode: 200,
                })
              }).as('cookieCheck')

              cy.visit(`${scheme}://app.foobar.com:${sameOriginPort}`)
              cy.window().then((win) => {
                return cy.wrap(makeRequest(win, '/set-cookie?cookie=foo=bar; Domain=app.foobar.com', 'fetch'))
              })

              cy.window().then((win) => {
                return cy.wrap(makeRequest(win, `${scheme}://app.foobar.com:${crossOriginPort}/set-cookie-credentials?cookie=bar=baz; Domain=.foobar.com`, 'fetch', 'include'))
              })

              // Cookie should not be sent with app.foobar.com:3500/test as it does NOT fit the domain
              cy.window().then((win) => {
                return cy.wrap(makeRequest(win, `${scheme}://app.foobar.com:${crossOriginPort}/set-cookie-credentials?cookie=baz=quux; Domain=www.foobar.com`, 'fetch', 'include'))
              })

              cy.window().then((win) => {
                return cy.wrap(makeRequest(win, `${scheme}://app.foobar.com:${crossOriginPort}/test-request`, 'fetch', 'include'))
              })

              cy.wait('@cookieCheck')
            })
          })
        })
      })
    })
  })
})
