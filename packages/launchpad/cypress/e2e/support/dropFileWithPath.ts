declare global {
  namespace Cypress {
    interface Chainable {
      dropFileWithPath(filePath: string): Cypress.Chainable<JQuery<HTMLInputElement>>
    }
  }
}

// Here we export the function with no intention to import it
// This only tells the typescript type checker that this definitely is a module
// This way, we are allowed to use the global namespace declaration
export const dropFileWithPath = (subject, filePath) => {
  const attachedFile = new File([new Blob()], 'cypress.config.ts')

  Object.defineProperty(attachedFile, 'path', { value: filePath })

  const dataTransfer = new DataTransfer()

  dataTransfer.items.add(attachedFile)
  subject[0].files = dataTransfer.files

  return cy.wrap(subject)
  .trigger('dragstart')
  .trigger('drag')
  .trigger('dragenter')
  .trigger('drop', { dataTransfer })
}

Cypress.Commands.add('dropFileWithPath', { prevSubject: 'element' }, dropFileWithPath)
