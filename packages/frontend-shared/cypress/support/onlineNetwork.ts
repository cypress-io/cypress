export function addNetworkCommands () {
  Cypress.Commands.add('goOnline', () => {
    cy.log('**go online**').window().then(($window) => {
      $window.dispatchEvent(new $window.Event('online'))
    })
  })

  Cypress.Commands.add('goOffline', () => {
    cy.log('**go offline**').window().then(($window) => {
      $window.dispatchEvent(new $window.Event('offline'))
    })
  })
}

declare global {
  namespace Cypress {
    interface Chainable {
      /**
      * Simulates offline network mode
      */
      goOffline(): Chainable<void>
      /**
       * Simulates online network mode
       */
      goOnline(): Chainable<void>
    }
  }
}
