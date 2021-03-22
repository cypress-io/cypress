const resolve = require('resolve')
const env = require('./env')
const debug = require('debug')('cypress:server:plugins')
const fs = require('fs')
const path = require('path')

module.exports = {
  /**
   * Resolves the path to 'typescript' module.
   *
   * @param {projectRoot} path to the project root
   * @returns {string|null} path if typescript exists, otherwise null
   */
  typescript: (projectRoot) => {
    if (env.get('CYPRESS_INTERNAL_NO_TYPESCRIPT') === '1' || !projectRoot) {
      return null
    }

    try {
      const options = {
        basedir: projectRoot,
      }

      debug('resolving typescript with options %o', options)

      // use built-in resolve when yarn v2 is detected
      const resolved = fs.existsSync(path.join(projectRoot, '.yarn', 'cache')) ?
        require.resolve('typescript') :
        resolve.sync('typescript', options)

      debug('resolved typescript %s', resolved)

      return resolved
    } catch (e) {
      debug('could not resolve typescript, error: %s', e.message)

      return null
    }
  },
}
