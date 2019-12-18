const resolve = require('resolve')

module.exports = {
  typescript: (config) => {
    try {
      return resolve.sync('typescript', {
        baseDir: config.projectRoot,
      })
    } catch (e) {
      return null
    }
  },
}
