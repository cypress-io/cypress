module.exports = {
  'retries': null,
  e2e: {
    setupNodeEvents (on, config) {
      const proxyquire = require('proxyquire')

      // force typescript to always be non-requireable
      const wp = proxyquire('@cypress/webpack-preprocessor', {
        typescript: null,
      })

      on('file:preprocessor', wp())

      return config
    },
  },
}
