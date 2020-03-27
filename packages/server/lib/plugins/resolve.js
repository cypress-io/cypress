const resolve = require('resolve')
const env = require('../util/env')

module.exports = {
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
