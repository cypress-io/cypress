// https://github.com/cypress-io/cypress/issues/28553
//
// `cy.press` dispatches a trusted key event, which gives the page sticky
// activation, so its `beforeunload` handler can open a "Leave site?" dialog.
// Automatic user activation is turned off to show that the dialog is answered
// however the page was activated. Cypress accepts the dialog, so navigating
// away between tests and after the last test doesn't wait on it.
describe('a page left open with a beforeunload dialog', { userActivation: false }, () => {
  it('leaves an activated page with a beforeunload handler for the next test', () => {
    cy.visit('/blocking_beforeunload_event.html')
    cy.press(Cypress.Keyboard.Keys.TAB)
    cy.window().its('navigator.userActivation.hasBeenActive').should('be.true')
  })

  it('starts after the previous test left a page that asks to confirm leaving', () => {
    cy.visit('/blocking_onbeforeunload.html')
    cy.press(Cypress.Keyboard.Keys.TAB)
  })

  it('ends the run on an activated page with a beforeunload handler', () => {
    cy.visit('/blocking_beforeunload_event.html')
    cy.press(Cypress.Keyboard.Keys.TAB)
  })
})
