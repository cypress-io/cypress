declare global {
  namespace Cypress {
    interface Chainable {
      attachFileWithPath: (path: string) => Chainable<HTMLInputElement>
    }
  }
}

export function attachedFileWithPath (subject: HTMLInputElement, path: string) {
  const attachedFile = new File([new Blob()], 'cypress.json')

  Object.defineProperty(attachedFile, 'path', { value: path })

  const dataTransfer = new DataTransfer()

  dataTransfer.items.add(attachedFile)
  subject[0].files = dataTransfer.files

  return subject
}

Cypress.Commands.add(
  'attachFileWithPath',
  { prevSubject: true },
  attachedFileWithPath,
)
