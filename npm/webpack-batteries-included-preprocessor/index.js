const path = require('path')
const fs = require('fs-extra')
const JSON5 = require('json5')
const webpack = require('webpack')
const Debug = require('debug')
const webpackPreprocessor = require('@cypress/webpack-preprocessor')

const debug = Debug('cypress:webpack-batteries-included-preprocessor')

const hasTsLoader = (rules) => {
  return rules.some((rule) => {
    if (!rule.use || !Array.isArray(rule.use)) return false

    return rule.use.some((use) => {
      return use.loader && use.loader.includes('ts-loader')
    })
  })
}

const getTSCompilerOptionsForUser = (configFilePath) => {
  const compilerOptions = {
    sourceMap: false,
    inlineSourceMap: true,
    inlineSources: true,
    downlevelIteration: true,
  }

  if (!configFilePath) {
    return compilerOptions
  }

  try {
    // If possible, try to read the user's tsconfig.json and see if sourceMap is configured
    // eslint-disable-next-line no-restricted-syntax
    const tsconfigJSON = fs.readFileSync(configFilePath, 'utf8')
    // file might have trailing commas, new lines, etc. JSON5 can parse those correctly
    const parsedJSON = JSON5.parse(tsconfigJSON)

    // if the user has sourceMap's configured, set the option to true and turn off inlineSourceMaps
    if (parsedJSON?.compilerOptions?.sourceMap) {
      compilerOptions.sourceMap = true
      compilerOptions.inlineSourceMap = false
      compilerOptions.inlineSources = false
    }
  } catch (e) {
    debug(`error in getTSCompilerOptionsForUser. Returning default...`, e)
  } finally {
    return compilerOptions
  }
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
  // package using require('tsconfig'), so we alias it as 'tsconfig-aliased-for-wbip'
  const configFile = require('tsconfig-aliased-for-wbip').findSync(path.dirname(file.filePath))

  const compilerOptions = getTSCompilerOptionsForUser(configFile)

  webpackOptions.module.rules.push({
    test: /\.tsx?$/,
    exclude: [/node_modules/],
    use: [
      {
        loader: require.resolve('ts-loader'),
        options: {
          compiler: options.typescript,
          compilerOptions,
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
                '@babel/plugin-transform-class-properties',
                '@babel/plugin-transform-object-rest-spread',
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
    plugins: [
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
        // As of Webpack 5, a new option called resolve.fullySpecified, was added.
        // This option means that a full path, in particular to .mjs / .js files
        // in ESM packages must have the full path of an import specified.
        // Otherwise, compilation fails as this option defaults to true.
        // This means we need to adjust our global injections to always
        // resolve to include the full file extension if a file resolution is provided.
        // @see https://github.com/cypress-io/cypress/issues/27599
        // @see https://webpack.js.org/configuration/module/#resolvefullyspecified
        process: 'process/browser.js',
      }),
    ],
    resolve: {
      extensions: ['.js', '.json', '.jsx', '.mjs', '.coffee'],
      fallback: {
        assert: require.resolve('assert/'),
        buffer: require.resolve('buffer/'),
        child_process: false,
        cluster: false,
        console: false,
        constants: require.resolve('constants-browserify'),
        crypto: require.resolve('crypto-browserify'),
        dgram: false,
        dns: false,
        domain: require.resolve('domain-browser'),
        events: require.resolve('events/'),
        fs: false,
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        http2: false,
        inspector: false,
        module: false,
        net: false,
        os: require.resolve('os-browserify/browser'),
        path: require.resolve('path-browserify'),
        perf_hooks: false,
        punycode: require.resolve('punycode/'),
        process: require.resolve('process/browser.js'),
        querystring: require.resolve('querystring-es3'),
        readline: false,
        repl: false,
        stream: require.resolve('stream-browserify'),
        string_decoder: require.resolve('string_decoder/'),
        sys: require.resolve('util/'),
        timers: require.resolve('timers-browserify'),
        tls: false,
        tty: require.resolve('tty-browserify'),
        url: require.resolve('url/'),
        util: require.resolve('util/'),
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
