before(function () {
  if (Cypress.browser.family === 'chrome') {
    cy.task('set:device:metrics', null, { log: false })
  }
})
