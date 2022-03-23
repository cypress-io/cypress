declare global {
  namespace Cypress {
    interface Chainable {
      attachFileWithPath: (path: string) => Chainable<JQuery<HTMLInputElement>>
    }
  }
}

export function attachFileWithPath (subject, path: string) {
  const attachedFile = new File([new Blob()], 'cypress.config.ts')

  Object.defineProperty(attachedFile, 'path', { value: path })

  const dataTransfer = new DataTransfer()

  dataTransfer.items.add(attachedFile)
  subject[0].files = dataTransfer.files

  return cy.wrap(subject)
}

Cypress.Commands.add(
  'attachFileWithPath',
  { prevSubject: true },
  attachFileWithPath,
)
