const path = require('path')
const webpackPreprocessor = require('@cypress/webpack-preprocessor')

const getCompilerOptions = (file) => {
  const ext = file ? path.extname(file.filePath) : undefined
  const options = {
    esModuleInterop: true,
    inlineSourceMap: true,
    inlineSources: true,
    downlevelIteration: true,
  }

  if (ext === '.tsx' || ext === '.jsx' || ext === '.js') {
    options.jsx = 'react'
  }

  return options
}

const getDefaultWebpackOptions = (options = {}, file) => {
  return {
    mode: 'development',
    node: {
      global: true,
      __filename: true,
      __dirname: true,
    },
    module: {
      rules: [{
        test: /\.jsx?$/,
        exclude: [/node_modules/],
        use: [{
          loader: require.resolve('babel-loader'),
          options: {
            plugins: [
              ...[
                'babel-plugin-add-module-exports',
                '@babel/plugin-proposal-class-properties',
                '@babel/plugin-proposal-object-rest-spread',
              ].map(require.resolve),
              [require.resolve('@babel/plugin-transform-runtime'), {
                absoluteRuntime: path.dirname(require.resolve('@babel/runtime/package')),
              }],
            ],
            presets: [
              [require.resolve('@babel/preset-env'), { modules: 'commonjs' }],
              require.resolve('@babel/preset-react'),
            ],
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
              compiler: options.typescript || 'typescript',
              compilerOptions: getCompilerOptions(file),
              // disable tsconfig-loading by loading an empty one
              configFile: require.resolve('./empty-tsconfig'),
              logLevel: 'error',
              silent: true,
              transpileOnly: true,
            },
          },
        ],
      }],
    },
    resolve: {
      extensions: ['.js', '.json', '.jsx', '.ts', '.tsx', '.coffee'],
    },
  }
}

const preprocessor = (options = {}) => {
  return (file) => {
    options.webpackOptions = options.webpackOptions || getDefaultWebpackOptions(options, file)

    return webpackPreprocessor(options)(file)
  }
}

preprocessor.defaultOptions = {
  webpackOptions: getDefaultWebpackOptions(),
  watchOptions: {},
}

// for testing purposes, but do not add this to the typescript interface
preprocessor.__reset = webpackPreprocessor.__reset

module.exports = preprocessor
