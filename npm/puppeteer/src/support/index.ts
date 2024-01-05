Cypress.Commands.add('puppeteer', (name, ...args) => {
  Cypress.log({
    name: 'puppeteer',
    message: name,
  })

  cy.task('__cypressPuppeteer__', { name, args }, { log: false }).then((result: any) => {
    if (result && result.__error__) {
      throw new Error(`cy.puppeteer() failed with the following error:\n> ${result.__error__.message || result.__error__}`)
    }

    return result
  })
})
