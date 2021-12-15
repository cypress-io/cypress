// @ts-ignore / session support is needed for visiting about:blank between tests
describe('multidomain', { experimentalSessionSupport: true }, () => {
  const expectTextMessage = (expected, done) => {
    const onMessage = (event) => {
      if (event.data && event.data.actual !== undefined) {
        expect(event.data.host).to.equal('foobar.com')
        expect(event.data.actual).to.equal(expected)

        top!.removeEventListener('message', onMessage)

        done()
      }
    }

    top!.addEventListener('message', onMessage, false)
  }

  beforeEach(() => {
    cy.visit('/fixtures/multidomain.html')
    // @ts-ignore
    cy.get('a').click()
  })

  it('runs commands in secondary domain', () => {
    // @ts-ignore
    cy.switchToDomain('foobar.com', () => {
      cy
      .get('[data-cy="dom-check"]')
      .invoke('text')
      .should('equal', 'From a secondary domain')
    })

    cy.log('after switchToDomain')
  })

  it('sets up window.Cypress in secondary domain', () => {
    // @ts-ignore
    cy.switchToDomain('foobar.com', () => {
      cy
      .get('[data-cy="cypress-check"]')
      .invoke('text')
      .should('equal', 'Has window.Cypress')
    })
  })

  describe('window events', () => {
    it('form:submitted', (done) => {
      expectTextMessage('form:submitted', done)

      // @ts-ignore
      cy.switchToDomain('foobar.com', () => {
        Cypress.once('form:submitted', () => {
          top!.postMessage({ host: location.host, actual: 'form:submitted' }, '*')
        })

        cy.get('form').submit()
      })
    })

    // FIXME: reloading the page is problematic because the proxy delays the
    // request, but the driver currently waits for a switchToDomain, which
    // has already been called and won't be called again. need to handle any
    // sort of page reloading in the AUT when it's cross-domain
    it.skip('window:before:unload', (done) => {
      expectTextMessage('window:before:unload', done)

      // @ts-ignore
      cy.switchToDomain('foobar.com', () => {
        Cypress.once('window:before:unload', () => {
          top!.postMessage({ host: location.host, actual: 'window:before:unload' }, '*')
        })

        cy.window().then((window) => {
          window.location.href = '/fixtures/multidomain.html'
        })
      })
    })

    // FIXME: currently causes tests to hang. need to implement proper
    // stability-handling on secondary domains
    it.skip('window:unload', (done) => {
      expectTextMessage('window:unload', done)

      // @ts-ignore
      cy.switchToDomain('foobar.com', () => {
        Cypress.once('window:unload', () => {
          top!.postMessage({ host: location.host, actual: 'window:unload' }, '*')
        })

        cy.window().then((window) => {
          window.location.href = '/fixtures/multidomain.html'
        })
      })
    })

    it('navigation:changed', (done) => {
      expectTextMessage('navigation:changed', done)

      // @ts-ignore
      cy.switchToDomain('foobar.com', () => {
        Cypress.once('navigation:changed', () => {
          top!.postMessage({ host: location.host, actual: 'navigation:changed' }, '*')
        })

        cy.window().then((window) => {
          window.location.hash = '#hashbrowns'
        })
      })
    })

    it('window:alert', (done) => {
      expectTextMessage('window:alert the alert text', done)

      // @ts-ignore
      cy.switchToDomain('foobar.com', () => {
        Cypress.once('window:alert', (text) => {
          top!.postMessage({ host: location.host, actual: `window:alert ${text}` }, '*')
        })

        cy.get('[data-cy="alert"]').then(($el) => {
          $el.trigger('click')
        })
      })
    })

    it('window:confirm', (done) => {
      expectTextMessage('window:confirm the confirm text', done)

      // @ts-ignore
      cy.switchToDomain('foobar.com', () => {
        Cypress.once('window:confirm', (text) => {
          top!.postMessage({ host: location.host, actual: `window:confirm ${text}` }, '*')
        })

        cy.get('[data-cy="confirm"]').then(($el) => {
          $el.trigger('click')
        })
      })
    })

    it('window:confirmed - true when no window:confirm listeners return false', (done) => {
      expectTextMessage('window:confirmed the confirm text - true', done)

      // @ts-ignore
      cy.switchToDomain('foobar.com', () => {
        Cypress.once('window:confirmed', (text, returnedFalse) => {
          top!.postMessage({ host: location.host, actual: `window:confirmed ${text} - ${returnedFalse}` }, '*')
        })

        Cypress.on('window:confirm', () => {})
        Cypress.on('window:confirm', () => {
          return true
        })

        // @ts-ignore
        cy.get('[data-cy="confirm"]').then(($el) => {
          $el.trigger('click')
        })
      })
    })

    it('window:confirmed - false when any window:confirm listeners return false', (done) => {
      expectTextMessage('window:confirmed the confirm text - false', done)

      // @ts-ignore
      cy.switchToDomain('foobar.com', () => {
        Cypress.once('window:confirmed', (text, returnedFalse) => {
          top!.postMessage({ host: location.host, actual: `window:confirmed ${text} - ${returnedFalse}` }, '*')
        })

        Cypress.on('window:confirm', () => {
          return false
        })

        Cypress.on('window:confirm', () => {})

        // @ts-ignore
        cy.get('[data-cy="confirm"]').then(($el) => {
          $el.trigger('click')
        })
      })
    })
  })
})
