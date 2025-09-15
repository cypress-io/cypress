import os from 'os'
import path from 'path'
import { existsSync } from 'fs'

const distPath = 'dist/Cypress'

export function pkgRoot (): string {
  let currentDir = path.dirname(__dirname)

  // arbitrary limit to prevent infinite loop
  const limit = 200
  let i = 0

  do {
    if (i > limit) {
      throw new Error('Could not find package.json to determine package root')
    }

    if (existsSync(path.join(currentDir, 'package.json'))) {
      return currentDir
    }

    currentDir = path.resolve(currentDir, '..')
    i++
  } while (currentDir !== path.resolve('/'))

  throw new Error('Could not find package.json to determine package root')
}

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

export const getPathToDist = (...paths: string[]) => {
  return path.resolve(pkgRoot(), distPath, ...paths)
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
