const webpackPreprocessor = require('@cypress/webpack-preprocessor')

const getDefaultWebpackOptions = (typescriptPath) => {
  return {
    mode: 'development',
    module: {
      rules: [{
        test: /\.jsx?$/,
        exclude: [/node_modules/],
        use: [{
          loader: require.resolve('babel-loader'),
          options: {
            plugins: [
              '@babel/plugin-transform-modules-commonjs',
              '@babel/plugin-proposal-class-properties',
              '@babel/plugin-proposal-object-rest-spread',
              '@babel/plugin-transform-runtime',
            ].map(require.resolve),
            presets: [
              '@babel/preset-env',
              '@babel/preset-react',
            ].map(require.resolve),
          },
        }],
      }, {
        test: /\.coffee$/,
        exclude: [/node_modules/],
        loader: require.resolve('coffee-loader'),
      }, {
        test: /\.tsx?$/,
        exclude: [/node_modules/],
        use: [
          {
            loader: require.resolve('ts-loader'),
            options: {
              transpileOnly: true,
              compiler: typescriptPath || 'typescript',
            },
          },
        ],
      }],
    },
  }
}

const preprocessor = (options) => {
  options.webpackOptions = options.webpackOptions || getDefaultWebpackOptions(options.typescript)

  return webpackPreprocessor(options)
}

preprocessor.defaultOptions = {
  webpackOptions: getDefaultWebpackOptions(),
  watchOptions: {},
}

module.exports = preprocessor
