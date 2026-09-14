module.exports = {
  'retries': null,
  'e2e': {
    'supportFile': false,
    setupNodeEvents (on, config) {
      const wp = require('@cypress/webpack-preprocessor')

      const webpackOptions = {
        resolve: {
          extensions: ['.ts', '.js'],
        },
        module: {
          rules: [
            {
              test: /\.tsx?$/,
              exclude: [/node_modules/],
              use: {
                loader: 'ts-loader',
                options: {
                  compilerOptions: {
                    // act as if this option is off
                    sourceMap: false,
                  },
                },
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
