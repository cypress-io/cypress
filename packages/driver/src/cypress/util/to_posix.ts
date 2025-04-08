export const toPosix = (file: string) => {
  return Cypress.config('platform') === 'win32'
    ? file.replaceAll('\\', '/')
    : file
}
