// @ts-ignore / session support is needed for visiting about:blank between tests
describe('multidomain', { experimentalSessionSupport: true }, () => {
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
      // @ts-ignore
      cy.switchToDomain('foobar.com', () => {
        const $form = cy.$$('form')

        Cypress.once('form:submitted', (e) => {
          expect(e.target).to.eq($form.get(0))
          done()
        })

        cy.get('form').submit()
      })
    })

    // FIXME: reloading the page is problematic because the proxy delays the
    // request, but the driver currently waits for a switchToDomain, which
    // has already been called and won't be called again. need to handle any
    // sort of page reloading in the AUT when it's cross-domain
    it.skip('window:before:unload', (done) => {
      // @ts-ignore
      cy.switchToDomain('foobar.com', () => {
        Cypress.once('window:before:unload', () => {
          expect(location.host).to.equal('foobar.com')
          done()
        })

        cy.window().then((window) => {
          window.location.href = '/fixtures/multidomain.html'
        })
      })
    })

    // FIXME: currently causes tests to hang. need to implement proper
    // stability-handling on secondary domains
    it.skip('window:unload', (done) => {
      // @ts-ignore
      cy.switchToDomain('foobar.com', () => {
        Cypress.once('window:unload', () => {
          expect(location.host).to.equal('foobar.com')
          done()
        })

        cy.window().then((window) => {
          window.location.href = '/fixtures/multidomain.html'
        })
      })
    })

    it('navigation:changed', (done) => {
      // @ts-ignore
      cy.switchToDomain('foobar.com', () => {
        Cypress.once('navigation:changed', () => {
          expect(location.host).to.equal('foobar.com')
          done()
        })

        cy.window().then((window) => {
          window.location.hash = '#hashbrowns'
        })
      })
    })

    it('window:alert', (done) => {
      // @ts-ignore
      cy.switchToDomain('foobar.com', () => {
        Cypress.once('window:alert', (text) => {
          expect(location.host).to.equal('foobar.com')
          expect(`window:alert ${text}`).to.equal('window:alert the alert text')
          done()
        })

        cy.get('[data-cy="alert"]').then(($el) => {
          $el.trigger('click')
        })
      })
    })

    it('window:confirm', (done) => {
      // @ts-ignore
      cy.switchToDomain('foobar.com', () => {
        Cypress.once('window:confirm', (text) => {
          expect(location.host).to.equal('foobar.com')
          expect(`window:confirm ${text}`).to.equal('window:confirm the confirm text')
          done()
        })

        cy.get('[data-cy="confirm"]').then(($el) => {
          $el.trigger('click')
        })
      })
    })

    it('window:confirmed - true when no window:confirm listeners return false', (done) => {
      // @ts-ignore
      cy.switchToDomain('foobar.com', () => {
        Cypress.once('window:confirmed', (text, returnedFalse) => {
          expect(location.host).to.equal('foobar.com')
          expect(`window:confirmed ${text} - ${returnedFalse}`).to.equal('window:confirmed the confirm text - true')
          done()
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
      // @ts-ignore
      cy.switchToDomain('foobar.com', () => {
        Cypress.once('window:confirmed', (text, returnedFalse) => {
          expect(location.host).to.equal('foobar.com')
          expect(`window:confirmed ${text} - ${returnedFalse}`).to.equal('window:confirmed the confirm text - false')
          done()
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
