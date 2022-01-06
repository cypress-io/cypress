// @ts-ignore / session support is needed for visiting about:blank between tests
describe('multi-domain', { experimentalSessionSupport: true, experimentalMultiDomain: true }, () => {
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
    cy.visit('/fixtures/multi-domain.html')
    cy.get('a').click()
  })

  it('runs commands in secondary domain', () => {
    cy.switchToDomain('foobar.com', () => {
      cy
      .get('[data-cy="dom-check"]')
      .invoke('text')
      .should('equal', 'From a secondary domain')
    })

    cy.log('after switchToDomain')
  })

  it('sets up window.Cypress in secondary domain', () => {
    cy.switchToDomain('foobar.com', () => {
      cy
      .get('[data-cy="cypress-check"]')
      .invoke('text')
      .should('equal', 'Has window.Cypress')
    })
  })

  describe('data argument', () => {
    it('passes object to callback function', () => {
      cy.switchToDomain('foobar.com', { foo: 'foo', bar: 'bar' }, ({ foo, bar }) => {
        expect(foo).to.equal('foo')
        expect(bar).to.equal('bar')
      })
    })

    it('passes array to callback function', () => {
      cy.switchToDomain('foobar.com', ['foo', 'bar'], ([foo, bar]) => {
        expect(foo).to.equal('foo')
        expect(bar).to.equal('bar')
      })
    })

    it('passes string to callback function', () => {
      cy.switchToDomain('foobar.com', 'foo', (foo) => {
        expect(foo).to.equal('foo')
      })
    })

    it('passes number to callback function', () => {
      cy.switchToDomain('foobar.com', 1, (num) => {
        expect(num).to.equal(1)
      })
    })

    it('passes boolean to callback function', () => {
      cy.switchToDomain('foobar.com', true, (bool) => {
        expect(bool).to.be.true
      })
    })

    describe('errors', () => {
      it('errors if experimental flag is not enabled', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.equal('`cy.switchToDomain()` requires enabling the experimentalMultiDomain flag')

          // @ts-ignore
          Cypress.config('experimentalMultiDomain', true)

          done()
        })

        // @ts-ignore
        Cypress.config('experimentalMultiDomain', false)

        // @ts-ignore
        cy.switchToDomain()
      })

      it('errors if passed a non-string for the domain argument', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.equal('`cy.switchToDomain()` requires the first argument to be a string. You passed: ``')

          done()
        })

        // @ts-ignore
        cy.switchToDomain()
      })

      it('errors if passed a non-serializable data value', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('data argument specified is not serializable')

          if (Cypress.browser.family === 'chromium') {
            expect(err.message).to.include('Failed to execute \'postMessage\'')
          } else if (Cypress.browser.family === 'firefox') {
            expect(err.message).to.include('The object could not be cloned')
          }

          done()
        })

        cy.switchToDomain('foobar.com', () => {}, (bool) => {
          expect(bool).to.be.true
        })
      })

      it('errors if last argument is absent', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.equal('`cy.switchToDomain()` requires the last argument to be a function. You passed: ``')

          done()
        })

        // @ts-ignore
        cy.switchToDomain('foobar.com')
      })

      it('errors if last argument is not a function', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.equal('`cy.switchToDomain()` requires the last argument to be a function. You passed: `{}`')

          done()
        })

        // @ts-ignore
        cy.switchToDomain('foobar.com', {})
      })
    })
  })

  describe('window events', () => {
    it('form:submitted', (done) => {
      expectTextMessage('form:submitted', done)

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

      cy.switchToDomain('foobar.com', () => {
        Cypress.once('window:before:unload', () => {
          top!.postMessage({ host: location.host, actual: 'window:before:unload' }, '*')
        })

        cy.window().then((window) => {
          window.location.href = '/fixtures/multi-domain.html'
        })
      })
    })

    // FIXME: currently causes tests to hang. need to implement proper
    // stability-handling on secondary domains
    it.skip('window:unload', (done) => {
      expectTextMessage('window:unload', done)

      cy.switchToDomain('foobar.com', () => {
        Cypress.once('window:unload', () => {
          top!.postMessage({ host: location.host, actual: 'window:unload' }, '*')
        })

        cy.window().then((window) => {
          window.location.href = '/fixtures/multi-domain.html'
        })
      })
    })

    it('navigation:changed', (done) => {
      expectTextMessage('navigation:changed', done)

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

      cy.switchToDomain('foobar.com', () => {
        Cypress.once('window:confirmed', (text, returnedFalse) => {
          top!.postMessage({ host: location.host, actual: `window:confirmed ${text} - ${returnedFalse}` }, '*')
        })

        Cypress.on('window:confirm', () => {})
        Cypress.on('window:confirm', () => {
          return true
        })

        cy.get('[data-cy="confirm"]').then(($el) => {
          $el.trigger('click')
        })
      })
    })

    it('window:confirmed - false when any window:confirm listeners return false', (done) => {
      expectTextMessage('window:confirmed the confirm text - false', done)

      cy.switchToDomain('foobar.com', () => {
        Cypress.once('window:confirmed', (text, returnedFalse) => {
          top!.postMessage({ host: location.host, actual: `window:confirmed ${text} - ${returnedFalse}` }, '*')
        })

        Cypress.on('window:confirm', () => {
          return false
        })

        Cypress.on('window:confirm', () => {})

        cy.get('[data-cy="confirm"]').then(($el) => {
          $el.trigger('click')
        })
      })
    })
  })
})
