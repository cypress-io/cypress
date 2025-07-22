describe('src/cy/commands/prompt', () => {
  it('executes the prompt command', () => {
    // TODO: (cy.prompt) We will look into supporting other browsers
    // as this is rolled out. We will add error messages for other browsers
    // and add tests if necessary
    if (Cypress.isBrowser('webkit') || Cypress.isBrowser('firefox')) {
      return
    }

    cy.visit('http://www.foobar.com:3500/fixtures/dom.html')

    // TODO: add more tests when cy.prompt is built out, but for now this just
    // verifies that the command executes without throwing an error
    // @ts-expect-error - this will not error when we actually release the experimentalPromptCommand flag
    cy.prompt(['Hello, world!'])

    cy.visit('http://www.barbaz.com:3500/fixtures/dom.html')

    cy.origin('http://www.barbaz.com:3500', () => {
      // @ts-expect-error - this will not error when we actually release the experimentalPromptCommand flag
      cy.prompt(['Hello, world!'])
    })
  })
})
