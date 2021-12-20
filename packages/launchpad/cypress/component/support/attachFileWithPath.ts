declare global {
  namespace Cypress {
    interface Chainable {
      attachFileWithPath: (path: string) => Chainable<HTMLInputElement>
    }
  }
}

export function attachedFileWithPath (subject: HTMLInputElement, path: string) {
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
  // TODO: Figure out why https://github.com/cypress-io/cypress/pull/19003 isn't fixing this?
  attachedFileWithPath as any,
)
