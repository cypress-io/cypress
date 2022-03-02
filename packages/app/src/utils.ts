import { decodeBase64Unicode } from '@packages/frontend-shared/src/utils/base64'

export function getPathForPlatform (posixPath: string) {
  // @ts-ignore
  const cy = window.Cypress
  const platform = cy?.platform || JSON.parse(decodeBase64Unicode(window.__CYPRESS_CONFIG__.base64Config)).platform

  if (platform === 'win32') return posixPath.replaceAll('/', '\\')

  return posixPath
}

/**
 * This is a static version of the config used for run mode.
 * If you want one that is updated via GraphQL for use in open mode,
 * you need to query for it.
 */
export function getRunModeStaticCypressConfig () {
  return JSON.parse(decodeBase64Unicode(window.__CYPRESS_CONFIG__.base64Config)) as Cypress.Config
}
