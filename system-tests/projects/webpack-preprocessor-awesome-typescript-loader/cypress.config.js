module.exports = {
  'retries': null,
  'e2e': {
    'supportFile': false,
    setupNodeEvents (on, config) {
      const wp = require('@cypress/webpack-preprocessor')
      const path = require('path')

      const webpackOptions = {
        resolve: {
          extensions: ['.ts', '.js'],
        },
        module: {
          rules: [
            {
              test: /\.tsx?$/,
              exclude: /node_modules/,
              loader: 'awesome-typescript-loader',
              options: {
                configFileName: path.join(__dirname, 'tsconfig.json'),
              },
            },
          ],
        },
      }

      on('file:preprocessor', wp({ webpackOptions }))

      return config
    },
  },
}
