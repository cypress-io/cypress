const resolve = require('resolve')
const env = require('../util/env')
const debug = require('debug')('cypress:server:plugins')

module.exports = {
  /**
   * Resolves the path to 'typescript' module.
   *
   * @param {Config} cypress config object
   * @returns {string|null} path if typescript exists, otherwise null
   */
  typescript: (config) => {
    if (env.get('CYPRESS_INTERNAL_NO_TYPESCRIPT') === '1') {
      return null
    }

    try {
      const options = {
        basedir: config.projectRoot,
      }

      if (!config.projectRoot) {
        throw new Error('Config is missing projet root')
      }

      debug('resolving typescript with options %o', options)

      const resolved = resolve.sync('typescript', options)

      debug('resolved typescript %s', resolved)

      return resolved
    } catch (e) {
      debug('could not resolve typescript, error: %s', e.message)

      return null
    }
  },
}
