export function getPathForPlatform (posixPath: string) {
  if (Cypress.platform === 'win32') return posixPath.replaceAll('/', '\\')

  return posixPath
}
