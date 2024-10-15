// eslint-disable-next-line
it('2 - asserts on browser args', () => {
  // we cannot assert on ps output in electron
  // because the launchOptions.args does not go
  // anywhere in the process that we can detect
  // TODO: swap this out for Cypress.isBrowser(...)
  if (Cypress.browser.name === 'electron') {
    return
  }

  cy.task('assertPsOutput', Cypress.browser.name)
})
