declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * adapter for cy.contains that converts paths
       * to windows compatible paths on windows
       * @param filePath posix formatted path
       */
      containsPath(filePath: string)
    }
  }
}

export const containsPath = (filePath) => {
  const denormalizedPath = navigator.platform === 'Win32' ? filePath.replace(/\//g, '\\') : filePath

  cy.contains(denormalizedPath, { log: false }).then((elt) => {
    Cypress.log({ name: 'containsPath', message: filePath, $el: elt })
  })
}

Cypress.Commands.add('containsPath', containsPath)
