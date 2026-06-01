// Visiting a different origin from the Cypress runner triggers a top-window
// reload. This spec asserts that the before:spec plugin event fires exactly
// once despite that reload (regression test for #26300).
it('visits an app on a different origin', () => {
  cy.visit('http://localhost:3502/')
})
