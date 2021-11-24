module.exports = {
  'video': false,
  'viewportWidth': 500,
  'viewportHeight': 800,
  'componentFolder': 'src',
  'component': {
    'testFiles': '**/*cy-spec.tsx',
    setupNodeEvents (on, config) {
      const devServer = require('@cypress/react/plugins/react-scripts')

      devServer(on, config)

      return config
    },
  },
}
