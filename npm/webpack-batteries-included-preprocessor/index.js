const path = require('path')
const webpackPreprocessor = require('@cypress/webpack-preprocessor')

const hasTsLoader = (rules) => {
  return rules.some((rule) => {
    if (!rule.use || !Array.isArray(rule.use)) return false

    return rule.use.some((use) => {
      return use.loader && use.loader.includes('ts-loader')
    })
  })
}

const addTypeScriptConfig = (file, options) => {
  // shortcut if we know we've already added typescript support
  if (options.__typescriptSupportAdded) return options

  const webpackOptions = options.webpackOptions
  const rules = webpackOptions.module && webpackOptions.module.rules

  // if there are no rules defined or it's not an array, we can't add to them
  if (!rules || !Array.isArray(rules)) return options

  // if we find ts-loader configured, don't add it again
  if (hasTsLoader(rules)) return options

  const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin')
  // node will try to load a projects tsconfig.json instead of the node
  // package using require('tsconfig'), so we alias it as 'tsconfig-package'
  const configFile = require('tsconfig-package').findSync(path.dirname(file.filePath))

  webpackOptions.module.rules.push({
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

  webpackOptions.resolve.extensions = webpackOptions.resolve.extensions.concat(['.ts', '.tsx'])
  webpackOptions.resolve.plugins = [new TsconfigPathsPlugin({
    configFile,
    silent: true,
  })]

  options.__typescriptSupportAdded = true

  return options
}

/**
 * Config yarn pnp plugin for webpack 4
 * @param {*} file file to be processed
 * @param {*} options
 */
const addYarnPnpConfig = (file, options) => {
  const { makeResolver } = require('pnp-webpack-plugin/resolver')
  const findPnpApi = require('module').findPnpApi

  if (findPnpApi && file.filePath) {
    const pnpapi = findPnpApi(file.filePath)

    if (pnpapi) {
      const PnpPlugin = {
        apply: makeResolver({ pnpapi }),
      }

      options.webpackOptions.resolve.plugins.push(PnpPlugin)
    }
  }
}

const getDefaultWebpackOptions = () => {
  return {
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
        exclude: [/browserslist/],
        type: 'javascript/auto',
      }, {
        test: /(\.jsx?|\.mjs)$/,
        exclude: [/node_modules/, /browserslist/],
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
              // the chrome version should be synced with
              // packages/web-config/webpack.config.base.ts and
              // packages/server/lib/browsers/chrome.ts
              [require.resolve('@babel/preset-env'), { modules: 'commonjs', targets: { 'chrome': '64' } }],
              require.resolve('@babel/preset-react'),
            ],
            configFile: false,
            babelrc: false,
          },
        }],
      }, {
        test: /\.coffee$/,
        exclude: [/node_modules/, /browserslist/],
        loader: require.resolve('coffee-loader'),
      }],
    },
    resolve: {
      extensions: ['.js', '.json', '.jsx', '.mjs', '.coffee'],
      fallback: {
        child_process: false,
        cluster: false,
        console: false,
        constants: require.resolve('constants-browserify'),
        crypto: require.resolve('crypto-browserify'),
        dgram: false,
        dns: false,
        domain: require.resolve('domain-browser'),
        fs: false,
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        http2: false,
        inspector: false,
        module: false,
        net: false,
        os: require.resolve('os-browserify/browser'),
        perf_hooks: false,
        path: require.resolve('path-browserify'),
        readline: false,
        repl: false,
        stream: require.resolve('stream-browserify'),
        sys: require.resolve('util/'),
        timers: require.resolve('timers-browserify'),
        tls: false,
        tty: require.resolve('tty-browserify'),
        url: require.resolve('url/'),
        vm: require.resolve('vm-browserify'),
        zlib: require.resolve('browserify-zlib'),
      },
      plugins: [],
    },
  }
}

const typescriptExtensionRegex = /\.tsx?$/

const preprocessor = (options = {}) => {
  return (file) => {
    if (!options.typescript && typescriptExtensionRegex.test(file.filePath)) {
      return Promise.reject(new Error(`You are attempting to run a TypeScript file, but do not have TypeScript installed. Ensure you have 'typescript' installed to enable TypeScript support.\n\nThe file: ${file.filePath}`))
    }

    options.webpackOptions = options.webpackOptions || getDefaultWebpackOptions()

    if (options.typescript) {
      options = addTypeScriptConfig(file, options)
    }

    if (process.versions.pnp) {
      // pnp path
      addYarnPnpConfig(file, options)
    }

    return webpackPreprocessor(options)(file)
  }
}

preprocessor.defaultOptions = {
  webpackOptions: getDefaultWebpackOptions(),
  watchOptions: {},
}

preprocessor.getFullWebpackOptions = (filePath, typescript) => {
  const webpackOptions = getDefaultWebpackOptions()

  if (typescript) {
    return addTypeScriptConfig({ filePath }, { typescript, webpackOptions }).webpackOptions
  }

  return webpackOptions
}

// for testing purposes, but do not add this to the typescript interface
preprocessor.__reset = webpackPreprocessor.__reset

module.exports = preprocessor
