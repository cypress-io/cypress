// https://github.com/cypress-io/cypress/issues/2118
//
// Navigating away from a page whose `beforeunload` handler requests a
// confirmation prompt used to hang the Electron browser until pageLoadTimeout.
//
// `cy.press` dispatches a trusted key event (a real user gesture), giving the
// page sticky activation. Without that activation, modern Chromium suppresses
// the gesture-less `beforeunload` prompt and the bug does not reproduce. With
// it, `cy.reload()` / `cy.visit()` previously hung; they now proceed because
// Cypress dismisses the prompt via Electron's `will-prevent-unload` event.

it('can navigate away from a page with a beforeunload event dialog', function () {
  cy.visit('/blocking_beforeunload_event.html')
  cy.press(Cypress.Keyboard.Keys.TAB)
  cy.reload()
  cy.visit('/index.html')
})

it('can navigate away from a page with an onbeforeunload dialog', function () {
  cy.visit('/blocking_onbeforeunload.html')
  cy.press(Cypress.Keyboard.Keys.TAB)
  cy.reload()
  cy.visit('/index.html')
})
