const path = require('path')
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
              ...[
                '@babel/plugin-transform-modules-commonjs',
                '@babel/plugin-proposal-class-properties',
                '@babel/plugin-proposal-object-rest-spread',
              ].map(require.resolve),
              [require.resolve('@babel/plugin-transform-runtime'), {
                absoluteRuntime: path.dirname(require.resolve('@babel/runtime/package')),
              }],
            ],
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
              compiler: typescriptPath || 'typescript',
              compilerOptions: {
                esModuleInterop: true,
                inlineSourceMap: true,
                inlineSources: true,
                downlevelIteration: true,
              },
              logLevel: 'error',
              silent: true,
              transpileOnly: true,
            },
          },
        ],
      }],
    },
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.coffee'],
    },
  }
}

const preprocessor = (options = {}) => {
  options.webpackOptions = options.webpackOptions || getDefaultWebpackOptions(options.typescript)

  return webpackPreprocessor(options)
}

preprocessor.defaultOptions = {
  webpackOptions: getDefaultWebpackOptions(),
  watchOptions: {},
}

// for testing purposes, but do not add this to the typescript interface
preprocessor.__reset = webpackPreprocessor.__reset

module.exports = preprocessor
