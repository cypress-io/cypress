const Promise = require('bluebird')
const debug = require('debug')('cypress:cli')
const path = require('path')

const util = require('../util')
const state = require('../tasks/state')
const { throwFormErrorText, errors } = require('../errors')

const getVersions = () => {
  return Promise.try(() => {

    if (util.getEnv('CYPRESS_RUN_BINARY')) {
      let envBinaryPath = path.resolve(util.getEnv('CYPRESS_RUN_BINARY'))
      return state.parseRealPlatformBinaryFolderAsync(envBinaryPath)
      .then((envBinaryDir) => {
        if (!envBinaryDir) {
          return throwFormErrorText(errors.CYPRESS_RUN_BINARY.notValid(envBinaryPath))()
        }
        debug('CYPRESS_RUN_BINARY has binaryDir:', envBinaryDir)

        return envBinaryDir
      })
      .catch({ code: 'ENOENT' }, (err) => {
        return throwFormErrorText(errors.CYPRESS_RUN_BINARY.notValid(envBinaryPath))(err.message)
      })
    }
    return state.getBinaryDir()
  })
  .then(state.getBinaryPkgVersionAsync)
  .then((binaryVersion) => {
    return {
      package: util.pkgVersion(),
      binary: binaryVersion || 'not installed',
    }
  })
}

module.exports = {
  getVersions,
}
