import { getPathForPlatform } from '../../../src/paths'

export function getRunnerHref (specPath: string) {
  specPath = getPathForPlatform(specPath)

  if (Cypress.platform === 'win32') specPath = specPath.replaceAll('\\', '%5C')

  return `specs/runner?file=${specPath}`
}
