module.exports = {
  'video': false,
  'viewportWidth': 500,
  'viewportHeight': 800,
  'pluginsFile': 'cypress/plugins.js',
  'component': {
    'specPattern': 'cypress/component/**/*.spec.{js,jsx}',
    setupNodeEvents (on, config) {
      const devServer = require('@cypress/react/plugins/next')

      devServer(on, config)

      return config
    },
  },
}
