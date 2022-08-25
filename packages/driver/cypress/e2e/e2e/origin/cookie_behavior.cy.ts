describe('Cookie Behavior with experimentalSessionAndOrigin=true', () => {
  const makeRequest = (
    win: Cypress.AUTWindow,
    url: string,
    client: 'fetch' | 'xmlHttpRequest' = 'xmlHttpRequest',
    credentials: 'same-origin' | 'include' | 'omit' | boolean = false,
  ) => {
    if (client === 'fetch') {
      // if a boolean is specified, make sure the default is applied
      credentials = Cypress._.isBoolean(credentials) ? 'same-origin' : credentials

      return win.fetch(url, { credentials })
    }

    return new Promise<void>((resolve, reject) => {
      let xhr = new XMLHttpRequest()

      xhr.open('GET', url)
      xhr.withCredentials = Cypress._.isBoolean(credentials) ? credentials : false
      xhr.onload = function () {
        resolve(xhr.response)
      }

      xhr.onerror = function () {
        reject(xhr.response)
      }

      xhr.send()
    })
  }

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
    // FIXME: clearing cookies in the browser currently does not clear cookies in the server-side cookie jar
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

          // add httpClient here globally until Cypress.require PR is merged
          cy.origin(`${scheme}://www.foobar.com:${sameOriginPort}`, () => {
            const makeRequest = (
              win: Cypress.AUTWindow,
              url: string,
              client: 'fetch' | 'xmlHttpRequest' = 'xmlHttpRequest',
              credentials: 'same-origin' | 'include' | 'omit' | boolean = false,
            ) => {
              if (client === 'fetch') {
                // if a boolean is specified, make sure the default is applied
                credentials = Cypress._.isBoolean(credentials) ? 'same-origin' : credentials

                return win.fetch(url, { credentials })
              }

              return new Promise<void>((resolve, reject) => {
                let xhr = new XMLHttpRequest()

                xhr.open('GET', url)
                xhr.withCredentials = Cypress._.isBoolean(credentials) ? credentials : false
                xhr.onload = function () {
                  resolve(xhr.response)
                }

                xhr.onerror = function () {
                  reject(xhr.response)
                }

                xhr.send()
              })
            }

            // @ts-ignore
            window.makeRequest = makeRequest
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

              // cookie jar should now mimic http://foobar.com:3500 / https://foobar.com:3502 as top
              cy.origin(originUrl, {
                args: originUrl,
              }, (originUrl) => {
                cy.window().then((win) => {
                  return cy.wrap(makeRequest(win, `${originUrl}/set-cookie?cookie=foo1=bar1; Domain=foobar.com`, 'xmlHttpRequest'))
                })

                cy.window().then((win) => {
                  return cy.wrap(makeRequest(win, `${originUrl}/test-request`, 'xmlHttpRequest'))
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

              // cookie jar should now mimic http://foobar.com:3500 / https://foobar.com:3502 as top
              cy.origin(originUrl, () => {
                cy.window().then((win) => {
                  return cy.wrap(makeRequest(win, '/set-cookie?cookie=foo1=bar1; Domain=foobar.com', 'fetch'))
                })

                cy.window().then((win) => {
                  return cy.wrap(makeRequest(win, '/test-request', 'fetch'))
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

              // cookie jar should now mimic http://foobar.com:3500 / https://foobar.com:3502 as top
              cy.origin(originUrl, () => {
                cy.window().then((win) => {
                  return cy.wrap(makeRequest(win, '/set-cookie?cookie=foo1=bar1; Domain=foobar.com', 'fetch'))
                })

                cy.window().then((win) => {
                  return cy.wrap(makeRequest(win, '/test-request', 'fetch'))
                })

                cy.wait('@cookieCheck')
              })
            })

            // FIXME: @see https://github.com/cypress-io/cypress/issues/23551
            it('does NOT attach same-site cookies to request if "omit" credentials option is specified', () => {
              cy.intercept(`${originUrl}/test-request`, (req) => {
                // current expected assertion with server side cookie jar is set from previous test
                expect(req['headers']['cookie']).to.equal('foo1=bar1')

                // future expected assertion, regardless of server side cookie jar
                // expect(req['headers']['cookie']).to.equal('')
                req.reply({
                  statusCode: 200,
                })
              }).as('cookieCheck')

              cy.visit('/fixtures/primary-origin.html')
              cy.get(`a[data-cy="cookie-${scheme}"]`).click()

              // cookie jar should now mimic http://foobar.com:3500 / https://foobar.com:3502 as top
              cy.origin(originUrl, () => {
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
            })

            // FIXME: @see https://github.com/cypress-io/cypress/issues/23551
            it('does NOT set same-site cookies from request if "omit" credentials option is specified', () => {
              cy.intercept(`${originUrl}/test-request`, (req) => {
                // current expected assertion with server side cookie jar is set from previous test
                expect(req['headers']['cookie']).to.equal('foo1=bar1')

                // future expected assertion, regardless of server side cookie jar
                // expect(req['headers']['cookie']).to.equal('')
                req.reply({
                  statusCode: 200,
                })
              }).as('cookieCheck')

              cy.visit('/fixtures/primary-origin.html')
              cy.get(`a[data-cy="cookie-${scheme}"]`).click()

              // cookie jar should now mimic http://foobar.com:3500 / https://foobar.com:3502 as top
              cy.origin(originUrl, () => {
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
        })

        describe('same site / cross origin', () => {
          describe('XMLHttpRequest', () => {
            // withCredentials option should have no effect on same-site requests, even though the request is cross-origin
            it('sets and attaches same-site cookies to request, even though request is cross-origin', () => {
              cy.intercept(`${scheme}://app.foobar.com:${crossOriginPort}/test-request`, (req) => {
                expect(req['headers']['cookie']).to.equal('foo1=bar1')

                req.reply({
                  statusCode: 200,
                })
              }).as('cookieCheck')

              cy.visit('/fixtures/primary-origin.html')
              cy.get(`a[data-cy="cookie-${scheme}"]`).click()

              // cookie jar should now mimic http://foobar.com:3500 / https://foobar.com:3502 as top
              cy.origin(originUrl, {
                args: {
                  scheme,
                  crossOriginPort,
                },
              }, ({ scheme, crossOriginPort }) => {
                cy.window().then((win) => {
                  // do NOT set the cookie in the browser
                  return cy.wrap(makeRequest(win, `${scheme}://app.foobar.com:${crossOriginPort}/set-cookie?cookie=foo1=bar1; Domain=foobar.com`, 'xmlHttpRequest'))
                })

                cy.window().then((win) => {
                  // but send the cookies in the request
                  return cy.wrap(makeRequest(win, `${scheme}://app.foobar.com:${crossOriginPort}/test-request`, 'xmlHttpRequest'))
                })

                cy.wait('@cookieCheck')
              })
            })
          })

          describe('fetch', () => {
            // FIXME: @see https://github.com/cypress-io/cypress/issues/23551
            it('does not set same-site cookies from request nor send same-site cookies by default (same-origin)', () => {
              cy.intercept(`${scheme}://app.foobar.com:${crossOriginPort}/test-request-credentials`, (req) => {
                // current expected assertion
                expect(req['headers']['cookie']).to.equal('foo1=bar1')

                // future expected assertion
                // expect(req['headers']['cookie']).to.equal('')
                req.reply({
                  statusCode: 200,
                })
              }).as('cookieCheck')

              cy.visit('/fixtures/primary-origin.html')
              cy.get(`a[data-cy="cookie-${scheme}"]`).click()

              // cookie jar should now mimic http://foobar.com:3500 / https://foobar.com:3502 as top
              cy.origin(originUrl, {
                args: {
                  scheme,
                  crossOriginPort,
                },
              }, ({ scheme, crossOriginPort }) => {
                cy.window().then((win) => {
                  return cy.wrap(makeRequest(win, `${scheme}://app.foobar.com:${crossOriginPort}/set-cookie-credentials?cookie=foo1=bar1; Domain=foobar.com`, 'fetch'))
                })

                cy.window().then((win) => {
                  return cy.wrap(makeRequest(win, `${scheme}://app.foobar.com:${crossOriginPort}/test-request-credentials`, 'fetch'))
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

              // cookie jar should now mimic http://foobar.com:3500 / https://foobar.com:3502 as top
              cy.origin(originUrl, {
                args: {
                  scheme,
                  crossOriginPort,
                },
              }, ({ scheme, crossOriginPort }) => {
                cy.window().then((win) => {
                  return cy.wrap(makeRequest(win, `${scheme}://app.foobar.com:${crossOriginPort}/set-cookie-credentials?cookie=foo1=bar1; Domain=foobar.com`, 'fetch', 'include'))
                })

                // assert cookie value is actually set in the browser
                // current expected assertion
                cy.getCookie('foo1').its('value').should('equal', null)

                // FIXME: ideally, browser should have access to this cookie
                // future expected assertion
                // cy.getCookie('foo1').its('value').should('equal', 'bar1')

                cy.window().then((win) => {
                  return cy.wrap(makeRequest(win, `${scheme}://app.foobar.com:${crossOriginPort}/test-request-credentials`, 'fetch', 'include'))
                })
              })
            })

            // FIXME: @see https://github.com/cypress-io/cypress/issues/23551
            it('sets same-site cookies if "include" credentials option is specified from request, but does not attach same-site cookies to request by default (same-origin)', () => {
              cy.intercept(`${scheme}://app.foobar.com:${crossOriginPort}/test-request-credentials`, (req) => {
                // current expected assertion
                expect(req['headers']['cookie']).to.equal('foo1=bar1')

                // future expected assertion
                // expect(req['headers']['cookie']).to.equal('')
                req.reply({
                  statusCode: 200,
                })
              }).as('cookieCheck')

              cy.visit('/fixtures/primary-origin.html')
              cy.get(`a[data-cy="cookie-${scheme}"]`).click()

              // cookie jar should now mimic http://foobar.com:3500 / https://foobar.com:3502 as top
              cy.origin(originUrl, {
                args: {
                  scheme,
                  crossOriginPort,
                },
              }, ({ scheme, crossOriginPort }) => {
                cy.window().then((win) => {
                  return cy.wrap(makeRequest(win, `${scheme}://app.foobar.com:${crossOriginPort}/set-cookie-credentials?cookie=foo1=bar1; Domain=foobar.com`, 'fetch', 'include'))
                })

                // assert cookie value is actually set in the browser
                // current expected assertion
                cy.getCookie('foo1').its('value').should('equal', null)

                // FIXME: ideally, browser should have access to this cookie
                // future expected assertion
                // cy.getCookie('foo1').its('value').should('equal', 'bar1')

                cy.window().then((win) => {
                  return cy.wrap(makeRequest(win, `${scheme}://app.foobar.com:${crossOriginPort}/test-request-credentials`, 'fetch'))
                })

                cy.wait('@cookieCheck')
              })
            })

            // FIXME: @see https://github.com/cypress-io/cypress/issues/23551
            // this should have the same effect as same-origin option for same-site/cross-origin requests, but adding here incase our implementation is not consistent
            it('does not set or send same-site cookies if "omit" credentials option is specified', () => {
              cy.intercept(`${scheme}://app.foobar.com:${crossOriginPort}/test-request-credentials`, (req) => {
                // current expected assertion
                expect(req['headers']['cookie']).to.equal('foo1=bar1')

                // future expected assertion
                // expect(req['headers']['cookie']).to.equal('')
                req.reply({
                  statusCode: 200,
                })
              }).as('cookieCheck')

              cy.visit('/fixtures/primary-origin.html')
              cy.get(`a[data-cy="cookie-${scheme}"]`).click()

              // cookie jar should now mimic http://foobar.com:3500 / https://foobar.com:3502 as top
              cy.origin(originUrl, {
                args: {
                  scheme,
                  crossOriginPort,
                },
              }, ({ scheme, crossOriginPort }) => {
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
        })

        describe('cross site / cross origin', () => {
          describe('XMLHttpRequest', () => {
            it('does NOT set or send cookies with request by default', () => {
              cy.intercept(`${scheme}://www.barbaz.com:${sameOriginPort}/test-request`, (req) => {
                expect(req['headers']['cookie']).to.equal('')

                req.reply({
                  statusCode: 200,
                })
              }).as('cookieCheck')

              cy.visit('/fixtures/primary-origin.html')
              cy.get(`a[data-cy="cookie-${scheme}"]`).click()

              // cookie jar should now mimic http://foobar.com:3500 / https://foobar.com:3502 as top
              cy.origin(originUrl, {
                args: {
                  scheme,
                  sameOriginPort,
                },
              }, ({ scheme, sameOriginPort }) => {
                cy.window().then((win) => {
                  return cy.wrap(makeRequest(win, `${scheme}://www.barbaz.com:${sameOriginPort}/set-cookie?cookie=bar1=baz1; Domain=barbaz.com`, 'xmlHttpRequest'))
                })

                cy.window().then((win) => {
                  return cy.wrap(makeRequest(win, `${scheme}://www.barbaz.com:${sameOriginPort}/test-request`, 'xmlHttpRequest'))
                })

                cy.wait('@cookieCheck')
              })
            })

            // FIXME: remove X-Set-Cookie option
            // can only set third-party SameSite=None with Secure attribute, which is only possibly over https
            if (scheme === 'https') {
              // FIXME: @see https://github.com/cypress-io/cypress/issues/23551
              // FIXME: remove X-Set-Cookie option
              it('does set cookie if withCredentials is true, but does not send cookie if withCredentials is false', () => {
                cy.intercept(`${scheme}://www.barbaz.com:${sameOriginPort}/test-request`, (req) => {
                  // current expected assertion
                  expect(req['headers']['cookie']).to.equal('bar1=baz1')

                  // future expected assertion
                  // expect(req['headers']['cookie']).to.equal('')

                  req.reply({
                    statusCode: 200,
                  })
                }).as('cookieCheck')

                cy.visit('/fixtures/primary-origin.html')
                cy.get(`a[data-cy="cookie-${scheme}"]`).click()

                // cookie jar should now mimic http://foobar.com:3500 / https://foobar.com:3502 as top
                cy.origin(originUrl, {
                  args: {
                    scheme,
                    sameOriginPort,
                  },
                }, ({ scheme, sameOriginPort }) => {
                  cy.window().then((win) => {
                    return cy.wrap(makeRequest(win, `${scheme}://www.barbaz.com:${sameOriginPort}/set-cookie-credentials?cookie=bar1=baz1; Domain=barbaz.com; SameSite=None; Secure`, 'xmlHttpRequest', true))
                  })

                  // assert cookie value is actually set in the browser
                  if (scheme === 'https') {
                    // FIXME: cy.getCookie does not believe this cookie exists, though it is set in the browser
                    cy.getCookie('bar1').its('value').should('equal', null)
                    // can only set third-party SameSite=None with Secure attribute, which is only possibly over https

                    //expected future assertion
                    // cy.getCookie('bar1').its('value').should('equal', 'baz1')
                  } else {
                    cy.getCookie('bar1').its('value').should('equal', null)
                  }

                  cy.window().then((win) => {
                    return cy.wrap(makeRequest(win, `${scheme}://www.barbaz.com:${sameOriginPort}/test-request`, 'xmlHttpRequest'))
                  })

                  cy.wait('@cookieCheck')
                })
              })

              it('does set cookie if withCredentials is true, and sends cookie if withCredentials is true', () => {
                cy.intercept(`${scheme}://www.barbaz.com:${sameOriginPort}/test-credentials`, (req) => {
                  expect(req['headers']['cookie']).to.equal('bar1=baz1')

                  req.reply({
                    statusCode: 200,
                  })
                }).as('cookieCheck')

                cy.visit('/fixtures/primary-origin.html')
                cy.get(`a[data-cy="cookie-${scheme}"]`).click()

                // cookie jar should now mimic http://foobar.com:3500 / https://foobar.com:3502 as top
                cy.origin(originUrl, {
                  args: {
                    scheme,
                    sameOriginPort,
                  },
                }, ({ scheme, sameOriginPort }) => {
                  cy.window().then((win) => {
                    return cy.wrap(makeRequest(win, `${scheme}://www.barbaz.com:${sameOriginPort}/set-cookie-credentials?cookie=bar1=baz1; Domain=barbaz.com; SameSite=None; Secure`, 'xmlHttpRequest', true))
                  })

                  // FIXME: cy.getCookie does not believe this cookie exists, though it is set in the browser
                  cy.getCookie('bar1').its('value').should('equal', null)
                  // can only set third-party SameSite=None with Secure attribute, which is only possibly over https

                  //expected future assertion
                  // cy.getCookie('bar1').its('value').should('equal', 'baz1')

                  cy.window().then((win) => {
                    return cy.wrap(makeRequest(win, `${scheme}://www.barbaz.com:${sameOriginPort}/test-credentials`, 'xmlHttpRequest', true))
                  })

                  cy.wait('@cookieCheck')
                })
              })
            }
          })

          describe('fetch', () => {
            ['same-origin', 'omit'].forEach((credentialOption) => {
              it(`does NOT set or send cookies with request by credentials is ${credentialOption}`, () => {
                cy.intercept(`${scheme}://www.barbaz.com:${sameOriginPort}/test-request`, (req) => {
                  expect(req['headers']['cookie']).to.equal('')

                  req.reply({
                    statusCode: 200,
                  })
                }).as('cookieCheck')

                cy.visit('/fixtures/primary-origin.html')
                cy.get(`a[data-cy="cookie-${scheme}"]`).click()

                // cookie jar should now mimic http://foobar.com:3500 / https://foobar.com:3502 as top
                cy.origin(originUrl, {
                  args: {
                    scheme,
                    sameOriginPort,
                    credentialOption,
                  },
                }, ({ scheme, sameOriginPort, credentialOption }) => {
                  cy.window().then((win) => {
                    return cy.wrap(makeRequest(win, `${scheme}://www.barbaz.com:${sameOriginPort}/set-cookie?cookie=bar1=baz1; Domain=barbaz.com`, 'fetch', credentialOption as 'same-origin' | 'omit'))
                  })

                  cy.getCookie('bar1').its('value').should('equal', null)

                  cy.window().then((win) => {
                    return cy.wrap(makeRequest(win, `${scheme}://www.barbaz.com:${sameOriginPort}/test-request`, 'fetch', credentialOption as 'same-origin' | 'omit'))
                  })

                  cy.wait('@cookieCheck')
                })
              })

              // FIXME: @see https://github.com/cypress-io/cypress/issues/23551
              // FIXME: remove X-Set-Cookie option
              it(`does set cookie if credentials is "include", but does not send cookie if credentials is ${credentialOption}`, () => {
                cy.intercept(`${scheme}://www.barbaz.com:${sameOriginPort}/test-request`, (req) => {
                  // current expected assertion
                  if (scheme === 'https') {
                    expect(req['headers']['cookie']).to.equal('bar1=baz1')
                  } else {
                    expect(req['headers']['cookie']).to.equal('')
                  }

                  // future expected assertion for both http / https
                  // expect(req['headers']['cookie']).to.equal('')

                  req.reply({
                    statusCode: 200,
                  })
                }).as('cookieCheck')

                cy.visit('/fixtures/primary-origin.html')
                cy.get(`a[data-cy="cookie-${scheme}"]`).click()

                // cookie jar should now mimic http://foobar.com:3500 / https://foobar.com:3502 as top
                cy.origin(originUrl, {
                  args: {
                    scheme,
                    sameOriginPort,
                    credentialOption,
                  },
                }, ({ scheme, sameOriginPort, credentialOption }) => {
                  cy.window().then((win) => {
                    return cy.wrap(makeRequest(win, `${scheme}://www.barbaz.com:${sameOriginPort}/set-cookie-credentials?cookie=bar1=baz1; Domain=barbaz.com; SameSite=None; Secure`, 'fetch', 'include'))
                  })

                  // assert cookie value is actually set in the browser
                  if (scheme === 'https') {
                    // FIXME: cy.getCookie does not believe this cookie exists, though it is set in the browser
                    cy.getCookie('bar1').its('value').should('equal', null)
                    // can only set third-party SameSite=None with Secure attribute, which is only possibly over https

                    //expected future assertion
                    // cy.getCookie('bar1').its('value').should('equal', 'baz1')
                  } else {
                    cy.getCookie('bar1').its('value').should('equal', null)
                  }

                  cy.window().then((win) => {
                    return cy.wrap(makeRequest(win, `${scheme}://www.barbaz.com:${sameOriginPort}/test-request`, 'fetch', credentialOption as 'same-origin' | 'omit'))
                  })

                  cy.wait('@cookieCheck')
                })
              })
            })

            // FIXME: remove X-Set-Cookie option
            // can only set third-party SameSite=None with Secure attribute, which is only possibly over https
            if (scheme === 'https') {
              it('does set cookie if credentials is "include", and sends cookie if credentials is "include"', () => {
                cy.intercept(`${scheme}://www.barbaz.com:${sameOriginPort}/test-credentials`, (req) => {
                  expect(req['headers']['cookie']).to.equal('bar1=baz1')

                  req.reply({
                    statusCode: 200,
                  })
                }).as('cookieCheck')

                cy.visit('/fixtures/primary-origin.html')
                cy.get(`a[data-cy="cookie-${scheme}"]`).click()

                // cookie jar should now mimic http://foobar.com:3500 / https://foobar.com:3502 as top
                cy.origin(originUrl, {
                  args: {
                    scheme,
                    sameOriginPort,
                  },
                }, ({ scheme, sameOriginPort }) => {
                  cy.window().then((win) => {
                    return cy.wrap(makeRequest(win, `${scheme}://www.barbaz.com:${sameOriginPort}/set-cookie-credentials?cookie=bar1=baz1; Domain=barbaz.com; SameSite=None; Secure`, 'fetch', 'include'))
                  })

                  // assert cookie value is actually set in the browser

                  // FIXME: cy.getCookie does not believe this cookie exists, though it is set in the browser
                  cy.getCookie('bar1').its('value').should('equal', null)
                  // can only set third-party SameSite=None with Secure attribute, which is only possibly over https

                  //expected future assertion
                  // cy.getCookie('bar1').its('value').should('equal', 'baz1')

                  cy.window().then((win) => {
                    return cy.wrap(makeRequest(win, `${scheme}://www.barbaz.com:${sameOriginPort}/test-credentials`, 'fetch', 'include'))
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

              // cookie jar should now mimic http://foobar.com:3500 / https://foobar.com:3502 as top
              cy.origin(originUrl, {
                args: {
                  scheme,
                  crossOriginPort,
                },
              }, ({ scheme, crossOriginPort }) => {
                cy.window().then((win) => {
                  return cy.wrap(makeRequest(win, '/set-cookie?cookie=foo=bar; Domain=www.foobar.com', 'fetch', 'include'))
                })

                cy.window().then((win) => {
                  return cy.wrap(makeRequest(win, `${scheme}://app.foobar.com:${crossOriginPort}/set-cookie-credentials?cookie=bar=baz; Domain=.foobar.com`, 'fetch', 'include'))
                })

                // Cookie should not be sent with app.foobar.com:3500/test as it does NOT fit the domain
                cy.window().then((win) => {
                  return cy.wrap(makeRequest(win, `${scheme}://app.foobar.com:${crossOriginPort}/set-cookie-credentials?cookie=baz=quux; Domain=app.foobar.com`, 'fetch', 'include'))
                })

                cy.window().then((win) => {
                  return cy.wrap(makeRequest(win, `${scheme}://app.foobar.com:${crossOriginPort}/test-request`, 'fetch', 'include'))
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

              // cookie jar should now mimic http://foobar.com:3500 / https://foobar.com:3502 as top
              cy.origin(originUrl, {
                args: {
                  scheme,
                  sameOriginPort,
                },
              }, ({ scheme, sameOriginPort }) => {
                cy.window().then((win) => {
                  return cy.wrap(makeRequest(win, '/set-cookie?cookie=foo=bar; Domain=www.foobar.com', 'fetch'))
                })

                cy.window().then((win) => {
                  return cy.wrap(makeRequest(win, `/set-cookie?cookie=bar=baz; Domain=.foobar.com`, 'fetch'))
                })

                cy.window().then((win) => {
                  return cy.wrap(makeRequest(win, `${scheme}://app.foobar.com:${sameOriginPort}/test-request-credentials`, 'fetch', 'include'))
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

              // cookie jar should now mimic http://foobar.com:3500 / https://foobar.com:3502 as top
              cy.origin(originUrl, () => {
                cy.window().then((win) => {
                  return cy.wrap(makeRequest(win, '/set-cookie?cookie=foo=bar; Domain=www.foobar.com; Path=/', 'fetch'))
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

              // cookie jar should now mimic http://foobar.com:3500 / https://foobar.com:3502 as top
              cy.origin(originUrl, {
                args: {
                  scheme,
                  sameOriginPort,
                },
              }, ({ scheme, sameOriginPort }) => {
                cy.window().then((win) => {
                  return cy.wrap(makeRequest(win, `/set-cookie?cookie=foo=bar; Domain=www.foobar.com`, 'fetch'))
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

      // without cy.origin means the AUT has the same origin as top
      // TODO: In the future, this test should be run with the experimentalSessionAndOrigin=true and experimentalSessionAndOrigin=false
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

            // FIXME: @see https://github.com/cypress-io/cypress/issues/23551
            it('does NOT attach same-site cookies to request if "omit" credentials option is specified', () => {
              cy.intercept('/test-request', (req) => {
                // current expected assertion with server side cookie jar is set from previous test
                expect(req['headers']['cookie']).to.equal('foo1=bar1')

                // future expected assertion, regardless of server side cookie jar
                // expect(req['headers']['cookie']).to.equal('')
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

            // FIXME: @see https://github.com/cypress-io/cypress/issues/23551
            it('does NOT set same-site cookies from request if "omit" credentials option is specified', () => {
              cy.intercept('/test-request', (req) => {
                // current expected assertion with server side cookie jar is set from previous test
                expect(req['headers']['cookie']).to.equal('foo1=bar1')

                // future expected assertion, regardless of server side cookie jar
                // expect(req['headers']['cookie']).to.equal('')
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
            // withCredentials option should have no effect on same-site requests, even though the request is cross-origin
            it('sets and attaches same-site cookies to request, even though request is cross-origin', () => {
              cy.intercept(`${scheme}://app.foobar.com:${crossOriginPort}/test-request`, (req) => {
                expect(req['headers']['cookie']).to.equal('foo1=bar1')

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
          })

          describe('fetch', () => {
            // FIXME: @see https://github.com/cypress-io/cypress/issues/23551
            it('does not set same-site cookies from request nor send same-site cookies by default (same-origin)', () => {
              cy.intercept(`${scheme}://app.foobar.com:${crossOriginPort}/test-request-credentials`, (req) => {
                // current expected assertion
                expect(req['headers']['cookie']).to.equal('foo1=bar1')

                // future expected assertion
                // expect(req['headers']['cookie']).to.equal('')
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

              // assert cookie value is actually set in the browser
              cy.getCookie('foo1').its('value').should('equal', 'bar1')

              cy.window().then((win) => {
                return cy.wrap(makeRequest(win, `${scheme}://app.foobar.com:${crossOriginPort}/test-request-credentials`, 'fetch', 'include'))
              })

              cy.wait('@cookieCheck')
            })

            // FIXME: @see https://github.com/cypress-io/cypress/issues/23551
            it('sets same-site cookies if "include" credentials option is specified from request, but does not attach same-site cookies to request by default (same-origin)', () => {
              cy.intercept(`${scheme}://app.foobar.com:${crossOriginPort}/test-request-credentials`, (req) => {
                // current expected assertion
                expect(req['headers']['cookie']).to.equal('foo1=bar1')

                // future expected assertion
                // expect(req['headers']['cookie']).to.equal('')
                req.reply({
                  statusCode: 200,
                })
              }).as('cookieCheck')

              cy.visit(`${scheme}://www.foobar.com:${sameOriginPort}`)
              cy.window().then((win) => {
                return cy.wrap(makeRequest(win, `${scheme}://app.foobar.com:${crossOriginPort}/set-cookie-credentials?cookie=foo1=bar1; Domain=foobar.com`, 'fetch', 'include'))
              })

              // assert cookie value is actually set in the browser
              cy.getCookie('foo1').its('value').should('equal', 'bar1')

              cy.window().then((win) => {
                return cy.wrap(makeRequest(win, `${scheme}://app.foobar.com:${crossOriginPort}/test-request-credentials`, 'fetch'))
              })

              cy.wait('@cookieCheck')
            })

            // FIXME: @see https://github.com/cypress-io/cypress/issues/23551
            // this should have the same effect as same-origin option for same-site/cross-origin requests, but adding here incase our implementation is not consistent
            it('does not set or send same-site cookies if "omit" credentials option is specified', () => {
              cy.intercept(`${scheme}://app.foobar.com:${crossOriginPort}/test-request-credentials`, (req) => {
                // current expected assertion
                expect(req['headers']['cookie']).to.equal('foo1=bar1')

                // future expected assertion
                // expect(req['headers']['cookie']).to.equal('')
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
                expect(req['headers']['cookie']).to.equal('')

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

            // FIXME: remove X-Set-Cookie option
            // can only set third-party SameSite=None with Secure attribute, which is only possibly over https
            if (scheme === 'https') {
              // FIXME: @see https://github.com/cypress-io/cypress/issues/23551
              it('does set cookie if withCredentials is true, but does not send cookie if withCredentials is false', () => {
                cy.intercept(`${scheme}://www.barbaz.com:${sameOriginPort}/test-request`, (req) => {
                // current expected assertion
                  expect(req['headers']['cookie']).to.equal('bar1=baz1')

                  // future expected assertion
                  // expect(req['headers']['cookie']).to.equal('')

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
                // FIXME: cy.getCookie does not believe this cookie exists, though it is set in the browser
                  cy.getCookie('bar1').its('value').should('equal', null)
                  // can only set third-party SameSite=None with Secure attribute, which is only possibly over https

                //expected future assertion
                // cy.getCookie('bar1').its('value').should('equal', 'baz1')
                } else {
                  cy.getCookie('bar1').its('value').should('equal', null)
                }

                cy.window().then((win) => {
                  return cy.wrap(makeRequest(win, `${scheme}://www.barbaz.com:${sameOriginPort}/test-request`, 'xmlHttpRequest'))
                })

                cy.wait('@cookieCheck')
              })

              it('does set cookie if withCredentials is true, and sends cookie if withCredentials is true', () => {
                cy.intercept(`${scheme}://www.barbaz.com:${sameOriginPort}/test-credentials`, (req) => {
                  expect(req['headers']['cookie']).to.equal('bar1=baz1')

                  req.reply({
                    statusCode: 200,
                  })
                }).as('cookieCheck')

                cy.visit(`${scheme}://www.foobar.com:${sameOriginPort}`)
                cy.window().then((win) => {
                  return cy.wrap(makeRequest(win, `${scheme}://www.barbaz.com:${sameOriginPort}/set-cookie-credentials?cookie=bar1=baz1; Domain=barbaz.com; SameSite=None; Secure`, 'xmlHttpRequest', true))
                })

                // FIXME: cy.getCookie does not believe this cookie exists, though it is set in the browser
                cy.getCookie('bar1').its('value').should('equal', null)
                // can only set third-party SameSite=None with Secure attribute, which is only possibly over https

                //expected future assertion
                // cy.getCookie('bar1').its('value').should('equal', 'baz1')

                cy.window().then((win) => {
                  return cy.wrap(makeRequest(win, `${scheme}://www.barbaz.com:${sameOriginPort}/test-credentials`, 'xmlHttpRequest', true))
                })

                cy.wait('@cookieCheck')
              })
            }
          })

          describe('fetch', () => {
            ['same-origin', 'omit'].forEach((credentialOption) => {
              it(`does NOT set or send cookies with request by credentials is ${credentialOption}`, () => {
                cy.intercept(`${scheme}://www.barbaz.com:${sameOriginPort}/test-request`, (req) => {
                  expect(req['headers']['cookie']).to.equal('')

                  req.reply({
                    statusCode: 200,
                  })
                }).as('cookieCheck')

                cy.visit(`${scheme}://www.foobar.com:${sameOriginPort}`)
                cy.window().then((win) => {
                  return cy.wrap(makeRequest(win, `${scheme}://www.barbaz.com:${sameOriginPort}/set-cookie?cookie=bar1=baz1; Domain=barbaz.com`, 'fetch', credentialOption as 'same-origin' | 'omit'))
                })

                cy.getCookie('bar1').its('value').should('equal', null)

                cy.window().then((win) => {
                  return cy.wrap(makeRequest(win, `${scheme}://www.barbaz.com:${sameOriginPort}/test-request`, 'fetch', credentialOption as 'same-origin' | 'omit'))
                })

                cy.wait('@cookieCheck')
              })

              // FIXME: @see https://github.com/cypress-io/cypress/issues/23551
              // FIXME: remove X-Set-Cookie option
              it(`does set cookie if credentials is "include", but does not send cookie if credentials is ${credentialOption}`, () => {
                cy.intercept(`${scheme}://www.barbaz.com:${sameOriginPort}/test-request`, (req) => {
                  // current expected assertion
                  if (scheme === 'https') {
                    expect(req['headers']['cookie']).to.equal('bar1=baz1')
                  } else {
                    expect(req['headers']['cookie']).to.equal('')
                  }

                  // future expected assertion for both http / https
                  // expect(req['headers']['cookie']).to.equal('')

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
                  // FIXME: cy.getCookie does not believe this cookie exists, though it is set in the browser
                  cy.getCookie('bar1').its('value').should('equal', null)
                  // can only set third-party SameSite=None with Secure attribute, which is only possibly over https

                  //expected future assertion
                  // cy.getCookie('bar1').its('value').should('equal', 'baz1')
                } else {
                  cy.getCookie('bar1').its('value').should('equal', null)
                }

                cy.window().then((win) => {
                  return cy.wrap(makeRequest(win, `${scheme}://www.barbaz.com:${sameOriginPort}/test-request`, 'fetch', credentialOption as 'same-origin' | 'omit'))
                })

                cy.wait('@cookieCheck')
              })
            })

            // FIXME: remove X-Set-Cookie option
            // can only set third-party SameSite=None with Secure attribute, which is only possibly over https
            if (scheme === 'https') {
              it('does set cookie if credentials is "include", and sends cookie if credentials is "include"', () => {
                cy.intercept(`${scheme}://www.barbaz.com:${sameOriginPort}/test-credentials`, (req) => {
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

                // FIXME: cy.getCookie does not believe this cookie exists, though it is set in the browser
                cy.getCookie('bar1').its('value').should('equal', null)
                // can only set third-party SameSite=None with Secure attribute, which is only possibly over https

                //expected future assertion
                // cy.getCookie('bar1').its('value').should('equal', 'baz1')

                cy.window().then((win) => {
                  return cy.wrap(makeRequest(win, `${scheme}://www.barbaz.com:${sameOriginPort}/test-credentials`, 'fetch', 'include'))
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
