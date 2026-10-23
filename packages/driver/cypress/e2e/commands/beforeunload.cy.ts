describe('beforeunload during Cypress-owned navigation', () => {
  // This regression exercises Chromium/CDP handling; cy.press is not supported in WebKit.
  if (!Cypress.isBrowser({ family: 'chromium' })) return

  const activateAndInstall = () => {
    cy.visit('/fixtures/empty.html')
    cy.document().then((doc) => {
      doc.body.innerHTML = '<input id="activation-input"><button>next focus target</button>'
    })

    cy.get('#activation-input').focus()
    cy.press(Cypress.Keyboard.Keys.TAB)
    cy.window().then((win) => {
      expect(win.navigator.userActivation.hasBeenActive, 'actual sticky activation').to.be.true
      win.addEventListener('beforeunload', (event) => {
        event.preventDefault()
        event.returnValue = ''
      })
    })
  }

  it('installs a synthetic beforeunload listener after real activation', activateAndInstall)

  it('continues through test isolation and installs the shutdown case', activateAndInstall)
})
