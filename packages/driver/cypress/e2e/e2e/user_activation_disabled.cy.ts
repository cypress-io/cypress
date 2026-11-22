import { getAutElement } from '../../support/utils'

// Its own spec, so the AUT frame starts out unactivated: Chromium keeps a frame's
// activation across same-origin navigations, so an earlier test would leave it on.
// https://github.com/cypress-io/cypress/issues/34993
describe('user activation with userActivation: false', { browser: '!webkit', userActivation: false }, () => {
  const expectActivation = (win: Window, hasBeenActive: boolean) => {
    expect(win.navigator.userActivation.hasBeenActive, 'navigator.userActivation.hasBeenActive').to.equal(hasBeenActive)
  }

  it('leaves the AUT unactivated after cy.visit()', () => {
    cy.visit('/fixtures/user-activation.html')
    cy.window().then((win) => expectActivation(win, false))
  })

  it('leaves the AUT unactivated after cy.reload()', () => {
    cy.visit('/fixtures/user-activation.html')
    cy.reload()
    cy.window().then((win) => expectActivation(win, false))
  })

  it('leaves activation-gated APIs blocked', { browser: { family: 'chromium' } }, () => {
    cy.visit('/fixtures/user-activation.html')
    cy.window().then((win) => {
      expect(win.navigator.vibrate(1), 'navigator.vibrate()').to.be.false
    })
  })

  it('gives a click handler no transient activation', () => {
    const results: unknown[] = []

    cy.visit('/fixtures/user-activation.html')
    cy.window().then((win) => {
      win.document.querySelector('#button')!.addEventListener('click', () => {
        results.push(win.navigator.userActivation.isActive)

        try {
          getAutElement(win.document, '#date', 'input').showPicker()
        } catch (err) {
          results.push(err.name)
        }
      })
    })

    cy.get('#button').click()
    cy.wrap(results).should('deep.equal', [false, 'NotAllowedError'])
  })

  // https://github.com/cypress-io/cypress/issues/2851
  it('leaves document.execCommand(\'copy\') blocked in a click handler', { browser: { family: 'chromium' } }, () => {
    const copied: boolean[] = []

    cy.visit('/fixtures/user-activation.html')
    cy.get('#text').invoke('val', 'Jordan Avery')
    cy.window().then((win) => {
      win.document.querySelector('#button')!.addEventListener('click', () => {
        getAutElement(win.document, '#text', 'input').select()
        copied.push(win.document.execCommand('copy'))
      })
    })

    cy.get('#button').click()
    cy.wrap(copied).should('deep.equal', [false])
  })

  it('can be turned back on for one test', { userActivation: true }, () => {
    cy.visit('/fixtures/user-activation.html')
    cy.window().then((win) => expectActivation(win, true))
  })
})
