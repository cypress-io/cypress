export const toPosix = (file: string) => {
  if (file == null) {
    return file
  }

  return Cypress.config('platform') === 'win32'
    ? file.replaceAll('\\', '/')
    : file
}
