// @ts-ignore / session support is needed for visiting about:blank between tests
describe('multi-domain', { experimentalSessionSupport: true, experimentalMultiDomain: true }, () => {
  it('window:before:load event', () => {
    cy.visit('/fixtures/multi-domain.html')
    cy.on('window:before:load', (win: {testPrimaryDomainGlobal: boolean}) => {
      win.testPrimaryDomainGlobal = true
    })

    cy.window().its('testPrimaryDomainGlobal').should('be.true')
    cy.get('a[data-cy="multi-domain-secondary-link"]').click()
    cy.switchToDomain('foobar.com', () => {
      cy.on('window:before:load', (win: {testSecondaryDomainGlobal: boolean}) => {
        win.testSecondaryDomainGlobal = true
      })

      cy.window().its('testSecondaryDomainGlobal').should('be.true')
      cy.window().its('testPrimaryDomainGlobal').should('be.undefined')
      cy
      .get('[data-cy="window-before-load"]')
      .invoke('text')
      .should('equal', 'Window Before Load Called')
    })
  })

  describe('post window load events', () => {
    beforeEach(() => {
      cy.visit('/fixtures/multi-domain.html')
      cy.get('a[data-cy="multi-domain-secondary-link"]').click()
    })

    it('form:submitted', (done) => {
      cy.switchToDomain('foobar.com', done, () => {
        Cypress.once('form:submitted', (e) => {
          const $form = cy.$$('form')

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
      cy.switchToDomain('foobar.com', done, () => {
        Cypress.once('window:before:unload', () => {
          expect(location.host).to.equal('foobar.com')
          done()
        })

        cy.window().then((window) => {
          window.location.href = '/fixtures/multi-domain.html'
        })
      })
    })

    // FIXME: currently causes tests to hang. need to implement proper
    // stability-handling on secondary domains
    it.skip('window:unload', (done) => {
      cy.switchToDomain('foobar.com', done, () => {
        Cypress.once('window:unload', () => {
          expect(location.host).to.equal('foobar.com')
          done()
        })

        cy.window().then((window) => {
          window.location.href = '/fixtures/multi-domain.html'
        })
      })
    })

    it('navigation:changed', (done) => {
      cy.switchToDomain('foobar.com', done, () => {
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
      cy.switchToDomain('foobar.com', done, () => {
        Cypress.once('window:alert', (text) => {
          expect(location.host).to.equal('foobar.com')
          expect(`window:alert ${text}`).to.equal('window:alert the alert text')
          done()
        })

        cy.get('[data-cy="alert"]').click()
      })
    })

    it('window:confirm', (done) => {
      cy.switchToDomain('foobar.com', done, () => {
        Cypress.once('window:confirm', (text) => {
          expect(location.host).to.equal('foobar.com')
          expect(`window:confirm ${text}`).to.equal('window:confirm the confirm text')
          done()
        })

        cy.get('[data-cy="confirm"]').click()
      })
    })

    it('window:confirmed - true when no window:confirm listeners return false', (done) => {
      cy.switchToDomain('foobar.com', done, () => {
        Cypress.once('window:confirmed', (text, returnedFalse) => {
          expect(location.host).to.equal('foobar.com')
          expect(`window:confirmed ${text} - ${returnedFalse}`).to.equal('window:confirmed the confirm text - true')
          done()
        })

        Cypress.on('window:confirm', () => {})
        Cypress.on('window:confirm', () => {
          return true
        })

        cy.get('[data-cy="confirm"]').click()
      })
    })

    it('window:confirmed - false when any window:confirm listeners return false', (done) => {
      cy.switchToDomain('foobar.com', done, () => {
        Cypress.once('window:confirmed', (text, returnedFalse) => {
          expect(location.host).to.equal('foobar.com')
          expect(`window:confirmed ${text} - ${returnedFalse}`).to.equal('window:confirmed the confirm text - false')
          done()
        })

        Cypress.on('window:confirm', () => {
          return false
        })

        Cypress.on('window:confirm', () => {})

        cy.get('[data-cy="confirm"]').click()
      })
    })
  })
})
