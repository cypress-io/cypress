module.exports = {
  'video': false,
  'testFiles': '**/*.spec.{js,jsx}',
  'viewportWidth': 500,
  'viewportHeight': 800,
  'componentFolder': 'cypress/components',
  'pluginsFile': 'cypress/plugins.js',
  'component': {
    setupNodeEvents (on, config) {
      const devServer = require('@cypress/react/plugins/next')

      devServer(on, config)

      return config
    },
  },
}
