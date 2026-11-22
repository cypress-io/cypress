// https://github.com/cypress-io/cypress/issues/2118
//
// `cy.press` dispatches a trusted key event (a real user gesture), giving the
// page sticky activation, so the browser honors the page's `beforeunload`
// prompt. Cypress accepts the prompt, so `cy.reload()` and `cy.visit()` navigate
// away instead of waiting on it until pageLoadTimeout.

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
