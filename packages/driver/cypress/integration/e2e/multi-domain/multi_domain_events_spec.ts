// @ts-ignore / session support is needed for visiting about:blank between tests
describe('multi-domain', { experimentalSessionSupport: true }, () => {
  it('window:before:load event', () => {
    cy.visit('/fixtures/multi-domain.html')
    cy.on('window:before:load', (win: {testPrimaryDomainBeforeLoad: boolean}) => {
      win.testPrimaryDomainBeforeLoad = true
    })

    cy.window().its('testPrimaryDomainBeforeLoad').should('be.true')
    cy.get('a[data-cy="multi-domain-secondary-link"]').click()
    cy.switchToDomain('http://foobar.com:3500', () => {
      cy.on('window:before:load', (win: {testSecondaryWindowBeforeLoad: boolean}) => {
        win.testSecondaryWindowBeforeLoad = true
      })

      cy.window().its('testSecondaryWindowBeforeLoad').should('be.true')
      cy.window().its('testPrimaryDomainBeforeLoad').should('be.undefined')
      cy
      .get('[data-cy="window-before-load"]')
      .invoke('text')
      .should('equal', 'Window Before Load Called')
    })

    cy.visit('/fixtures/multi-domain.html')

    cy.window().its('testPrimaryDomainBeforeLoad').should('be.true')
    cy.window().its('testSecondaryWindowBeforeLoad').should('be.undefined')
  })

  describe('post window load events', () => {
    beforeEach(() => {
      cy.visit('/fixtures/multi-domain.html')
      cy.get('a[data-cy="multi-domain-secondary-link"]').click()
    })

    it('form:submitted', () => {
      cy.switchToDomain('http://foobar.com:3500', () => {
        const afterFormSubmitted = new Promise<void>((resolve) => {
          Cypress.once('form:submitted', (e) => {
            const $form = cy.$$('form')

            expect(e.target).to.eq($form.get(0))
            resolve()
          })
        })

        cy.get('form').submit()
        cy.wrap(afterFormSubmitted)
      })
    })

    it('window:before:unload', () => {
      cy.switchToDomain('http://foobar.com:3500', () => {
        const afterWindowBeforeUnload = new Promise<void>((resolve) => {
          Cypress.once('window:before:unload', () => {
            expect(location.host).to.equal('foobar.com:3500')
            resolve()
          })
        })

        // TODO: update to use relative path once available
        cy.visit('http://www.foobar.com:3500/fixtures/multi-domain.html')

        cy.wrap(afterWindowBeforeUnload)
      })
    })

    it('window:unload', () => {
      cy.switchToDomain('http://foobar.com:3500', () => {
        const afterWindowUnload = new Promise<void>((resolve) => {
          Cypress.once('window:unload', () => {
            expect(location.host).to.equal('foobar.com:3500')
            resolve()
          })
        })

        // TODO: update to use relative path once available
        cy.visit('http://www.foobar.com:3500/fixtures/multi-domain.html')

        cy.wrap(afterWindowUnload)
      })
    })

    it('window:alert', () => {
      cy.switchToDomain('http://foobar.com:3500', () => {
        const afterWindowAlert = new Promise<void>((resolve) => {
          Cypress.once('window:alert', (text) => {
            expect(location.host).to.equal('foobar.com:3500')
            expect(`window:alert ${text}`).to.equal('window:alert the alert text')
            resolve()
          })
        })

        cy.get('[data-cy="alert"]').click()
        cy.wrap(afterWindowAlert)
      })
    })

    it('window:confirm', () => {
      cy.switchToDomain('http://foobar.com:3500', () => {
        const afterWindowConfirm = new Promise<void>((resolve) => {
          Cypress.once('window:confirm', (text) => {
            expect(location.host).to.equal('foobar.com:3500')
            expect(`window:confirm ${text}`).to.equal('window:confirm the confirm text')
            resolve()
          })
        })

        cy.get('[data-cy="confirm"]').click()
        cy.wrap(afterWindowConfirm)
      })
    })

    it('window:confirmed - true when no window:confirm listeners return false', () => {
      cy.switchToDomain('http://foobar.com:3500', () => {
        const afterWindowConfirmed = new Promise<void>((resolve) => {
          Cypress.once('window:confirmed', (text, returnedFalse) => {
            expect(location.host).to.equal('foobar.com:3500')
            expect(`window:confirmed ${text} - ${returnedFalse}`).to.equal('window:confirmed the confirm text - true')
            resolve()
          })
        })

        Cypress.on('window:confirm', () => {})
        Cypress.on('window:confirm', () => {
          return true
        })

        cy.get('[data-cy="confirm"]').click()
        cy.wrap(afterWindowConfirmed)
      })
    })

    it('window:confirmed - false when any window:confirm listeners return false', () => {
      cy.switchToDomain('http://foobar.com:3500', () => {
        const afterWindowConfirmed = new Promise<void>((resolve) => {
          Cypress.once('window:confirmed', (text, returnedFalse) => {
            expect(location.host).to.equal('foobar.com:3500')
            expect(`window:confirmed ${text} - ${returnedFalse}`).to.equal('window:confirmed the confirm text - false')
            resolve()
          })
        })

        Cypress.on('window:confirm', () => {
          return false
        })

        Cypress.on('window:confirm', () => {})

        cy.get('[data-cy="confirm"]').click()
        cy.wrap(afterWindowConfirmed)
      })
    })
  })
})
