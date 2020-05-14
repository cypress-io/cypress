const os = require('os')
const path = require('path')

const distPath = 'dist/Cypress'

const execPath = {
  darwin: 'Cypress.app/Contents/MacOS/Cypress',
  freebsd: 'Cypress',
  linux: 'Cypress',
  win32: 'Cypress.exe',
}

const resourcesPath = {
  darwin: 'Cypress.app/Contents/Resources',
  freebsd: 'resources',
  linux: 'resources',
  win32: 'resources',
}

const unknownPlatformErr = function () {
  throw new Error(`Unknown platform: '${os.platform()}'`)
}

const normalize = (...paths) => {
  return path.join(__dirname, '..', ...paths)
}

module.exports = {
  getPathToDist (...paths) {
    paths = [distPath].concat(paths)

    return normalize(...paths)
  },

  getPathToExec () {
    const p = execPath[os.platform()] || unknownPlatformErr()

    return this.getPathToDist(p)
  },

  getPathToResources (...paths) {
    let p = resourcesPath[os.platform()] || unknownPlatformErr()

    p = [].concat(p, paths)

    return this.getPathToDist(...p)
  },

  getPathToVersion () {
    return this.getPathToDist('version')
  },

  getSymlinkType () {
    if (os.platform() === 'win32') {
      return 'junction'
    }

    return 'dir'
  },
}
