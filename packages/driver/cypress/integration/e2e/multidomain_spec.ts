describe('multidomain', () => {
  const expectTextMessage = (expected, done) => {
    const onMessage = (event) => {
      if (event.data && event.data.actual !== undefined) {
        expect(event.data.host).to.equal('127.0.0.1:3501')
        expect(event.data.actual).to.equal(expected)

        top.removeEventListener('message', onMessage)

        done()
      }
    }

    top.addEventListener('message', onMessage, false)
  }

  beforeEach(() => {
    cy.visit('/fixtures/multidomain.html')
    // @ts-ignore
    cy.anticipateMultidomain()
    cy.get('a').click()
  })

  it('runs synchronous commands in secondary domain', (done) => {
    expectTextMessage('From a secondary domain', done)

    // @ts-ignore
    cy.switchToDomain('127.0.0.1:3501', () => {
      // @ts-ignore
      cy.now('get', '[data-cy="dom-check"]').then(($el) => {
        top.postMessage({ host: location.host, actual: $el.text() }, '*')
      })
    })
  })

  it('sets up window.Cypress in secondary domain', (done) => {
    expectTextMessage('Has window.Cypress', done)

    // @ts-ignore
    cy.switchToDomain('127.0.0.1:3501', () => {
      // @ts-ignore
      cy.now('get', '[data-cy="cypress-check"]').then(($el) => {
        top.postMessage({ host: location.host, actual: $el.text() }, '*')
      })
    })
  })

  describe('window events', () => {
    it('form:submitted', (done) => {
      expectTextMessage('form:submitted', done)

      // @ts-ignore
      cy.switchToDomain('127.0.0.1:3501', () => {
        Cypress.on('form:submitted', () => {
          top.postMessage({ host: location.host, actual: 'form:submitted' }, '*')
        })

        // @ts-ignore
        cy.now('get', 'button[type=submit]').then(($el) => {
          $el.trigger('click')
        })
      })
    })

    it('window:before:unload', (done) => {
      expectTextMessage('window:before:unload', done)

      // @ts-ignore
      cy.switchToDomain('127.0.0.1:3501', () => {
        Cypress.on('window:before:unload', () => {
          top.postMessage({ host: location.host, actual: 'window:before:unload' }, '*')
        })

        // @ts-ignore
        cy.now('window').then((window) => {
          window.location.href = '/fixtures/multidomain.html'
        })
      })
    })

    it('window:unload', (done) => {
      expectTextMessage('window:unload', done)

      // @ts-ignore
      cy.switchToDomain('127.0.0.1:3501', () => {
        Cypress.on('window:unload', () => {
          top.postMessage({ host: location.host, actual: 'window:unload' }, '*')
        })

        // @ts-ignore
        cy.now('window').then((window) => {
          window.location.href = '/fixtures/multidomain.html'
        })
      })
    })

    it('navigation:changed', (done) => {
      expectTextMessage('navigation:changed', done)

      // @ts-ignore
      cy.switchToDomain('127.0.0.1:3501', () => {
        Cypress.on('navigation:changed', () => {
          top.postMessage({ host: location.host, actual: 'navigation:changed' }, '*')
        })

        // @ts-ignore
        cy.now('window').then((window) => {
          window.location.hash = '#hashbrowns'
        })
      })
    })

    it('window:alert', (done) => {
      expectTextMessage('window:alert the alert text', done)

      // @ts-ignore
      cy.switchToDomain('127.0.0.1:3501', () => {
        Cypress.on('window:alert', (text) => {
          top.postMessage({ host: location.host, actual: `window:alert ${text}` }, '*')
        })

        // @ts-ignore
        cy.now('get', '[data-cy="alert"]').then(($el) => {
          $el.trigger('click')
        })
      })
    })

    it('window:confirm', (done) => {
      expectTextMessage('window:confirm the confirm text', done)

      // @ts-ignore
      cy.switchToDomain('127.0.0.1:3501', () => {
        Cypress.on('window:confirm', (text) => {
          top.postMessage({ host: location.host, actual: `window:confirm ${text}` }, '*')
        })

        // @ts-ignore
        cy.now('get', '[data-cy="confirm"]').then(($el) => {
          $el.trigger('click')
        })
      })
    })

    it('window:confirmed - true when no window:confirm listeners return false', (done) => {
      expectTextMessage('window:confirmed the confirm text - true', done)

      // @ts-ignore
      cy.switchToDomain('127.0.0.1:3501', () => {
        Cypress.on('window:confirmed', (text, returnedFalse) => {
          top.postMessage({ host: location.host, actual: `window:confirmed ${text} - ${returnedFalse}` }, '*')
        })

        Cypress.on('window:confirm', () => {})
        Cypress.on('window:confirm', () => {
          return true
        })

        // @ts-ignore
        cy.now('get', '[data-cy="confirm"]').then(($el) => {
          $el.trigger('click')
        })
      })
    })

    it('window:confirmed - false when any window:confirm listeners return false', (done) => {
      expectTextMessage('window:confirmed the confirm text - false', done)

      // @ts-ignore
      cy.switchToDomain('127.0.0.1:3501', () => {
        Cypress.on('window:confirmed', (text, returnedFalse) => {
          top.postMessage({ host: location.host, actual: `window:confirmed ${text} - ${returnedFalse}` }, '*')
        })

        Cypress.on('window:confirm', () => {
          return false
        })

        Cypress.on('window:confirm', () => {})

        // @ts-ignore
        cy.now('get', '[data-cy="confirm"]').then(($el) => {
          $el.trigger('click')
        })
      })
    })
  })
})
