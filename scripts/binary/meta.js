const path = require('path')
const la = require('lazy-ass')
const check = require('check-more-types')
const R = require('ramda')
const os = require('os')

// canonical platform names
const platforms = {
  darwin: 'darwin',
  linux: 'linux',
  windows: 'win32',
}

const isValidPlatform = check.oneOf(R.values(platforms))

const checkPlatform = (platform) => {
  return la(isValidPlatform(platform),
    'invalid build platform', platform, 'valid choices', R.values(platforms))
}

const buildRootDir = () => {
  return path.resolve('build')
}

// returns a path into the /build directory
// the output folder should look something like this
// build/
//   <platform>/ = linux or darwin
//     ... platform-specific files
const buildDir = function (platform, ...args) {
  checkPlatform(platform)
  const root = buildRootDir()

  switch (platform) {
    case 'darwin':
      // the new electron-builder for some reason adds its own platform
      // subfolder and it is NOT "darwin" but "mac"
      return path.resolve(root, 'mac', ...args)
    case 'linux':
      return path.resolve(root, 'linux-unpacked', ...args)
    case 'win32':
      if (os.arch() === 'x64') {
        return path.resolve(root, 'win-unpacked', ...args)
      }

      // x86 32bit architecture
      return path.resolve(root, 'win-ia32-unpacked', ...args)
    default:
      throw new Error('unexpected platform')
  }
}

// returns a path into the /dist directory
const distDir = function (platform, ...args) {
  checkPlatform(platform)

  return path.resolve('dist', platform, ...args)
}

// returns folder to zip before uploading
const zipDir = function (platform) {
  checkPlatform(platform)
  switch (platform) {
    case 'darwin':
      return buildDir(platform, 'Cypress.app')
    case 'linux':
      return buildDir(platform)
    case 'win32':
      return buildDir(platform)
    default:
      throw new Error('unexpected platform')
  }
}

// returns a path into the /build/*/app directory
// specific to each platform
const buildAppDir = function (platform, ...args) {
  checkPlatform(platform)
  switch (platform) {
    case 'darwin':
      return buildDir(platform, 'Cypress.app', 'Contents', 'resources', 'app', ...args)
    case 'linux':
      return buildDir(platform, 'resources', 'app', ...args)
    case 'win32':
      return buildDir(platform, 'resources', 'app', ...args)
    default:
      throw new Error('unexpected platform')
  }
}

const buildAppExecutable = function (platform) {
  checkPlatform(platform)
  switch (platform) {
    case 'darwin':
      return buildDir(platform, 'Cypress.app', 'Contents', 'MacOS', 'Cypress')
    case 'linux':
      return buildDir(platform, 'Cypress')
    case 'win32':
      return buildDir(platform, 'Cypress')
    default:
      throw new Error('unexpected platform')
  }
}

module.exports = {
  isValidPlatform,
  buildRootDir,
  buildDir,
  distDir,
  zipDir,
  buildAppDir,
  buildAppExecutable,
  cacheDir: path.join(process.cwd(), 'cache'),
  platforms,
}
