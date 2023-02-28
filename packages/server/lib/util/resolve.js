const env = require('./env')
const debug = require('debug')('cypress:server:plugins')

module.exports = {
  /**
   * Resolves the path to 'typescript' module.
   *
   * @param {projectRoot} path to the project root
   * @returns {string|undefined} path if typescript exists
   */
  typescript: (projectRoot) => {
    if (env.get('CYPRESS_INTERNAL_NO_TYPESCRIPT') === '1' || !projectRoot) {
      return
    }

    try {
      debug('resolving typescript with projectRoot %o', projectRoot)

      const resolved = require.resolve('typescript', { paths: [projectRoot] })

      debug('resolved typescript %s', resolved)

      return resolved
    } catch (e) {
      debug('could not resolve typescript, error: %s', e.message)
    }
  },
}
