// eslint-disable-next-line mocha/no-exports -- exports nothing: it makes TypeScript and webpack treat this spec as a module
export {}

declare global {
  interface Window {
    // set by fixtures/user-activation.html
    observedEvents: string[]
    isFirstPage?: boolean
  }
}

// https://github.com/cypress-io/cypress/issues/34993
describe('user activation', { browser: '!webkit' }, () => {
  const expectActivation = (win: Window, hasBeenActive: boolean) => {
    expect(win.navigator.userActivation.hasBeenActive, 'navigator.userActivation.hasBeenActive').to.equal(hasBeenActive)
  }

  it('activates the AUT by the time cy.visit() resolves', () => {
    cy.visit('/fixtures/user-activation.html')
    cy.window().then((win) => expectActivation(win, true))
  })

  it('activates the AUT before window:load handlers run', () => {
    cy.visit('/fixtures/user-activation.html', {
      onLoad: (win) => expectActivation(win, true),
    })
  })

  it('does not fire input or focus events in the AUT', () => {
    cy.visit('/fixtures/user-activation.html')
    cy.window().then((win) => {
      expectActivation(win, true)
      expect(win.observedEvents).to.deep.equal([])
      expect(win.document.activeElement).to.equal(win.document.body)
    })
  })

  it('activates the AUT after cy.reload()', () => {
    cy.visit('/fixtures/user-activation.html')
    cy.reload()
    cy.window().then((win) => expectActivation(win, true))
  })

  it('activates a document the AUT navigates to', () => {
    cy.visit('/fixtures/user-activation.html')
    cy.window().then((win) => {
      // a document's activation ends with it, so this property doesn't survive the navigation
      win.isFirstPage = true
    })

    cy.get('#next-page').click()
    cy.location('search').should('equal', '?page=2')
    cy.window().then((win) => {
      expect(win.isFirstPage).to.be.undefined
      expectActivation(win, true)
    })
  })

  it('activates a cross-origin AUT after a cy.origin() navigation', () => {
    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="cross-origin-secondary-link"]').click()

    cy.origin('http://www.foobar.com:3500', () => {
      cy.window().then((win) => {
        expect(win.navigator.userActivation.hasBeenActive, 'navigator.userActivation.hasBeenActive').to.be.true
      })
    })
  })

  it('lets activation-gated APIs work', { browser: { family: 'chromium' } }, () => {
    cy.visit('/fixtures/user-activation.html')
    cy.window().then((win) => {
      expect(win.navigator.vibrate(1), 'navigator.vibrate()').to.be.true
    })
  })

  describe('beforeunload dialogs', () => {
    const beforeUnloadLogs: Cypress.Log[] = []

    beforeEach(() => {
      beforeUnloadLogs.length = 0

      cy.on('log:added', (attrs, log) => {
        if (attrs.name === 'beforeunload') {
          beforeUnloadLogs.push(log)
        }
      })
    })

    it('accepts and logs a beforeunload dialog on cy.reload()', () => {
      cy.visit('/fixtures/user-activation.html?beforeunload')
      cy.reload()
      cy.window().then((win) => expectActivation(win, true))
      cy.wrap(beforeUnloadLogs).should('have.length', 1).then(([log]) => {
        expect(log.get('message')).to.equal('accepted the "Leave site?" dialog')
        expect(log.get('event')).to.be.true
      })
    })

    it('accepts a beforeunload dialog when the AUT navigates', () => {
      cy.visit('/fixtures/user-activation.html?beforeunload')
      cy.get('#next-page').click()
      cy.location('search').should('equal', '?page=2')
      cy.wrap(beforeUnloadLogs).should('have.length', 1)
    })

    // the next test's navigation to about:blank answers this page's dialog, so a hang
    // here shows up as the next test timing out
    it('leaves a page with a beforeunload handler for the next test', () => {
      cy.visit('/fixtures/user-activation.html?beforeunload')
    })

    it('starts after the previous page asked to confirm leaving', () => {
      cy.visit('/fixtures/user-activation.html')
      cy.window().then((win) => expectActivation(win, true))
    })
  })
})
