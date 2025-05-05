const path = require('path')
const Debug = require('debug')
const webpackPreprocessor = require('@cypress/webpack-preprocessor')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin

const debug = Debug('cypress:webpack-batteries-included-preprocessor')
const WBADebugNamespace = 'cypress-verbose:webpack-batteries-included-preprocessor:bundle-analyzer'

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
  if (hasTsLoader(rules)) {
    debug('ts-loader already configured, not adding again')

    return options
  }

  const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin')
  // node will try to load a projects tsconfig.json instead of the node

  const getTsConfig = require('get-tsconfig')

  // returns null if tsconfig cannot be found in the path/parent hierarchy
  const configFile = getTsConfig.getTsconfig(file.filePath)

  configFile ? debug(`found user tsconfig.json at ${configFile?.path} with compilerOptions: ${JSON.stringify(configFile?.config?.compilerOptions)}`) : debug('no user tsconfig.json found')

  webpackOptions.module.rules.push({
    test: /\.tsx?$/,
    exclude: [/node_modules/],
    use: [
      {
        loader: require.resolve('ts-loader'),
        options: {
          compiler: options.typescript,
          logLevel: 'error',
          silent: true,
          transpileOnly: true,
        },
      },
    ],
  })

  webpackOptions.resolve.extensions = webpackOptions.resolve.extensions.concat(['.ts', '.tsx'])
  webpackOptions.resolve.plugins = [new TsconfigPathsPlugin({
    configFile: configFile?.path,
    silent: true,
  })]

  options.__typescriptSupportAdded = true

  return options
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
      // If the user is trying to debug their bundle, we'll add the BundleAnalyzerPlugin
      // to see the size of the support file (first bundle when running `cypress open`)
      // and spec files (subsequent bundles when running `cypress open`)
      ...(Debug.enabled(WBADebugNamespace) ? [new BundleAnalyzerPlugin()] : []),
    ],
    resolve: {
      extensions: ['.js', '.json', '.jsx', '.mjs', '.coffee'],
      fallback: {
        assert: false,
        buffer: false,
        child_process: false,
        cluster: false,
        console: false,
        constants: false,
        crypto: false,
        dgram: false,
        dns: false,
        domain: false,
        events: false,
        fs: false,
        http: false,
        https: false,
        http2: false,
        inspector: false,
        module: false,
        net: false,
        os: false,
        path: false,
        perf_hooks: false,
        punycode: false,
        process: false,
        querystring: false,
        readline: false,
        repl: false,
        stream: false,
        string_decoder: false,
        sys: false,
        timers: false,
        tls: false,
        tty: false,
        url: false,
        util: false,
        vm: false,
        zlib: false,
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
