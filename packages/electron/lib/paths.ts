import os from 'os'
import path from 'path'

const distPath = 'dist/Cypress'

type OSLookup = Record<string, string>

const execPath: OSLookup = {
  darwin: 'Cypress.app/Contents/MacOS/Cypress',
  freebsd: 'Cypress',
  linux: 'Cypress',
  win32: 'Cypress.exe',
}

const resourcesPath: OSLookup = {
  darwin: 'Cypress.app/Contents/Resources',
  freebsd: 'resources',
  linux: 'resources',
  win32: 'resources',
}

const unknownPlatformErr = function () {
  throw new Error(`Unknown platform: '${os.platform()}'`)
}

const normalize = (...paths: string[]) => {
  return path.join(__dirname, '..', '..', ...paths)
}

export const getPathToDist = (...paths: string[]) => {
  paths = [distPath].concat(paths)

  return normalize(...paths)
}

export const getPathToExec = () => {
  const p = execPath[os.platform()] || unknownPlatformErr()

  return getPathToDist(p)
}

export const getPathToResources = (...paths: string[]) => {
  const p = resourcesPath[os.platform()] || unknownPlatformErr()

  return getPathToDist(...[p, ...paths])
}

export const getPathToVersion = () => {
  return getPathToDist('version')
}

export const getSymlinkType = () => {
  if (os.platform() === 'win32') {
    return 'junction'
  }

  return 'dir'
}
