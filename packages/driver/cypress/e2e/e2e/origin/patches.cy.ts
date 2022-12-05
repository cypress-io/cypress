// Stubbing increases the time taken to make a backend request call, so we increase the default command timeout to avoid flake.
describe('src/cross-origin/patches', { browser: '!webkit', defaultCommandTimeout: 10000 }, () => {
  context('submit', () => {
    beforeEach(() => {
      cy.visit('/fixtures/primary-origin.html')
      cy.get('a[data-cy="cross-origin-secondary-link"]').click()
    })

    it('correctly submits a form when the target is _top for HTMLFormElement', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy.get('form').then(($form) => {
          expect($form.attr('target')).to.equal('_top')
          $form[0].submit()
        })

        cy.contains('Some generic content')
      })
    })
  })

  context('setAttribute', () => {
    beforeEach(() => {
      cy.visit('/fixtures/primary-origin.html')
      cy.get('a[data-cy="cross-origin-secondary-link"]').click()
    })

    it('renames integrity to cypress-stripped-integrity for HTMLScriptElement', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy.window().then((win: Window) => {
          const script = win.document.createElement('script')

          script.setAttribute('integrity', 'sha-123')
          expect(script.getAttribute('integrity')).to.be.null
          expect(script.getAttribute('cypress-stripped-integrity')).to.equal('sha-123')
        })
      })
    })

    it('renames integrity to cypress-stripped-integrity for HTMLLinkElement', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy.window().then((win: Window) => {
          const script = win.document.createElement('link')

          script.setAttribute('integrity', 'sha-123')
          expect(script.getAttribute('integrity')).to.be.null
          expect(script.getAttribute('cypress-stripped-integrity')).to.equal('sha-123')
        })
      })
    })

    it('doesn\'t rename integrity for other elements', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy.get('button[data-cy="alert"]').then(($button) => {
          $button.attr('integrity', 'sha-123')
          expect($button.attr('integrity')).to.equal('sha-123')
          expect($button.attr('cypress-stripped-integrity')).to.be.undefined
        })
      })
    })
  })

  context('fetch', () => {
    describe('from the AUT', () => {
      beforeEach(() => {
        cy.intercept('/test-request').as('testRequest')
        cy.stub(Cypress, 'backend').callThrough()

        cy.visit('/fixtures/primary-origin.html')
        cy.get('a[data-cy="xhr-fetch-requests"]').click()
      })

      describe('patches fetch in the AUT when going cross origin and sends credential status to server socket', () => {
        [undefined, 'same-origin', 'omit', 'include'].forEach((credentialOption) => {
          describe(`for credential option ${credentialOption || 'default'}`, () => {
            const postfixedSelector = !credentialOption || credentialOption === 'same-origin' ? '' : `-${credentialOption}`
            const assertCredentialStatus = credentialOption || 'same-origin'

            it('with a url string', () => {
              cy.origin('http://www.foobar.com:3500', {
                args: {
                  postfixedSelector,
                },
              },
              ({ postfixedSelector }) => {
                cy.get(`[data-cy="trigger-fetch${postfixedSelector}"]`).click()
              })

              cy.wait('@testRequest')
              cy.then(() => {
                expect(Cypress.backend).to.have.been.calledWith('request:sent:with:credentials', {
                  url: 'http://www.foobar.com:3500/test-request',
                  resourceType: 'fetch',
                  credentialStatus: assertCredentialStatus,
                })
              })
            })

            it('with a request object', () => {
              cy.origin('http://www.foobar.com:3500', {
                args: {
                  postfixedSelector,
                },
              },
              ({ postfixedSelector }) => {
                cy.get(`[data-cy="trigger-fetch-with-request-object${postfixedSelector}"]`).click()
              })

              cy.wait('@testRequest')
              cy.then(() => {
                expect(Cypress.backend).to.have.been.calledWith('request:sent:with:credentials', {
                  url: 'http://www.foobar.com:3500/test-request',
                  resourceType: 'fetch',
                  credentialStatus: assertCredentialStatus,
                })
              })
            })

            it('with a url object', () => {
              cy.origin('http://www.foobar.com:3500', {
                args: {
                  postfixedSelector,
                },
              },
              ({ postfixedSelector }) => {
                cy.get(`[data-cy="trigger-fetch-with-url-object${postfixedSelector}"]`).click()
              })

              cy.wait('@testRequest')
              cy.then(() => {
                expect(Cypress.backend).to.have.been.calledWith('request:sent:with:credentials', {
                  url: 'http://www.foobar.com:3500/test-request',
                  resourceType: 'fetch',
                  credentialStatus: assertCredentialStatus,
                })
              })
            })
          })
        })

        it('fails gracefully if fetch is called with Bad arguments and we don\'t single to the socket (must match the fetch api spec), but fetch request still proceeds', () => {
          cy.origin(
            'http://www.foobar.com:3500',
            () => {
              cy.on('uncaught:exception', (err) => {
                expect(err.message).to.contain('404')

                return false
              })

              cy.get(`[data-cy="trigger-fetch-with-bad-options"]`).click()
            },
          )

          cy.then(() => {
            expect(Cypress.backend).not.to.have.been.calledWithMatch('request:sent:with:credentials')
          })
        })

        it('works as expected with requests that require preflight that ultimately fail and the request does not succeed', () => {
          cy.origin(
            'http://www.foobar.com:3500',
            () => {
              cy.on('uncaught:exception', (err) => {
                expect(err.message).to.contain('CORS ERROR')

                return false
              })

              cy.get(`[data-cy="trigger-fetch-with-preflight"]`).click()
            },
          )

          cy.then(() => {
            expect(Cypress.backend).to.have.been.calledWith('request:sent:with:credentials', {
              url: 'http://app.foobar.com:3500/test-request',
              resourceType: 'fetch',
              credentialStatus: 'include',
            })
          })
        })
      })
    })

    describe('from the spec bridge', () => {
      beforeEach(() => {
        cy.intercept('/test-request').as('testRequest')
        cy.stub(Cypress, 'backend').callThrough()

        cy.visit('/fixtures/primary-origin.html')
        cy.get('a[data-cy="xhr-fetch-requests"]').click()
      })

      describe('patches fetch in the AUT when going cross origin and sends credential status to server socket', () => {
        [undefined, 'same-origin', 'omit', 'include'].forEach((credentialOption) => {
          const assertCredentialStatus = credentialOption || 'same-origin'

          // NOTE: Even if the request fails, this should be popped off the queue in the proxy and not be an issue moving forward.
          // only thing we should be concerned with is urls that go over the socket but somehow do NOT make a request.
          // This MIGHT be an issue for preflight requests failing if the browser fails the request and the request doesn't actually make it through the proxy
          describe(`for credential option ${credentialOption || 'default'}`, () => {
            it('with a url string', () => {
              cy.origin('http://www.foobar.com:3500', {
                args: {
                  credentialOption,
                },
              }, ({ credentialOption }) => {
                cy.then(() => {
                  if (credentialOption) {
                    return fetch('http://www.foobar.com:3500/test-request-credentials', {
                      credentials: credentialOption as RequestCredentials,
                    })
                  }

                  return fetch('http://www.foobar.com:3500/test-request-credentials')
                })
              })

              cy.then(() => {
                expect(Cypress.backend).to.have.been.calledWith('request:sent:with:credentials', {
                  url: 'http://www.foobar.com:3500/test-request-credentials',
                  resourceType: 'fetch',
                  credentialStatus: assertCredentialStatus,
                })
              })
            })

            it('with a request object', () => {
              cy.origin('http://www.foobar.com:3500', {
                args: {
                  credentialOption,
                },
              }, ({ credentialOption }) => {
                cy.then(() => {
                  let req

                  if (credentialOption) {
                    req = new Request('http://www.foobar.com:3500/test-request-credentials', {
                      credentials: credentialOption as RequestCredentials,
                    })
                  } else {
                    req = new Request('http://www.foobar.com:3500/test-request-credentials')
                  }

                  return fetch(req)
                })
              })

              cy.then(() => {
                expect(Cypress.backend).to.have.been.calledWith('request:sent:with:credentials', {
                  url: 'http://www.foobar.com:3500/test-request-credentials',
                  resourceType: 'fetch',
                  credentialStatus: assertCredentialStatus,
                })
              })
            })

            it('with a url object', () => {
              cy.origin('http://www.foobar.com:3500', {
                args: {
                  credentialOption,
                },
              }, ({ credentialOption }) => {
                cy.then(() => {
                  let urlObj = new URL('/test-request-credentials', 'http://www.foobar.com:3500')

                  if (credentialOption) {
                    return fetch(urlObj, {
                      credentials: credentialOption as RequestCredentials,
                    })
                  }

                  return fetch(urlObj)
                })
              })

              cy.then(() => {
                expect(Cypress.backend).to.have.been.calledWith('request:sent:with:credentials', {
                  url: 'http://www.foobar.com:3500/test-request-credentials',
                  resourceType: 'fetch',
                  credentialStatus: assertCredentialStatus,
                })
              })
            })
          })
        })

        it('fails gracefully if fetch is called with Bad arguments and we don\'t single to the socket (must match the fetch api spec), but fetch request still proceeds', () => {
          cy.origin('http://www.foobar.com:3500',
            () => {
              cy.on('uncaught:exception', (err) => {
                expect(err.message).to.contain('404')

                return false
              })

              cy.get(`[data-cy="trigger-fetch-with-bad-options"]`).click()
            })

          cy.then(() => {
            expect(Cypress.backend).not.to.have.been.calledWithMatch('request:sent:with:credentials')
          })
        })
      })

      it('works as expected with requests that require preflight that ultimately fail and the request does not succeed', () => {
        cy.origin('http://www.foobar.com:3500',
          () => {
            cy.then(() => {
              let url = new URL('/test-request', 'http://app.foobar.com:3500').toString()

              return new Promise<void>((resolve, reject) => {
                fetch(url, {
                  credentials: 'include',
                  headers: {
                    'foo': 'bar',
                  },
                }).catch(() => {
                  resolve()
                }).then(() => {
                  // if this fetch does not fail, fail the test
                  reject()
                })
              })
            })
          })

        cy.then(() => {
          expect(Cypress.backend).to.have.been.calledWith('request:sent:with:credentials', {
            url: 'http://app.foobar.com:3500/test-request',
            resourceType: 'fetch',
            credentialStatus: 'include',
          })
        })
      })
    })

    it('patches prior to attaching to a spec bridge', () => {
      // manually remove the spec bridge iframe to ensure Cypress.state('window') is not already set
      window.top?.document.getElementById('Spec\ Bridge:\ foobar.com')?.remove()

      cy.stub(Cypress, 'backend').callThrough()

      cy.visit('/fixtures/primary-origin.html')
      cy.get('a[data-cy="xhr-fetch-requests-onload"]').click()

      cy.then(() => {
        expect(Cypress.backend).to.have.been.calledWith('request:sent:with:credentials', {
          url: 'http://localhost:3500/foo.bar.baz.json',
          resourceType: 'fetch',
          credentialStatus: 'same-origin',
        })
      })
    })

    it('does not patch fetch in the spec window or the AUT if the AUT is on the primary', () => {
      cy.stub(Cypress, 'backend').callThrough()
      cy.visit('fixtures/xhr-fetch-requests.html')

      cy.window().then((win) => {
        win.location.href = 'http://www.foobar.com:3500/fixtures/secondary-origin.html'
      })

      cy.origin('http://www.foobar.com:3500', () => {
        cy.window().then((win) => {
          win.location.href = 'http://localhost:3500/fixtures/xhr-fetch-requests.html'
        })
      })

      // expect spec to NOT be patched in primary
      cy.then(async () => {
        await fetch('/test-request')

        expect(Cypress.backend).not.to.have.been.calledWithMatch('request:sent:with:credentials')
      })

      // expect AUT to NOT be patched in primary
      cy.window().then(async (win) => {
        await win.fetch('/test-request')

        expect(Cypress.backend).not.to.have.been.calledWithMatch('request:sent:with:credentials')
      })
    })
  })

  context('xmlHttpRequest', () => {
    describe('from the AUT', () => {
      beforeEach(() => {
        cy.intercept('/test-request').as('testRequest')
        cy.stub(Cypress, 'backend').callThrough()

        cy.visit('/fixtures/primary-origin.html')
        cy.get('a[data-cy="xhr-fetch-requests"]').click()
      })

      describe('patches xmlHttpRequest in the AUT when going cross origin and sends credential status to server socket', () => {
        [false, true].forEach((withCredentials) => {
          it(`for withCredentials option ${withCredentials}`, () => {
            const postfixedSelector = withCredentials ? '-with-credentials' : ''

            cy.origin('http://www.foobar.com:3500', {
              args: {
                postfixedSelector,
              },
            },
            ({ postfixedSelector = false }) => {
              cy.get(`[data-cy="trigger-xml-http-request${postfixedSelector}"]`).click()
            })

            cy.wait('@testRequest')
            cy.then(() => {
              expect(Cypress.backend).to.have.been.calledWith('request:sent:with:credentials', {
                url: 'http://www.foobar.com:3500/test-request',
                resourceType: 'xhr',
                credentialStatus: withCredentials,
              })
            })
          })
        })

        it('still emits credential status in the case absolute url can be parsed even though request results in 404', () => {
          cy.origin('http://www.foobar.com:3500',
            () => {
              cy.on('uncaught:exception', (err) => {
                expect(err.message).to.contain('404')

                return false
              })

              cy.get(`[data-cy="trigger-xml-http-request-with-bad-options"]`).click()
            })

          cy.then(() => {
            expect(Cypress.backend).to.have.been.calledWithMatch('request:sent:with:credentials')
          })
        })
      })

      it('works as expected with requests that require preflight that ultimately fail and the request does not succeed', () => {
        cy.origin('http://www.foobar.com:3500',
          () => {
            cy.on('uncaught:exception', (err) => {
              expect(err.message).to.contain('CORS ERROR')

              return false
            })

            cy.get(`[data-cy="trigger-xml-http-request-with-preflight"]`).click()
          })

        cy.then(() => {
          expect(Cypress.backend).to.have.been.calledWith('request:sent:with:credentials', {
            url: 'http://app.foobar.com:3500/test-request',
            resourceType: 'xhr',
            credentialStatus: true,
          })
        })
      })
    })

    describe('from the spec bridge', () => {
      beforeEach(() => {
        cy.intercept('/test-request').as('testRequest')
        cy.stub(Cypress, 'backend').callThrough()
        cy.origin('http://www.foobar.com:3500', () => {
          cy.stub(Cypress, 'backend').callThrough()
        })

        cy.visit('/fixtures/primary-origin.html')
        cy.get('a[data-cy="xhr-fetch-requests"]').click()
      })

      describe('patches xmlHttpRequest in the spec bridge', () => {
        [false, true].forEach((withCredentials) => {
          it(`for withCredentials option ${withCredentials}`, () => {
            cy.origin('http://www.foobar.com:3500', {
              args: {
                withCredentials,
              },
            },
            ({ withCredentials = false }) => {
              cy.then(() => {
                let url = new URL('/test-request-credentials', 'http://www.foobar.com:3500').toString()

                return new Promise<void>((resolve, reject) => {
                  let xhr = new XMLHttpRequest()

                  xhr.open('GET', url)
                  xhr.withCredentials = withCredentials
                  xhr.onload = function () {
                    resolve(xhr.response)
                  }

                  xhr.onerror = function () {
                    reject(xhr.response)
                  }

                  xhr.send()
                })
              })
            })

            cy.then(() => {
              expect(Cypress.backend).to.have.been.calledWith('request:sent:with:credentials', {
                url: 'http://www.foobar.com:3500/test-request-credentials',
                resourceType: 'xhr',
                credentialStatus: withCredentials,
              })
            })
          })
        })

        it('still emits credential status in the case absolute url can be parsed even though request results in 404', () => {
          cy.origin('http://www.foobar.com:3500',
            () => {
              cy.on('uncaught:exception', (err) => {
                expect(err.message).to.contain('404')

                return false
              })

              cy.get(`[data-cy="trigger-xml-http-request-with-bad-options"]`).click()
            })

          cy.then(() => {
            expect(Cypress.backend).to.have.been.calledWithMatch('request:sent:with:credentials')
          })
        })

        it('works as expected with requests that require preflight that ultimately fail and the request does not succeed', () => {
          cy.origin('http://www.foobar.com:3500',
            () => {
              cy.then(() => {
                let url = new URL('/test-request', 'http://app.foobar.com:3500').toString()

                return new Promise<void>((resolve, reject) => {
                  let xhr = new XMLHttpRequest()

                  xhr.open('GET', url)
                  xhr.withCredentials = true
                  xhr.onload = function () {
                    // if this request passes, fail the test
                    reject(xhr.response)
                  }

                  xhr.onerror = function () {
                    resolve()
                  }

                  xhr.send()
                })
              })
            })

          cy.then(() => {
            expect(Cypress.backend).to.have.been.calledWith('request:sent:with:credentials', {
              url: 'http://app.foobar.com:3500/test-request',
              resourceType: 'xhr',
              credentialStatus: true,
            })
          })
        })
      })
    })

    it('patches prior to attaching to a spec bridge', () => {
      // manually remove the spec bridge iframe to ensure Cypress.state('window') is not already set
      window.top?.document.getElementById('Spec\ Bridge:\ foobar.com')?.remove()

      cy.stub(Cypress, 'backend').callThrough()

      cy.visit('/fixtures/primary-origin.html')
      cy.get('a[data-cy="xhr-fetch-requests-onload"]').click()

      cy.then(() => {
        expect(Cypress.backend).to.have.been.calledWith('request:sent:with:credentials', {
          url: 'http://localhost:3500/foo.bar.baz.json',
          resourceType: 'xhr',
          credentialStatus: false,
        })
      })
    })

    it('does not patch xmlHttpRequest in the spec window or the AUT if the AUT is on the primary', () => {
      cy.stub(Cypress, 'backend').callThrough()
      cy.visit('fixtures/xhr-fetch-requests.html')

      cy.window().then((win) => {
        win.location.href = 'http://www.foobar.com:3500/fixtures/secondary-origin.html'
      })

      cy.origin('http://www.foobar.com:3500', () => {
        cy.window().then((win) => {
          win.location.href = 'http://localhost:3500/fixtures/xhr-fetch-requests.html'
        })
      })

      // expect spec to NOT be patched in primary
      cy.then(async () => {
        let url = new URL('/test-request-credentials', 'http://www.foobar.com:3500').toString()

        await new Promise<void>((resolve, reject) => {
          let xhr = new XMLHttpRequest()

          xhr.open('GET', url)
          xhr.onload = function () {
            resolve(xhr.response)
          }

          xhr.onerror = function () {
            reject(xhr.response)
          }

          xhr.send()
        })

        expect(Cypress.backend).not.to.have.been.calledWithMatch('request:sent:with:credentials')
      })

      // expect AUT to NOT be patched in primary
      cy.window().then(async (win) => {
        let url = new URL('/test-request-credentials', 'http://www.foobar.com:3500').toString()

        await new Promise<void>((resolve, reject) => {
          let xhr = new win.XMLHttpRequest()

          xhr.open('GET', url)
          xhr.onload = function () {
            resolve(xhr.response)
          }

          xhr.onerror = function () {
            reject(xhr.response)
          }

          xhr.send()
        })

        expect(Cypress.backend).not.to.have.been.calledWithMatch('request:sent:with:credentials')
      })
    })
  })
})
