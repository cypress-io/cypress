module.exports = {
  'video': false,
  'testFiles': '**/*cy-spec.tsx',
  'viewportWidth': 500,
  'viewportHeight': 800,
  'componentFolder': 'src',
  'component': {
    setupNodeEvents (on, config) {
      const devServer = require('@cypress/react/plugins/react-scripts')

      devServer(on, config)

      return config
    },
  },
}
