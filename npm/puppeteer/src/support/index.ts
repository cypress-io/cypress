// necessary to make this a module so `declare global` works
export {}

declare global {
  namespace Cypress {
    interface Chainable {
      puppeteer(messageName: string, ...args: any[]): Chainable
    }
  }
}

Cypress.Commands.add('puppeteer', (name, ...args) => {
  Cypress.log({
    name: 'puppeteer',
    message: name,
  })

  cy.task('__cypressPuppeteer__', { name, args }, { log: false }).then((result: any) => {
    if (result && result.__error__) {
      // TODO: wrap and re-throw error

      throw new Error(result.__error__.message)
    }

    return result
  })
})
