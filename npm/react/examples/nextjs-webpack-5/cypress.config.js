const { devServer } = require('@cypress/react/plugins/next')

module.exports = {
  'video': false,
  'viewportWidth': 500,
  'viewportHeight': 800,
  'pluginsFile': 'cypress/plugins.js',
  'component': {
    devServer,
  },
}
