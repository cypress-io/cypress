const path = require('path')

module.exports = {
  component: {
    experimentalSingleTabRunMode: true,
    devServer: {
      framework: 'next',
      bundler: 'webpack',
      // Necessary due to cypress/react resolving from cypress/node_modules rather than the project root
      webpackConfig: {
        resolve: {
          alias: {
            'react': path.resolve(__dirname, './node_modules/react'),
          },
        },
      },
    },
  },
  // These tests should run quickly / fail quickly,
  // since we intentionally causing error states for testing
  defaultCommandTimeout: 1000,
}
