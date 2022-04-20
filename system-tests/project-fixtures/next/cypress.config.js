const path = require('path');

module.exports = {
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
      // Necessary due to cypress/react resolving from cypress/node_modules rather than the project root
      webpackConfig: {
        resolve: {
          alias: {
            'react': path.resolve(__dirname, './node_modules/react'),
          }
        }
      }
    }
  }
}