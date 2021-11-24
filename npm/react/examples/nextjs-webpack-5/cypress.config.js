module.exports = {
  'video': false,
  'viewportWidth': 500,
  'viewportHeight': 800,
  'componentFolder': 'cypress/components',
  'pluginsFile': 'cypress/plugins.js',
  'component': {
    'testFiles': '**/*.spec.{js,jsx}',
    setupNodeEvents (on, config) {
      const devServer = require('@cypress/react/plugins/next')

      devServer(on, config)

      return config
    },
  },
}
