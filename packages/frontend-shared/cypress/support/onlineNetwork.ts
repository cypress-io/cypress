export function goOnline () {
  Cypress.Commands.add('goOnline', () => {
    cy.log('**go online**')
    .then(() => {
      Cypress.automation('remote:debugger:protocol',
        {
          command: 'Network.emulateNetworkConditions',
          params: {
            offline: false,
            latency: -1,
            downloadThroughput: -1,
            uploadThroughput: -1,
          },
        })
    })
    .then(() => {
      Cypress.automation('remote:debugger:protocol',
        {
          command: 'Network.disable',
        })
    })
  })
}

export function goOffline () {
  Cypress.Commands.add('goOffline', () => {
    cy.log('**go offline**')
    .then(() => {
      return Cypress.automation('remote:debugger:protocol',
        {
          command: 'Network.enable',
        })
    })
    .then(() => {
      Cypress.automation('remote:debugger:protocol',
        {
          command: 'Network.emulateNetworkConditions',
          params: {
            offline: true,
            latency: -1,
            downloadThroughput: -1,
            uploadThroughput: -1,
          },
        })
    })
  })
}

declare global {
  namespace Cypress {
    interface Chainable {
      /**
      * Simulates offline network mode
      */
        goOffline(): void
      /**
       * Simulates online network mode
       */
        goOnline(): void
    }
  }
}
