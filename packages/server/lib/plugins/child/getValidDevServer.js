const util = require('../util')

/**
 * @param ipc
 * @param {string} file
 * @param {Cypress.ComponentConfigOptions} config
 */
const getValidDevServer = (ipc, file, config) => {
  const { devServer } = config

  if (devServer && typeof devServer === 'function') {
    return devServer
  }

  // devServer: { bundler, framework }
  if (typeof devServer === 'object') {
    if (devServer.bundler === 'webpack') {
      return resolveBundled('webpack-dev-server')
    }

    if (devServer.bundler === 'vite') {
      return resolveBundled('vite-dev-server')
    }
  }

  ipc.send('setupTestingType:error', util.serializeError(
    require('@packages/errors').getError('CONFIG_FILE_DEV_SERVER_IS_NOT_A_FUNCTION', file, config),
  ))

  return false
}

/**
 * @param {string} toImport
 */
function resolveBundled (toImport) {
  const { devServer } = require(toImport)

  return devServer
}

exports.getValidDevServer = getValidDevServer
