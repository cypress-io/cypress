// https://github.com/cypress-io/cypress/issues/2118
//
// Navigating away from a page whose `beforeunload` handler requests a
// confirmation prompt used to hang the Electron browser until pageLoadTimeout.
//
// `cy.press` dispatches a trusted key event (a real user gesture), giving the
// page sticky activation. Without that activation, modern Chromium suppresses
// the gesture-less `beforeunload` prompt and the bug does not reproduce. With
// it, `cy.reload()` / `cy.visit()` previously hung; they now proceed because
// Cypress accepts beforeunload via Electron's will-prevent-unload or Chrome CDP.

const activate = () => {
  cy.document().then((doc) => {
    doc.body.insertAdjacentHTML('beforeend', '<input id="beforeunload-activation"><button>next focus</button>')
  })

  cy.get('#beforeunload-activation').focus()
  cy.press(Cypress.Keyboard.Keys.TAB)
  cy.window().then((win) => {
    expect(win.navigator.userActivation.hasBeenActive, 'actual sticky activation').to.be.true
  })
}

it('can navigate away from a page with a beforeunload event dialog', function () {
  cy.visit('/blocking_beforeunload_event.html')
  activate()
  cy.reload()
  activate()
  cy.visit('/index.html')
})

it('can navigate away from a page with an onbeforeunload dialog', function () {
  cy.visit('/blocking_onbeforeunload.html')
  activate()
  cy.reload()
  activate()
  cy.visit('/index.html')
})

it('leaves an activated beforeunload handler for test isolation', () => {
  cy.visit('/blocking_beforeunload_event.html')
  activate()
})

it('continues after the previous test is isolated', () => {
  cy.url().should('eq', 'about:blank')
  cy.visit('/index.html')
})

it('leaves an activated onbeforeunload handler for browser shutdown', () => {
  cy.visit('/blocking_onbeforeunload.html')
  activate()
})
