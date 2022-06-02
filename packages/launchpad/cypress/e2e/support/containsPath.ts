declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * adapter for cy.contains that converts paths
       * to windows compatible paths on windows
       * @param filePath posix formatted path
       */
      containsPath(filePath: string)
      /**
       * adapter for cy.contains that converts paths
       * to windows compatible paths on windows
       * @param containerSelector a jquery selector string
       * @param filePath posix formatted path
       */
      containsPath(containerSelector: string, filePath: string)
    }
  }
}

// Here we export the function with no intention to import it
// This only tells the typescript type checker that this definitely is a module
// This way, we are allowed to use the global namespace declaration
export const containsPath = (...args: string[]) => {
  const filePath = args[args.length - 1]
  const denormalizedPath = navigator.platform === 'Win32' ? filePath.replace(/\//g, '\\') : filePath

  if (args.length === 1) {
    cy.contains(denormalizedPath, { log: false }).then((elt) => {
      Cypress.log({ name: 'containsPath', message: filePath, $el: elt })
    })
  } else if (args.length === 2) {
    cy.contains(args[0], denormalizedPath, { log: false }).then((elt) => {
      Cypress.log({ name: 'containsPath', message: `${args[0]} -- ${filePath}`, $el: elt })
    })
  }
}

Cypress.Commands.add('containsPath', containsPath)
