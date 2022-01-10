module.exports = {
  'video': false,
  'viewportWidth': 500,
  'viewportHeight': 800,
  'component': {
<<<<<<< HEAD
=======
    'supportFile': 'cypress/support/component.ts',
    'specPattern': 'src/**/*cy-spec.tsx',
>>>>>>> origin/10.0-release
    setupNodeEvents (on, config) {
      const devServer = require('@cypress/react/plugins/react-scripts')

      devServer(on, config)

      return config
    },
  },
}
