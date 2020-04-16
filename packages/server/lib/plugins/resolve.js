const resolve = require('resolve')
const env = require('../util/env')

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
      return resolve.sync('typescript', {
        baseDir: config.projectRoot,
      })
    } catch (e) {
      return null
    }
  },
}
