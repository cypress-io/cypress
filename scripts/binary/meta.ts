import path from 'path'
import os from 'os'

// canonical platform names
export const platforms = {
  darwin: 'darwin',
  linux: 'linux',
  windows: 'win32',
} as const

export const PLATFORM = os.platform() as any

if (!Object.values(platforms).includes(PLATFORM)) {
  throw new Error(`Invalid build platform  ${PLATFORM}`)
}

export type PlatformName = {[K in keyof typeof platforms]: typeof platforms[K]}[keyof typeof platforms]

export const buildRootDir = () => {
  return path.join(TMP_BUILD_DIR, 'build')
}

export const buildLinkDir = () => {
  return path.resolve('build')
}

// returns a path into the /build directory
// the output folder should look something like this
// build/
//   <platform>/ = linux or darwin
//     ... platform-specific files
export const buildDir = function (...args: string[]) {
  const root = buildRootDir()

  switch (PLATFORM) {
    case 'darwin':
      // the new electron-builder for some reason adds its own platform
      // subfolder and it is NOT "darwin" but "mac"
      switch (os.arch()) {
        case 'arm64':
          return path.resolve(root, 'mac-arm64', ...args)
        default:
          return path.resolve(root, 'mac', ...args)
      }
    case 'linux':
      // https://github.com/cypress-io/cypress/pull/19498
      switch (os.arch()) {
        case 'arm64':
          return path.resolve(root, 'linux-arm64-unpacked', ...args)
        default:
          return path.resolve(root, 'linux-unpacked', ...args)
      }
    case 'win32':
      return path.resolve(root, 'win-unpacked', ...args)
    default:
      throw new Error('unexpected platform')
  }
}

export const TMP_BUILD_DIR = path.join(os.tmpdir(), 'cypress-build', PLATFORM)

// returns a path into the /dist directory
export const distDir = function (...args: string[]) {
  return path.resolve(TMP_BUILD_DIR, 'dist', ...args)
}

// returns folder to zip before uploading
export const zipDir = function () {
  switch (PLATFORM) {
    case 'darwin':
      return buildDir('Cypress.app')
    case 'linux':
    case 'win32':
      return buildDir()
    default:
      throw new Error('unexpected platform')
  }
}

// returns a path into the /build/*/app directory
// specific to each platform
export const buildAppDir = function (...args: string[]) {
  switch (PLATFORM) {
    case 'darwin':
      return buildDir('Cypress.app', 'Contents', 'resources', 'app', ...args)
    case 'linux':
    case 'win32':
      return buildDir('resources', 'app', ...args)
    default:
      throw new Error('unexpected platform')
  }
}

export const buildAppExecutable = function () {
  switch (PLATFORM) {
    case 'darwin':
      return buildDir('Cypress.app', 'Contents', 'MacOS', 'Cypress')
    case 'linux':
    case 'win32':
      return buildDir('Cypress')
    default:
      throw new Error('unexpected platform')
  }
}

export const cacheDir = path.join(process.cwd(), 'cache')
