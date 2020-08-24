const path = require('path')
const webpackPreprocessor = require('@cypress/webpack-preprocessor')

const getDefaultWebpackOptions = (file, options = {}) => {
  const config = {
    mode: 'development',
    node: {
      global: true,
      __filename: true,
      __dirname: true,
    },
    module: {
      rules: [{
        test: /\.mjs$/,
        include: /node_modules/,
        type: 'javascript/auto',
      }, {
        test: /(\.jsx?|\.mjs)$/,
        exclude: [/node_modules/],
        type: 'javascript/auto',
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
      }],
    },
    resolve: {
      extensions: ['.js', '.json', '.jsx', '.mjs', '.coffee'],
      alias: {
        'child_process': require.resolve('./empty'),
        'cluster': require.resolve('./empty'),
        'console': require.resolve('./empty'),
        'dgram': require.resolve('./empty'),
        'dns': require.resolve('./empty'),
        'fs': require.resolve('./empty'),
        'http2': require.resolve('./empty'),
        'inspector': require.resolve('./empty'),
        'module': require.resolve('./empty'),
        'net': require.resolve('./empty'),
        'perf_hooks': require.resolve('./empty'),
        'readline': require.resolve('./empty'),
        'repl': require.resolve('./empty'),
        'tls': require.resolve('./empty'),
      },
    },
  }

  if (options.typescript) {
    const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin')
    const configFile = require('tsconfig').findSync(path.dirname(file.filePath))

    config.module.rules.push({
      test: /\.tsx?$/,
      exclude: [/node_modules/],
      use: [
        {
          loader: require.resolve('ts-loader'),
          options: {
            compiler: options.typescript,
            compilerOptions: {
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
    })

    config.resolve.extensions = config.resolve.extensions.concat(['.ts', '.tsx'])
    config.resolve.plugins = [new TsconfigPathsPlugin({
      configFile,
      silent: true,
    })]
  }

  return config
}

const typescriptExtensionRegex = /\.tsx?$/

const preprocessor = (options = {}) => {
  return (file) => {
    if (!options.typescript && typescriptExtensionRegex.test(file.filePath)) {
      return Promise.reject(new Error(`You are attempting to run a TypeScript file, but do not have TypeScript installed. Ensure you have 'typescript' installed to enable TypeScript support.\n\nThe file: ${file.filePath}`))
    }

    options.webpackOptions = options.webpackOptions || getDefaultWebpackOptions(file, options)

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
