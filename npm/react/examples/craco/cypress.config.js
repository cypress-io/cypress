module.exports = {
  'component': {
    'specPattern': 'component/**/*.test.{js,ts,jsx,tsx}',
    setupNodeEvents (on, config) {
      const cracoConfig = require('./craco.config.js')
      const devServer = require('@cypress/react/plugins/craco')

      devServer(on, config, cracoConfig)

      return config
    },
  },
}
