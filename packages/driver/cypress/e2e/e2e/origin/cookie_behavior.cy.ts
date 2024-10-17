import { makeRequestForCookieBehaviorTests as makeRequest } from '../../../support/utils'

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
      // with cy.origin means the AUT has navigated away and the top origin does NOT match the AUT origin
      // the server side cookie jar now needs to simulate the AUT url as top
      describe('w/ cy.origin', () => {
        let originUrl: string

        before(() => {
          originUrl = `${scheme}://www.foobar.com:${sameOriginPort}`

          cy.origin(`${scheme}://www.foobar.com:${sameOriginPort}`, () => {
            window.makeRequest = Cypress.require('../../../support/utils').makeRequestForCookieBehaviorTests
          })
        })

        describe('same site / same origin', () => {
          describe('XMLHttpRequest', () => {
            // withCredentials option should have no effect on same-site requests
            // XHR requests seem like they need to be absolute within a cy.origin block, but fetch requests can be relative?
            it('sets and attaches same-site cookies to request', () => {
              cy.intercept(`${originUrl}/test-request`, (req) => {
                expect(req['headers']['cookie']).to.equal('foo1=bar1')

                req.reply({
                  statusCode: 200,
                })
              }).as('cookieCheck')

              cy.visit('/fixtures/primary-origin.html')
              cy.get(`a[data-cy="cookie-${scheme}"]`).click()

              // cookie jar should now mimic http://www.foobar.com:3500 / https://foobar.com:3502 as top
              cy.origin(originUrl, {
                args: originUrl,
              }, (originUrl) => {
                cy.window().then((win) => {
                  return cy.wrap(window.makeRequest(win, `${originUrl}/set-cookie?cookie=foo1=bar1; Domain=foobar.com`, 'xmlHttpRequest'))
                })

                cy.window().then((win) => {
                  return cy.wrap(window.makeRequest(win, `${originUrl}/test-request`, 'xmlHttpRequest'))
                })

                cy.wait('@cookieCheck')
              })
            })
          })

          describe('fetch', () => {
            it('sets and attaches same-site cookies to request by default (same-origin)', () => {
              cy.intercept(`${originUrl}/test-request`, (req) => {
                expect(req['headers']['cookie']).to.equal('foo1=bar1')

                req.reply({
                  statusCode: 200,
                })
              }).as('cookieCheck')

              cy.visit('/fixtures/primary-origin.html')
              cy.get(`a[data-cy="cookie-${scheme}"]`).click()

              // cookie jar should now mimic http://www.foobar.com:3500 / https://foobar.com:3502 as top
              cy.origin(originUrl, () => {
                cy.window().then((win) => {
                  return cy.wrap(window.makeRequest(win, '/set-cookie?cookie=foo1=bar1; Domain=foobar.com', 'fetch'))
                })

                cy.window().then((win) => {
                  return cy.wrap(window.makeRequest(win, '/test-request', 'fetch'))
                })

                cy.wait('@cookieCheck')
              })
            })

            // this test should behave exactly the same as the (same-origin) test, but adding here incase our implementation is not consistent
            it('sets and attaches same-site cookies to request if "include" credentials option is specified', () => {
              cy.intercept(`${originUrl}/test-request`, (req) => {
                expect(req['headers']['cookie']).to.equal('foo1=bar1')

                req.reply({
                  statusCode: 200,
                })
              }).as('cookieCheck')

              cy.visit('/fixtures/primary-origin.html')
              cy.get(`a[data-cy="cookie-${scheme}"]`).click()

              // cookie jar should now mimic http://www.foobar.com:3500 / https://foobar.com:3502 as top
              cy.origin(originUrl, () => {
                cy.window().then((win) => {
                  return cy.wrap(window.makeRequest(win, '/set-cookie?cookie=foo1=bar1; Domain=foobar.com', 'fetch'))
                })

                cy.window().then((win) => {
                  return cy.wrap(window.makeRequest(win, '/test-request', 'fetch'))
                })

                cy.wait('@cookieCheck')
              })
            })

            it.only('does NOT attach same-site cookies to request if "omit" credentials option is specified', () => {
              cy.intercept(`${originUrl}/test-request`, (req) => {
                expect(req['headers']['cookie']).to.equal(undefined)

                req.reply({
                  statusCode: 200,
                })
              }).as('cookieCheck')

              cy.visit('/fixtures/primary-origin.html')
              cy.get(`a[data-cy="cookie-${scheme}"]`).click()

              // cookie jar should now mimic http://www.foobar.com:3500 / https://foobar.com:3502 as top
              cy.origin(originUrl, () => {
                cy.window().then((win) => {
                  // set the cookie in the browser
                  return cy.wrap(window.makeRequest(win, '/set-cookie?cookie=foo1=bar1; Domain=foobar.com', 'fetch'))
                })

                cy.window().then((win) => {
                  // but omit the cookies in the request
                  return cy.wrap(window.makeRequest(win, '/test-request', 'fetch', 'omit'))
                })

                cy.wait('@cookieCheck')
              })
            })

            it('does NOT set same-site cookies from request if "omit" credentials option is specified', () => {
              cy.intercept(`${originUrl}/test-request`, (req) => {
                expect(req['headers']['cookie']).to.equal(undefined)

                req.reply({
                  statusCode: 200,
                })
              }).as('cookieCheck')

              cy.visit('/fixtures/primary-origin.html')
              cy.get(`a[data-cy="cookie-${scheme}"]`).click()

              // cookie jar should now mimic http://www.foobar.com:3500 / https://foobar.com:3502 as top
              cy.origin(originUrl, () => {
                cy.window().then((win) => {
                  // do NOT set the cookie in the browser
                  return cy.wrap(window.makeRequest(win, '/set-cookie?cookie=foo1=bar1; Domain=foobar.com', 'fetch', 'omit'))
                })

                cy.window().then((win) => {
                  // but send the cookies in the request
                  return cy.wrap(window.makeRequest(win, '/test-request', 'fetch'))
                })

                cy.wait('@cookieCheck')
              })
            })
          })
        })

        describe('same site / cross origin', () => {
          describe('XMLHttpRequest', () => {
            it('does NOT set and attach same-site cookies to request when the request is cross-origin', () => {
              cy.intercept(`${scheme}://app.foobar.com:${crossOriginPort}/test-request`, (req) => {
                expect(req['headers']['cookie']).to.equal(undefined)

                req.reply({
                  statusCode: 200,
                })
              }).as('cookieCheck')

              cy.visit('/fixtures/primary-origin.html')
              cy.get(`a[data-cy="cookie-${scheme}"]`).click()

              // cookie jar should now mimic http://www.foobar.com:3500 / https://foobar.com:3502 as top
              cy.origin(originUrl, {
                args: {
                  scheme,
                  crossOriginPort,
                },
              }, ({ scheme, crossOriginPort }) => {
                cy.window().then((win) => {
                  // do NOT set the cookie in the browser
                  return cy.wrap(window.makeRequest(win, `${scheme}://app.foobar.com:${crossOriginPort}/set-cookie?cookie=foo1=bar1; Domain=foobar.com`, 'xmlHttpRequest'))
                })

                cy.window().then((win) => {
                  // but send the cookies in the request
                  return cy.wrap(window.makeRequest(win, `${scheme}://app.foobar.com:${crossOriginPort}/test-request`, 'xmlHttpRequest'))
                })

                cy.wait('@cookieCheck')
              })
            })

            it('sets cookie on same-site request if withCredentials is true, but does not attach to same-site request if withCredentials is false', () => {
              cy.intercept(`${scheme}://app.foobar.com:${crossOriginPort}/test-request`, (req) => {
                expect(req['headers']['cookie']).to.equal(undefined)

                req.reply({
                  statusCode: 200,
                })
              }).as('cookieCheck')

              cy.visit('/fixtures/primary-origin.html')
              cy.get(`a[data-cy="cookie-${scheme}"]`).click()

              // cookie jar should now mimic http://www.foobar.com:3500 / https://foobar.com:3502 as top
              cy.origin(originUrl, {
                args: {
                  scheme,
                  crossOriginPort,
                },
              }, ({ scheme, crossOriginPort }) => {
                cy.window().then((win) => {
                  // do NOT set the cookie in the browser
                  return cy.wrap(window.makeRequest(win, `${scheme}://app.foobar.com:${crossOriginPort}/set-cookie-credentials?cookie=foo1=bar1; Domain=foobar.com`, 'xmlHttpRequest', true))
                })

                // though request is cross origin, site should have access directly to cookie because it is same site
                // assert cookie value is actually set in the browser
                cy.getCookie('foo1').its('value').should('equal', 'bar1')

                cy.window().then((win) => {
                  // but send the cookies in the request
                  return cy.wrap(window.makeRequest(win, `${scheme}://app.foobar.com:${crossOriginPort}/test-request`, 'xmlHttpRequest'))
                })

                cy.wait('@cookieCheck')
              })
            })

            it('sets cookie on same-site request if withCredentials is true, and attaches to same-site request if withCredentials is true', () => {
              cy.intercept(`${scheme}://app.foobar.com:${crossOriginPort}/test-request-credentials`, (req) => {
                expect(req['headers']['cookie']).to.equal('foo1=bar1')

                req.reply({
                  statusCode: 200,
                })
              }).as('cookieCheck')

              cy.visit('/fixtures/primary-origin.html')
              cy.get(`a[data-cy="cookie-${scheme}"]`).click()

              // cookie jar should now mimic http://www.foobar.com:3500 / https://foobar.com:3502 as top
              cy.origin(originUrl, {
                args: {
                  scheme,
                  crossOriginPort,
                },
              }, ({ scheme, crossOriginPort }) => {
                cy.window().then((win) => {
                  // do NOT set the cookie in the browser
                  return cy.wrap(window.makeRequest(win, `${scheme}://app.foobar.com:${crossOriginPort}/set-cookie-credentials?cookie=foo1=bar1; Domain=foobar.com`, 'xmlHttpRequest', true))
                })

                // though request is cross origin, site should have access directly to cookie because it is same site
                // assert cookie value is actually set in the browser
                cy.getCookie('foo1').its('value').should('equal', 'bar1')

                cy.window().then((win) => {
                  // but send the cookies in the request
                  return cy.wrap(window.makeRequest(win, `${scheme}://app.foobar.com:${crossOriginPort}/test-request-credentials`, 'xmlHttpRequest', true))
                })

                cy.wait('@cookieCheck')
              })
            })
          })

          describe('fetch', () => {
            it('does not set same-site cookies from request nor send same-site cookies by default (same-origin)', () => {
              cy.intercept(`${scheme}://app.foobar.com:${crossOriginPort}/test-request-credentials`, (req) => {
                expect(req['headers']['cookie']).to.equal(undefined)

                req.reply({
                  statusCode: 200,
                })
              }).as('cookieCheck')

              cy.visit('/fixtures/primary-origin.html')
              cy.get(`a[data-cy="cookie-${scheme}"]`).click()

              // cookie jar should now mimic http://www.foobar.com:3500 / https://foobar.com:3502 as top
              cy.origin(originUrl, {
                args: {
                  scheme,
                  crossOriginPort,
                },
              }, ({ scheme, crossOriginPort }) => {
                cy.window().then((win) => {
                  return cy.wrap(window.makeRequest(win, `${scheme}://app.foobar.com:${crossOriginPort}/set-cookie-credentials?cookie=foo1=bar1; Domain=foobar.com`, 'fetch'))
                })

                cy.window().then((win) => {
                  return cy.wrap(window.makeRequest(win, `${scheme}://app.foobar.com:${crossOriginPort}/test-request-credentials`, 'fetch'))
                })

                cy.wait('@cookieCheck')
              })
            })

            it('sets same-site cookies from request and sends same-site cookies if "include" credentials option is specified', () => {
              cy.intercept(`${scheme}://app.foobar.com:${crossOriginPort}/test-request-credentials`, (req) => {
                expect(req['headers']['cookie']).to.equal('foo1=bar1')

                req.reply({
                  statusCode: 200,
                })
              }).as('cookieCheck')

              cy.visit('/fixtures/primary-origin.html')
              cy.get(`a[data-cy="cookie-${scheme}"]`).click()

              // cookie jar should now mimic http://www.foobar.com:3500 / https://foobar.com:3502 as top
              cy.origin(originUrl, {
                args: {
                  scheme,
                  crossOriginPort,
                },
              }, ({ scheme, crossOriginPort }) => {
                cy.window().then((win) => {
                  return cy.wrap(window.makeRequest(win, `${scheme}://app.foobar.com:${crossOriginPort}/set-cookie-credentials?cookie=foo1=bar1; Domain=foobar.com`, 'fetch', 'include'))
                })

                // assert cookie value is actually set in the browser
                cy.getCookie('foo1').its('value').should('equal', 'bar1')

                cy.window().then((win) => {
                  return cy.wrap(window.makeRequest(win, `${scheme}://app.foobar.com:${crossOriginPort}/test-request-credentials`, 'fetch', 'include'))
                })
              })
            })

            it('sets same-site cookies if "include" credentials option is specified from request, but does not attach same-site cookies to request by default (same-origin)', () => {
              cy.intercept(`${scheme}://app.foobar.com:${crossOriginPort}/test-request-credentials`, (req) => {
                expect(req['headers']['cookie']).to.equal(undefined)

                req.reply({
                  statusCode: 200,
                })
              }).as('cookieCheck')

              cy.visit('/fixtures/primary-origin.html')
              cy.get(`a[data-cy="cookie-${scheme}"]`).click()

              // cookie jar should now mimic http://www.foobar.com:3500 / https://foobar.com:3502 as top
              cy.origin(originUrl, {
                args: {
                  scheme,
                  crossOriginPort,
                },
              }, ({ scheme, crossOriginPort }) => {
                cy.window().then((win) => {
                  return cy.wrap(window.makeRequest(win, `${scheme}://app.foobar.com:${crossOriginPort}/set-cookie-credentials?cookie=foo1=bar1; Domain=foobar.com`, 'fetch', 'include'))
                })

                // assert cookie value is actually set in the browser
                cy.getCookie('foo1').its('value').should('equal', 'bar1')

                cy.window().then((win) => {
                  return cy.wrap(window.makeRequest(win, `${scheme}://app.foobar.com:${crossOriginPort}/test-request-credentials`, 'fetch'))
                })

                cy.wait('@cookieCheck')
              })
            })

            // this should have the same effect as same-origin option for same-site/cross-origin requests, but adding here incase our implementation is not consistent
            it('does not set or send same-site cookies if "omit" credentials option is specified', () => {
              cy.intercept(`${scheme}://app.foobar.com:${crossOriginPort}/test-request-credentials`, (req) => {
                expect(req['headers']['cookie']).to.equal(undefined)
                req.reply({
                  statusCode: 200,
                })
              }).as('cookieCheck')

              cy.visit('/fixtures/primary-origin.html')
              cy.get(`a[data-cy="cookie-${scheme}"]`).click()

              // cookie jar should now mimic http://www.foobar.com:3500 / https://foobar.com:3502 as top
              cy.origin(originUrl, {
                args: {
                  scheme,
                  crossOriginPort,
                },
              }, ({ scheme, crossOriginPort }) => {
                cy.window().then((win) => {
                  return cy.wrap(window.makeRequest(win, `${scheme}://app.foobar.com:${crossOriginPort}/set-cookie-credentials?cookie=foo1=bar1; Domain=foobar.com`, 'fetch', 'omit'))
                })

                cy.window().then((win) => {
                  return cy.wrap(window.makeRequest(win, `${scheme}://app.foobar.com:${crossOriginPort}/test-request-credentials`, 'fetch', 'omit'))
                })

                cy.wait('@cookieCheck')
              })
            })
          })
        })

        describe('cross site / cross origin', () => {
          describe('XMLHttpRequest', () => {
            it('does NOT set or send cookies with request by default', () => {
              cy.intercept(`${scheme}://www.barbaz.com:${sameOriginPort}/test-request`, (req) => {
                expect(req['headers']['cookie']).to.equal(undefined)

                req.reply({
                  statusCode: 200,
                })
              }).as('cookieCheck')

              cy.visit('/fixtures/primary-origin.html')
              cy.get(`a[data-cy="cookie-${scheme}"]`).click()

              // cookie jar should now mimic http://www.foobar.com:3500 / https://foobar.com:3502 as top
              cy.origin(originUrl, {
                args: {
                  scheme,
                  sameOriginPort,
                },
              }, ({ scheme, sameOriginPort }) => {
                cy.window().then((win) => {
                  return cy.wrap(window.makeRequest(win, `${scheme}://www.barbaz.com:${sameOriginPort}/set-cookie?cookie=bar1=baz1; Domain=barbaz.com`, 'xmlHttpRequest'))
                })

                cy.window().then((win) => {
                  return cy.wrap(window.makeRequest(win, `${scheme}://www.barbaz.com:${sameOriginPort}/test-request`, 'xmlHttpRequest'))
                })

                cy.wait('@cookieCheck')
              })
            })

            // can only set third-party SameSite=None with Secure attribute, which is only possibly over https
            if (scheme === 'https') {
              it('does set cookie if withCredentials is true, but does not send cookie if withCredentials is false', () => {
                cy.intercept(`${scheme}://www.barbaz.com:${sameOriginPort}/test-request`, (req) => {
                  expect(req['headers']['cookie']).to.equal(undefined)

                  req.reply({
                    statusCode: 200,
                  })
                }).as('cookieCheck')

                cy.visit('/fixtures/primary-origin.html')
                cy.get(`a[data-cy="cookie-${scheme}"]`).click()

                // cookie jar should now mimic http://www.foobar.com:3500 / https://foobar.com:3502 as top
                cy.origin(originUrl, {
                  args: {
                    scheme,
                    sameOriginPort,
                  },
                }, ({ scheme, sameOriginPort }) => {
                  cy.window().then((win) => {
                    return cy.wrap(window.makeRequest(win, `${scheme}://www.barbaz.com:${sameOriginPort}/set-cookie-credentials?cookie=bar1=baz1; Domain=barbaz.com; SameSite=None; Secure`, 'xmlHttpRequest', true))
                  })

                  if (scheme === 'https') {
                    // assert cookie value is actually set in the browser, even if in a different domain
                    cy.getCookie('bar1', {
                      domain: 'barbaz.com',
                    }).its('value').should('equal', 'baz1')
                  } else {
                    cy.getCookie('bar1').should('equal', null)
                  }

                  cy.window().then((win) => {
                    return cy.wrap(window.makeRequest(win, `${scheme}://www.barbaz.com:${sameOriginPort}/test-request`, 'xmlHttpRequest'))
                  })

                  cy.wait('@cookieCheck')
                })
              })

              it('does set cookie if withCredentials is true, and sends cookie if withCredentials is true', () => {
                cy.intercept(`${scheme}://www.barbaz.com:${sameOriginPort}/test-request-credentials`, (req) => {
                  expect(req['headers']['cookie']).to.equal('bar1=baz1')

                  req.reply({
                    statusCode: 200,
                  })
                }).as('cookieCheck')

                cy.visit('/fixtures/primary-origin.html')
                cy.get(`a[data-cy="cookie-${scheme}"]`).click()

                // cookie jar should now mimic http://www.foobar.com:3500 / https://foobar.com:3502 as top
                cy.origin(originUrl, {
                  args: {
                    scheme,
                    sameOriginPort,
                  },
                }, ({ scheme, sameOriginPort }) => {
                  cy.window().then((win) => {
                    return cy.wrap(window.makeRequest(win, `${scheme}://www.barbaz.com:${sameOriginPort}/set-cookie-credentials?cookie=bar1=baz1; Domain=barbaz.com; SameSite=None; Secure`, 'xmlHttpRequest', true))
                  })

                  // assert cookie value is actually set in the browser, even if in a different domain
                  cy.getCookie('bar1', {
                    domain: 'barbaz.com',
                  }).its('value').should('equal', 'baz1')

                  cy.window().then((win) => {
                    return cy.wrap(window.makeRequest(win, `${scheme}://www.barbaz.com:${sameOriginPort}/test-request-credentials`, 'xmlHttpRequest', true))
                  })

                  cy.wait('@cookieCheck')
                })
              })
            }
          })

          describe('fetch', () => {
            ['same-origin', 'omit'].forEach((credentialOption) => {
              it(`does NOT set or send cookies with request if credentials is ${credentialOption}`, () => {
                cy.intercept(`${scheme}://www.barbaz.com:${sameOriginPort}/test-request`, (req) => {
                  expect(req['headers']['cookie']).to.equal(undefined)

                  req.reply({
                    statusCode: 200,
                  })
                }).as('cookieCheck')

                cy.visit('/fixtures/primary-origin.html')
                cy.get(`a[data-cy="cookie-${scheme}"]`).click()

                // cookie jar should now mimic http://www.foobar.com:3500 / https://foobar.com:3502 as top
                cy.origin(originUrl, {
                  args: {
                    scheme,
                    sameOriginPort,
                    credentialOption,
                  },
                }, ({ scheme, sameOriginPort, credentialOption }) => {
                  cy.window().then((win) => {
                    return cy.wrap(window.makeRequest(win, `${scheme}://www.barbaz.com:${sameOriginPort}/set-cookie?cookie=bar1=baz1; Domain=barbaz.com`, 'fetch', credentialOption as 'same-origin' | 'omit'))
                  })

                  cy.getCookie('bar1').should('equal', null)

                  cy.window().then((win) => {
                    return cy.wrap(window.makeRequest(win, `${scheme}://www.barbaz.com:${sameOriginPort}/test-request`, 'fetch', credentialOption as 'same-origin' | 'omit'))
                  })

                  cy.wait('@cookieCheck')
                })
              })

              it(`does set cookie if credentials is "include", but does not send cookie if credentials is ${credentialOption}`, () => {
                cy.intercept(`${scheme}://www.barbaz.com:${sameOriginPort}/test-request`, (req) => {
                  expect(req['headers']['cookie']).to.equal(undefined)

                  req.reply({
                    statusCode: 200,
                  })
                }).as('cookieCheck')

                cy.visit('/fixtures/primary-origin.html')
                cy.get(`a[data-cy="cookie-${scheme}"]`).click()

                // cookie jar should now mimic http://www.foobar.com:3500 / https://foobar.com:3502 as top
                cy.origin(originUrl, {
                  args: {
                    scheme,
                    sameOriginPort,
                    credentialOption,
                  },
                }, ({ scheme, sameOriginPort, credentialOption }) => {
                  cy.window().then((win) => {
                    return cy.wrap(window.makeRequest(win, `${scheme}://www.barbaz.com:${sameOriginPort}/set-cookie-credentials?cookie=bar1=baz1; Domain=barbaz.com; SameSite=None; Secure`, 'fetch', 'include'))
                  })

                  if (scheme === 'https') {
                    // assert cookie value is actually set in the browser, even if in a different domain
                    cy.getCookie('bar1', {
                      domain: 'barbaz.com',
                    }).its('value').should('equal', 'baz1')
                  } else {
                    cy.getCookie('bar1').should('equal', null)
                  }

                  cy.window().then((win) => {
                    return cy.wrap(window.makeRequest(win, `${scheme}://www.barbaz.com:${sameOriginPort}/test-request`, 'fetch', credentialOption as 'same-origin' | 'omit'))
                  })

                  cy.wait('@cookieCheck')
                })
              })
            })

            // can only set third-party SameSite=None with Secure attribute, which is only possibly over https
            if (scheme === 'https') {
              it('does set cookie if credentials is "include", and sends cookie if credentials is "include"', () => {
                cy.intercept(`${scheme}://www.barbaz.com:${sameOriginPort}/test-request-credentials`, (req) => {
                  expect(req['headers']['cookie']).to.equal('bar1=baz1')

                  req.reply({
                    statusCode: 200,
                  })
                }).as('cookieCheck')

                cy.visit('/fixtures/primary-origin.html')
                cy.get(`a[data-cy="cookie-${scheme}"]`).click()

                // cookie jar should now mimic http://www.foobar.com:3500 / https://foobar.com:3502 as top
                cy.origin(originUrl, {
                  args: {
                    scheme,
                    sameOriginPort,
                  },
                }, ({ scheme, sameOriginPort }) => {
                  cy.window().then((win) => {
                    return cy.wrap(window.makeRequest(win, `${scheme}://www.barbaz.com:${sameOriginPort}/set-cookie-credentials?cookie=bar1=baz1; Domain=barbaz.com; SameSite=None; Secure`, 'fetch', 'include'))
                  })

                  // assert cookie value is actually set in the browser, even if in a different domain
                  cy.getCookie('bar1', {
                    domain: 'barbaz.com',
                  }).its('value').should('equal', 'baz1')

                  cy.window().then((win) => {
                    return cy.wrap(window.makeRequest(win, `${scheme}://www.barbaz.com:${sameOriginPort}/test-request-credentials`, 'fetch', 'include'))
                  })

                  cy.wait('@cookieCheck')
                })
              })
            }
          })
        })

        describe('misc', () => {
          describe('domains', () => {
            it('attaches subdomain and TLD cookies when making subdomain requests', () => {
              cy.intercept(`${scheme}://app.foobar.com:${crossOriginPort}/test-request`, (req) => {
                expect(req['headers']['cookie']).to.equal('bar=baz; baz=quux')

                req.reply({
                  statusCode: 200,
                })
              }).as('cookieCheck')

              cy.visit('/fixtures/primary-origin.html')
              cy.get(`a[data-cy="cookie-${scheme}"]`).click()

              // cookie jar should now mimic http://www.foobar.com:3500 / https://foobar.com:3502 as top
              cy.origin(originUrl, {
                args: {
                  scheme,
                  crossOriginPort,
                },
              }, ({ scheme, crossOriginPort }) => {
                cy.window().then((win) => {
                  return cy.wrap(window.makeRequest(win, '/set-cookie?cookie=foo=bar; Domain=www.foobar.com', 'fetch', 'include'))
                })

                cy.window().then((win) => {
                  return cy.wrap(window.makeRequest(win, `${scheme}://app.foobar.com:${crossOriginPort}/set-cookie-credentials?cookie=bar=baz; Domain=.foobar.com`, 'fetch', 'include'))
                })

                // Cookie should not be sent with app.foobar.com:3500/test as it does NOT fit the domain
                cy.window().then((win) => {
                  return cy.wrap(window.makeRequest(win, `${scheme}://app.foobar.com:${crossOriginPort}/set-cookie-credentials?cookie=baz=quux; Domain=app.foobar.com`, 'fetch', 'include'))
                })

                cy.window().then((win) => {
                  return cy.wrap(window.makeRequest(win, `${scheme}://app.foobar.com:${crossOriginPort}/test-request`, 'fetch', 'include'))
                })

                cy.wait('@cookieCheck')
              })
            })

            it('attaches TLD cookies ONLY when making top level requests', () => {
              cy.intercept(`${scheme}://app.foobar.com:${sameOriginPort}/test-request-credentials`, (req) => {
                expect(req['headers']['cookie']).to.equal('bar=baz')

                req.reply({
                  statusCode: 200,
                })
              }).as('cookieCheck')

              cy.visit('/fixtures/primary-origin.html')
              cy.get(`a[data-cy="cookie-${scheme}"]`).click()

              // cookie jar should now mimic http://www.foobar.com:3500 / https://foobar.com:3502 as top
              cy.origin(originUrl, {
                args: {
                  scheme,
                  sameOriginPort,
                },
              }, ({ scheme, sameOriginPort }) => {
                cy.window().then((win) => {
                  return cy.wrap(window.makeRequest(win, '/set-cookie?cookie=foo=bar; Domain=www.foobar.com', 'fetch'))
                })

                cy.window().then((win) => {
                  return cy.wrap(window.makeRequest(win, `/set-cookie?cookie=bar=baz; Domain=.foobar.com`, 'fetch'))
                })

                cy.window().then((win) => {
                  return cy.wrap(window.makeRequest(win, `${scheme}://app.foobar.com:${sameOriginPort}/test-request-credentials`, 'fetch', 'include'))
                })

                cy.wait('@cookieCheck')
              })
            })
          })

          describe('paths', () => {
            it('gives specific path precedent over generic path, regardless of matching domain', () => {
              cy.intercept(`/test-request`, (req) => {
                // bar=baz should come BEFORE foo=bar
                expect(req['headers']['cookie']).to.equal('bar=baz; foo=bar')

                req.reply({
                  statusCode: 200,
                })
              }).as('cookieCheck')

              cy.visit('/fixtures/primary-origin.html')
              cy.get(`a[data-cy="cookie-${scheme}"]`).click()

              // cookie jar should now mimic http://www.foobar.com:3500 / https://foobar.com:3502 as top
              cy.origin(originUrl, () => {
                cy.window().then((win) => {
                  return cy.wrap(window.makeRequest(win, '/set-cookie?cookie=foo=bar; Domain=www.foobar.com; Path=/', 'fetch'))
                })

                cy.window().then((win) => {
                  return cy.wrap(window.makeRequest(win, `/set-cookie?cookie=bar=baz; Domain=.foobar.com; Path=/test-request`, 'fetch'))
                })

                cy.window().then((win) => {
                  return cy.wrap(window.makeRequest(win, `/test-request`, 'fetch'))
                })

                cy.wait('@cookieCheck')
              })
            })
          })

          describe('creation time', () => {
            it('places cookies created earlier BEFORE newly created cookies', () => {
              cy.intercept(`${scheme}://www.foobar.com:${sameOriginPort}/test-request`, (req) => {
                expect(req['headers']['cookie']).to.equal('foo=bar; bar=baz')

                req.reply({
                  statusCode: 200,
                })
              }).as('cookieCheck')

              cy.visit('/fixtures/primary-origin.html')
              cy.get(`a[data-cy="cookie-${scheme}"]`).click()

              // cookie jar should now mimic http://www.foobar.com:3500 / https://foobar.com:3502 as top
              cy.origin(originUrl, {
                args: {
                  scheme,
                  sameOriginPort,
                },
              }, ({ scheme, sameOriginPort }) => {
                cy.window().then((win) => {
                  return cy.wrap(window.makeRequest(win, `/set-cookie?cookie=foo=bar; Domain=www.foobar.com`, 'fetch'))
                })

                cy.wait(200)

                cy.window().then((win) => {
                  return cy.wrap(window.makeRequest(win, `/set-cookie?cookie=bar=baz; Domain=.foobar.com`, 'fetch'))
                })

                cy.window().then((win) => {
                  return cy.wrap(window.makeRequest(win, `${scheme}://www.foobar.com:${sameOriginPort}/test-request`, 'fetch', 'include'))
                })

                cy.wait('@cookieCheck')
              })
            })
          })
        })
      })

      // without cy.origin means the AUT has the same origin as top
      describe('w/o cy.origin', () => {
        describe('same site / same origin', () => {
          describe('XMLHttpRequest', () => {
            // withCredentials option should have no effect on same-site requests
            it('sets and attaches same-site cookies to request', () => {
              cy.intercept('/test-request', (req) => {
                expect(req['headers']['cookie']).to.equal('foo1=bar1')

                req.reply({
                  statusCode: 200,
                })
              }).as('cookieCheck')

              cy.visit(`${scheme}://www.foobar.com:${sameOriginPort}`)
              cy.window().then((win) => {
                return cy.wrap(makeRequest(win, '/set-cookie?cookie=foo1=bar1; Domain=foobar.com', 'xmlHttpRequest'))
              })

              cy.window().then((win) => {
                return cy.wrap(makeRequest(win, '/test-request', 'xmlHttpRequest'))
              })

              cy.wait('@cookieCheck')
            })
          })

          describe('fetch', () => {
            it('sets and attaches same-site cookies to request by default (same-origin)', () => {
              cy.intercept('/test-request', (req) => {
                expect(req['headers']['cookie']).to.equal('foo1=bar1')

                req.reply({
                  statusCode: 200,
                })
              }).as('cookieCheck')

              cy.visit(`${scheme}://www.foobar.com:${sameOriginPort}`)
              cy.window().then((win) => {
                return cy.wrap(makeRequest(win, '/set-cookie?cookie=foo1=bar1; Domain=foobar.com', 'fetch'))
              })

              cy.window().then((win) => {
                return cy.wrap(makeRequest(win, '/test-request', 'fetch'))
              })

              cy.wait('@cookieCheck')
            })

            // this test should behave exactly the same as the (same-origin) test, but adding here incase our implementation is not consistent
            it('sets and attaches same-site cookies to request if "include" credentials option is specified', () => {
              cy.intercept('/test-request', (req) => {
                expect(req['headers']['cookie']).to.equal('foo1=bar1')

                req.reply({
                  statusCode: 200,
                })
              }).as('cookieCheck')

              cy.visit(`${scheme}://www.foobar.com:${sameOriginPort}`)
              cy.window().then((win) => {
                return cy.wrap(makeRequest(win, '/set-cookie?cookie=foo1=bar1; Domain=foobar.com', 'fetch'))
              })

              cy.window().then((win) => {
                return cy.wrap(makeRequest(win, '/test-request', 'fetch'))
              })

              cy.wait('@cookieCheck')
            })

            it('does NOT attach same-site cookies to request if "omit" credentials option is specified', () => {
              cy.intercept('/test-request', (req) => {
                expect(req['headers']['cookie']).to.equal(undefined)

                req.reply({
                  statusCode: 200,
                })
              }).as('cookieCheck')

              cy.visit(`${scheme}://www.foobar.com:${sameOriginPort}`)
              cy.window().then((win) => {
                // set the cookie in the browser
                return cy.wrap(makeRequest(win, '/set-cookie?cookie=foo1=bar1; Domain=foobar.com', 'fetch'))
              })

              cy.window().then((win) => {
                // but omit the cookies in the request
                return cy.wrap(makeRequest(win, '/test-request', 'fetch', 'omit'))
              })

              cy.wait('@cookieCheck')
            })

            it('does NOT set same-site cookies from request if "omit" credentials option is specified', () => {
              cy.intercept('/test-request', (req) => {
                expect(req['headers']['cookie']).to.equal(undefined)

                req.reply({
                  statusCode: 200,
                })
              }).as('cookieCheck')

              cy.visit(`${scheme}://www.foobar.com:${sameOriginPort}`)
              cy.window().then((win) => {
                // do NOT set the cookie in the browser
                return cy.wrap(makeRequest(win, '/set-cookie?cookie=foo1=bar1; Domain=foobar.com', 'fetch', 'omit'))
              })

              cy.window().then((win) => {
                // but send the cookies in the request
                return cy.wrap(makeRequest(win, '/test-request', 'fetch'))
              })

              cy.wait('@cookieCheck')
            })
          })
        })

        describe('same site / cross origin', () => {
          describe('XMLHttpRequest', () => {
            it('does NOT set and attach same-site cookies to request when the request is cross-origin', () => {
              cy.intercept(`${scheme}://app.foobar.com:${crossOriginPort}/test-request`, (req) => {
                expect(req['headers']['cookie']).to.equal(undefined)

                req.reply({
                  statusCode: 200,
                })
              }).as('cookieCheck')

              cy.visit(`${scheme}://www.foobar.com:${sameOriginPort}`)
              cy.window().then((win) => {
                return cy.wrap(makeRequest(win, `${scheme}://app.foobar.com:${crossOriginPort}/set-cookie?cookie=foo1=bar1; Domain=foobar.com`, 'xmlHttpRequest'))
              })

              cy.window().then((win) => {
                return cy.wrap(makeRequest(win, `${scheme}://app.foobar.com:${crossOriginPort}/test-request`, 'xmlHttpRequest'))
              })

              cy.wait('@cookieCheck')
            })

            it('sets cookie on same-site request if withCredentials is true, but does not attach to same-site request if withCredentials is false', () => {
              cy.intercept(`${scheme}://app.foobar.com:${crossOriginPort}/test-request`, (req) => {
                expect(req['headers']['cookie']).to.equal(undefined)

                req.reply({
                  statusCode: 200,
                })
              }).as('cookieCheck')

              cy.visit(`${scheme}://www.foobar.com:${sameOriginPort}`)
              cy.window().then((win) => {
                // do NOT set the cookie in the browser
                return cy.wrap(makeRequest(win, `${scheme}://app.foobar.com:${crossOriginPort}/set-cookie-credentials?cookie=foo1=bar1; Domain=foobar.com`, 'xmlHttpRequest', true))
              })

              // firefox actually sets the cookie correctly
              cy.getCookie('foo1').its('value').should('equal', 'bar1')

              cy.window().then((win) => {
                // but send the cookies in the request
                return cy.wrap(makeRequest(win, `${scheme}://app.foobar.com:${crossOriginPort}/test-request`, 'xmlHttpRequest'))
              })

              cy.wait('@cookieCheck')
            })

            it('sets cookie on same-site request if withCredentials is true, and attaches to same-site request if withCredentials is true', () => {
              cy.intercept(`${scheme}://app.foobar.com:${crossOriginPort}/test-request-credentials`, (req) => {
                expect(req['headers']['cookie']).to.equal('foo1=bar1')

                req.reply({
                  statusCode: 200,
                })
              }).as('cookieCheck')

              cy.visit(`${scheme}://www.foobar.com:${sameOriginPort}`)
              cy.window().then((win) => {
                // do NOT set the cookie in the browser
                return cy.wrap(makeRequest(win, `${scheme}://app.foobar.com:${crossOriginPort}/set-cookie-credentials?cookie=foo1=bar1; Domain=foobar.com`, 'xmlHttpRequest', true))
              })

              cy.getCookie('foo1').its('value').should('equal', 'bar1')

              cy.window().then((win) => {
                // but send the cookies in the request
                return cy.wrap(makeRequest(win, `${scheme}://app.foobar.com:${crossOriginPort}/test-request-credentials`, 'xmlHttpRequest', true))
              })

              cy.wait('@cookieCheck')
            })
          })

          describe('fetch', () => {
            it('does not set same-site cookies from request nor send same-site cookies by default (same-origin)', () => {
              cy.intercept(`${scheme}://app.foobar.com:${crossOriginPort}/test-request-credentials`, (req) => {
                expect(req['headers']['cookie']).to.equal(undefined)

                req.reply({
                  statusCode: 200,
                })
              }).as('cookieCheck')

              cy.visit(`${scheme}://www.foobar.com:${sameOriginPort}`)
              cy.window().then((win) => {
                return cy.wrap(makeRequest(win, `${scheme}://app.foobar.com:${crossOriginPort}/set-cookie-credentials?cookie=foo1=bar1; Domain=foobar.com`, 'fetch'))
              })

              cy.window().then((win) => {
                return cy.wrap(makeRequest(win, `${scheme}://app.foobar.com:${crossOriginPort}/test-request-credentials`, 'fetch'))
              })

              cy.wait('@cookieCheck')
            })

            it('sets same-site cookies from request and sends same-site cookies if "include" credentials option is specified', () => {
              cy.intercept(`${scheme}://app.foobar.com:${crossOriginPort}/test-request-credentials`, (req) => {
                expect(req['headers']['cookie']).to.equal('foo1=bar1')

                req.reply({
                  statusCode: 200,
                })
              }).as('cookieCheck')

              cy.visit(`${scheme}://www.foobar.com:${sameOriginPort}`)
              cy.window().then((win) => {
                return cy.wrap(makeRequest(win, `${scheme}://app.foobar.com:${crossOriginPort}/set-cookie-credentials?cookie=foo1=bar1; Domain=foobar.com`, 'fetch', 'include'))
              })

              cy.getCookie('foo1').its('value').should('equal', 'bar1')

              cy.window().then((win) => {
                return cy.wrap(makeRequest(win, `${scheme}://app.foobar.com:${crossOriginPort}/test-request-credentials`, 'fetch', 'include'))
              })

              cy.wait('@cookieCheck')
            })

            it('sets same-site cookies if "include" credentials option is specified from request, but does not attach same-site cookies to request by default (same-origin)', () => {
              cy.intercept(`${scheme}://app.foobar.com:${crossOriginPort}/test-request-credentials`, (req) => {
                expect(req['headers']['cookie']).to.equal(undefined)

                req.reply({
                  statusCode: 200,
                })
              }).as('cookieCheck')

              cy.visit(`${scheme}://www.foobar.com:${sameOriginPort}`)
              cy.window().then((win) => {
                return cy.wrap(makeRequest(win, `${scheme}://app.foobar.com:${crossOriginPort}/set-cookie-credentials?cookie=foo1=bar1; Domain=foobar.com`, 'fetch', 'include'))
              })

              cy.getCookie('foo1').its('value').should('equal', 'bar1')

              cy.window().then((win) => {
                return cy.wrap(makeRequest(win, `${scheme}://app.foobar.com:${crossOriginPort}/test-request-credentials`, 'fetch'))
              })

              cy.wait('@cookieCheck')
            })

            // this should have the same effect as same-origin option for same-site/cross-origin requests, but adding here incase our implementation is not consistent
            it('does not set or send same-site cookies if "omit" credentials option is specified', () => {
              cy.intercept(`${scheme}://app.foobar.com:${crossOriginPort}/test-request-credentials`, (req) => {
                expect(req['headers']['cookie']).to.equal(undefined)

                req.reply({
                  statusCode: 200,
                })
              }).as('cookieCheck')

              cy.visit(`${scheme}://www.foobar.com:${sameOriginPort}`)
              cy.window().then((win) => {
                return cy.wrap(makeRequest(win, `${scheme}://app.foobar.com:${crossOriginPort}/set-cookie-credentials?cookie=foo1=bar1; Domain=foobar.com`, 'fetch', 'omit'))
              })

              cy.window().then((win) => {
                return cy.wrap(makeRequest(win, `${scheme}://app.foobar.com:${crossOriginPort}/test-request-credentials`, 'fetch', 'omit'))
              })

              cy.wait('@cookieCheck')
            })
          })
        })

        describe('cross site / cross origin', () => {
          describe('XMLHttpRequest', () => {
            it('does NOT set or send cookies with request by default', () => {
              cy.intercept(`${scheme}://www.barbaz.com:${sameOriginPort}/test-request`, (req) => {
                expect(req['headers']['cookie']).to.equal(undefined)

                req.reply({
                  statusCode: 200,
                })
              }).as('cookieCheck')

              cy.visit(`${scheme}://www.foobar.com:${sameOriginPort}`)
              cy.window().then((win) => {
                return cy.wrap(makeRequest(win, `${scheme}://www.barbaz.com:${sameOriginPort}/set-cookie?cookie=bar1=baz1; Domain=barbaz.com`, 'xmlHttpRequest'))
              })

              cy.window().then((win) => {
                return cy.wrap(makeRequest(win, `${scheme}://www.barbaz.com:${sameOriginPort}/test-request`, 'xmlHttpRequest'))
              })

              cy.wait('@cookieCheck')
            })

            // can only set third-party SameSite=None with Secure attribute, which is only possibly over https
            if (scheme === 'https') {
              it('does set cookie if withCredentials is true, but does not send cookie if withCredentials is false', () => {
                cy.intercept(`${scheme}://www.barbaz.com:${sameOriginPort}/test-request`, (req) => {
                  expect(req['headers']['cookie']).to.equal(undefined)

                  req.reply({
                    statusCode: 200,
                  })
                }).as('cookieCheck')

                cy.visit(`${scheme}://www.foobar.com:${sameOriginPort}`)
                cy.window().then((win) => {
                  return cy.wrap(makeRequest(win, `${scheme}://www.barbaz.com:${sameOriginPort}/set-cookie-credentials?cookie=bar1=baz1; Domain=barbaz.com; SameSite=None; Secure`, 'xmlHttpRequest', true))
                })

                // assert cookie value is actually set in the browser
                if (scheme === 'https') {
                  // FIXME: cy.getCookie does not believe this cookie exists, though it is set in the browser. Should be fixed in https://github.com/cypress-io/cypress/pull/23643.
                  cy.getCookie('bar1').should('equal', null)
                  // can only set third-party SameSite=None with Secure attribute, which is only possibly over https

                //expected future assertion
                // cy.getCookie('bar1').its('value').should('equal', 'baz1')
                } else {
                  cy.getCookie('bar1').should('equal', null)
                }

                cy.window().then((win) => {
                  return cy.wrap(makeRequest(win, `${scheme}://www.barbaz.com:${sameOriginPort}/test-request`, 'xmlHttpRequest'))
                })

                cy.wait('@cookieCheck')
              })

              it('does set cookie if withCredentials is true, and sends cookie if withCredentials is true', () => {
                cy.intercept(`${scheme}://www.barbaz.com:${sameOriginPort}/test-request-credentials`, (req) => {
                  expect(req['headers']['cookie']).to.equal('bar1=baz1')

                  req.reply({
                    statusCode: 200,
                  })
                }).as('cookieCheck')

                cy.visit(`${scheme}://www.foobar.com:${sameOriginPort}`)
                cy.window().then((win) => {
                  return cy.wrap(makeRequest(win, `${scheme}://www.barbaz.com:${sameOriginPort}/set-cookie-credentials?cookie=bar1=baz1; Domain=barbaz.com; SameSite=None; Secure`, 'xmlHttpRequest', true))
                })

                // FIXME: cy.getCookie does not believe this cookie exists, though it is set in the browser. Should be fixed in https://github.com/cypress-io/cypress/pull/23643
                cy.getCookie('bar1').should('equal', null)
                // can only set third-party SameSite=None with Secure attribute, which is only possibly over https

                //expected future assertion
                // cy.getCookie('bar1').its('value').should('equal', 'baz1')

                cy.window().then((win) => {
                  return cy.wrap(makeRequest(win, `${scheme}://www.barbaz.com:${sameOriginPort}/test-request-credentials`, 'xmlHttpRequest', true))
                })

                cy.wait('@cookieCheck')
              })
            }
          })

          describe('fetch', () => {
            ['same-origin', 'omit'].forEach((credentialOption) => {
              it(`does NOT set or send cookies with request by credentials is ${credentialOption}`, () => {
                cy.intercept(`${scheme}://www.barbaz.com:${sameOriginPort}/test-request`, (req) => {
                  expect(req['headers']['cookie']).to.equal(undefined)

                  req.reply({
                    statusCode: 200,
                  })
                }).as('cookieCheck')

                cy.visit(`${scheme}://www.foobar.com:${sameOriginPort}`)
                cy.window().then((win) => {
                  return cy.wrap(makeRequest(win, `${scheme}://www.barbaz.com:${sameOriginPort}/set-cookie?cookie=bar1=baz1; Domain=barbaz.com`, 'fetch', credentialOption as 'same-origin' | 'omit'))
                })

                cy.getCookie('bar1').should('equal', null)

                cy.window().then((win) => {
                  return cy.wrap(makeRequest(win, `${scheme}://www.barbaz.com:${sameOriginPort}/test-request`, 'fetch', credentialOption as 'same-origin' | 'omit'))
                })

                cy.wait('@cookieCheck')
              })

              it(`does set cookie if credentials is "include", but does not send cookie if credentials is ${credentialOption}`, () => {
                cy.intercept(`${scheme}://www.barbaz.com:${sameOriginPort}/test-request`, (req) => {
                  expect(req['headers']['cookie']).to.equal(undefined)

                  req.reply({
                    statusCode: 200,
                  })
                }).as('cookieCheck')

                cy.visit(`${scheme}://www.foobar.com:${sameOriginPort}`)
                cy.window().then((win) => {
                  return cy.wrap(makeRequest(win, `${scheme}://www.barbaz.com:${sameOriginPort}/set-cookie-credentials?cookie=bar1=baz1; Domain=barbaz.com; SameSite=None; Secure`, 'fetch', 'include'))
                })

                // assert cookie value is actually set in the browser
                if (scheme === 'https') {
                  // FIXME: cy.getCookie does not believe this cookie exists, though it is set in the browser. Should be fixed in https://github.com/cypress-io/cypress/pull/23643
                  cy.getCookie('bar1').should('equal', null)
                  // can only set third-party SameSite=None with Secure attribute, which is only possibly over https

                  //expected future assertion
                  // cy.getCookie('bar1').its('value').should('equal', 'baz1')
                } else {
                  cy.getCookie('bar1').should('equal', null)
                }

                cy.window().then((win) => {
                  return cy.wrap(makeRequest(win, `${scheme}://www.barbaz.com:${sameOriginPort}/test-request`, 'fetch', credentialOption as 'same-origin' | 'omit'))
                })

                cy.wait('@cookieCheck')
              })
            })

            // can only set third-party SameSite=None with Secure attribute, which is only possibly over https
            if (scheme === 'https') {
              it('does set cookie if credentials is "include", and sends cookie if credentials is "include"', () => {
                cy.intercept(`${scheme}://www.barbaz.com:${sameOriginPort}/test-request-credentials`, (req) => {
                  expect(req['headers']['cookie']).to.equal('bar1=baz1')

                  req.reply({
                    statusCode: 200,
                  })
                }).as('cookieCheck')

                cy.visit(`${scheme}://www.foobar.com:${sameOriginPort}`)
                cy.window().then((win) => {
                  return cy.wrap(makeRequest(win, `${scheme}://www.barbaz.com:${sameOriginPort}/set-cookie-credentials?cookie=bar1=baz1; Domain=barbaz.com; SameSite=None; Secure`, 'fetch', 'include'))
                })

                // assert cookie value is actually set in the browser

                // FIXME: cy.getCookie does not believe this cookie exists, though it is set in the browser. Should be fixed in https://github.com/cypress-io/cypress/pull/23643
                cy.getCookie('bar1').should('equal', null)
                // can only set third-party SameSite=None with Secure attribute, which is only possibly over https

                //expected future assertion
                // cy.getCookie('bar1').its('value').should('equal', 'baz1')

                cy.window().then((win) => {
                  return cy.wrap(makeRequest(win, `${scheme}://www.barbaz.com:${sameOriginPort}/test-request-credentials`, 'fetch', 'include'))
                })

                cy.wait('@cookieCheck')
              })
            }
          })
        })

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

            it('attaches TLD cookies ONLY when making top level requests', () => {
              cy.intercept(`${scheme}://www.foobar.com:${sameOriginPort}/test-request-credentials`, (req) => {
                expect(req['headers']['cookie']).to.equal('bar=baz')

                req.reply({
                  statusCode: 200,
                })
              }).as('cookieCheck')

              cy.visit(`${scheme}://app.foobar.com:${crossOriginPort}`)
              cy.window().then((win) => {
                return cy.wrap(makeRequest(win, '/set-cookie?cookie=foo=bar; Domain=app.foobar.com', 'fetch'))
              })

              cy.window().then((win) => {
                return cy.wrap(makeRequest(win, `/set-cookie?cookie=bar=baz; Domain=.foobar.com`, 'fetch'))
              })

              cy.window().then((win) => {
                return cy.wrap(makeRequest(win, `${scheme}://www.foobar.com:${sameOriginPort}/test-request-credentials`, 'fetch', 'include'))
              })

              cy.wait('@cookieCheck')
            })
          })

          describe('paths', () => {
            it('gives specific path precedent over generic path, regardless of matching domain', () => {
              cy.intercept(`/test-request`, (req) => {
                // bar=baz should come BEFORE foo=bar
                expect(req['headers']['cookie']).to.equal('bar=baz; foo=bar')

                req.reply({
                  statusCode: 200,
                })
              }).as('cookieCheck')

              cy.visit(`${scheme}://app.foobar.com:${crossOriginPort}`)
              cy.window().then((win) => {
                return cy.wrap(makeRequest(win, '/set-cookie?cookie=foo=bar; Domain=app.foobar.com; Path=/', 'fetch'))
              })

              cy.window().then((win) => {
                return cy.wrap(makeRequest(win, `/set-cookie?cookie=bar=baz; Domain=.foobar.com; Path=/test-request`, 'fetch'))
              })

              cy.window().then((win) => {
                return cy.wrap(makeRequest(win, `/test-request`, 'fetch'))
              })

              cy.wait('@cookieCheck')
            })
          })

          describe('creation time', () => {
            it('places cookies created earlier BEFORE newly created cookies', () => {
              cy.intercept(`${scheme}://www.foobar.com:${sameOriginPort}/test-request`, (req) => {
                7
                expect(req['headers']['cookie']).to.equal('foo=bar; bar=baz')

                req.reply({
                  statusCode: 200,
                })
              }).as('cookieCheck')

              cy.visit(`${scheme}://app.foobar.com:${crossOriginPort}`)

              cy.window().then((win) => {
                return cy.wrap(makeRequest(win, `/set-cookie?cookie=foo=bar; Domain=.foobar.com`, 'fetch'))
              })

              cy.wait(200)

              cy.window().then((win) => {
                return cy.wrap(makeRequest(win, `/set-cookie?cookie=bar=baz; Domain=.foobar.com`, 'fetch'))
              })

              cy.window().then((win) => {
                return cy.wrap(makeRequest(win, `${scheme}://www.foobar.com:${sameOriginPort}/test-request`, 'fetch', 'include'))
              })

              cy.wait('@cookieCheck')
            })
          })
        })
      })
    })
  })
})
