import { decodeBase64Unicode } from '@packages/frontend-shared/src/utils/base64'

export function getPathForPlatform (posixPath?: string) {
  if (!posixPath) {
    return null
  }

  // @ts-ignore
  const cy = window.Cypress
  const platform = cy?.platform || JSON.parse(decodeBase64Unicode(window.__CYPRESS_CONFIG__.base64Config)).platform

  if (platform === 'win32') return posixPath.replaceAll('/', '\\')

  return posixPath
}
