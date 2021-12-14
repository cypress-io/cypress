import path from 'path'

declare global {
  namespace Cypress {
    interface Chainable {
      dropFileWithPath: (path: string) => Chainable<HTMLInputElement>
    }
  }
}

export function dropFileWithPath (subject: HTMLInputElement, filePath: string) {
  const attachedFile = new File([new Blob()], 'cypress.config.ts')
  const fullPath = path.resolve(filePath)

  Object.defineProperty(attachedFile, 'path', { value: fullPath })

  const dataTransfer = new DataTransfer()

  dataTransfer.items.add(attachedFile)
  subject[0].files = dataTransfer.files

  return cy.wrap(subject)
  .trigger('dragstart')
  .trigger('drag')
  .trigger('dragenter')
  .trigger('drop', { dataTransfer })
}

Cypress.Commands.add(
  'dropFileWithPath',
  { prevSubject: true },
  // @ts-ignore - fixed by https://github.com/cypress-io/cypress/pull/19003
  dropFileWithPath,
)
