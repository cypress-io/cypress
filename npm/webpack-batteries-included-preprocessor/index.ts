import path from 'path'
import Debug from 'debug'
import type { EventEmitter } from 'events'
import getTsConfig from 'get-tsconfig'
import webpack from 'webpack'
import webpackPreprocessor from '@cypress/webpack-preprocessor'
import semver from 'semver'
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer'

const debug = Debug('cypress:webpack-batteries-included-preprocessor')
const WBADebugNamespace = 'cypress-verbose:webpack-batteries-included-preprocessor:bundle-analyzer'

// NOTE: these types are duplicated from @cypress/webpack-preprocessor as we are unable to currently export them from the main entry.
interface FileEvent extends EventEmitter {
  filePath: string
  outputPath: string
  shouldWatch: boolean
}

class TsConfigNotFoundError extends Error {
  constructor () {
    super('No tsconfig.json found. ts-loader needs a tsconfig.json file to work. Please add one to your project in either the root or the cypress directory.')
    this.name = 'TsConfigNotFoundError'
  }
}

class TypeScriptNotFoundError extends Error {
  constructor () {
    super('No typescript installable was found. ts-loader needs a version of typescript to work properly. Please install typescript in your project\'s package.json.')
    this.name = 'TypeScriptNotFoundError'
  }
}

const typescriptExtensionRegex = /\.m?tsx?$/

const hasTsLoader = (rules: any[]) => {
  return rules.some((rule) => {
    if (!rule.use || !Array.isArray(rule.use)) return false

    return rule.use.some((use: any) => {
      return use.loader && use.loader.match(/(^|[^a-zA-Z])ts-loader([^a-zA-Z]|$)/)
    })
  })
}

const addTypeScriptConfig = (file: { filePath: string }, options: {
  typescript?: string | boolean
  webpackOptions?: any
}) => {
  // returns null if tsconfig cannot be found in the path/parent hierarchy
  const configFile = getTsConfig.getTsconfig(file.filePath)

  if (!configFile && typescriptExtensionRegex.test(file.filePath)) {
    debug('no user tsconfig.json found. Throwing TsConfigNotFoundError')
    // @see https://github.com/cypress-io/cypress/issues/18938
    throw new TsConfigNotFoundError()
  }

  debug(`found user tsconfig.json at ${configFile?.path} with compilerOptions: ${JSON.stringify(configFile?.config?.compilerOptions)}`)

  let typeScriptPath: string | boolean | undefined | null = null

  try {
    if (options.typescript === true) {
      const configFileDirectory = path.dirname(configFile?.path ?? '')

      // attempt to resolve typescript from the user's tsconfig.json file / project directory
      typeScriptPath = require.resolve('typescript', { paths: [configFileDirectory] })
      options.typescript = typeScriptPath
    } else {
      typeScriptPath = options.typescript
    }

    debug(`using typescript found at ${typeScriptPath}`)
  } catch {
    debug('no user typescript found. Throwing TypeScriptNotFoundError')

    throw new TypeScriptNotFoundError()
  }
  // shortcut if we know we've already added typescript support
  // @ts-expect-error - not typed intentionally
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

  // tsx parses the moduleResolution default to node10 as well as moduleResolution="node" to node10
  // ts-loader struggles to validate the node10 moduleResolution option depending on the version of typescript used,
  // so we set it to node which is the same as node 10. @see https://www.typescriptlang.org/tsconfig/#moduleResolution.
  if (configFile?.config?.compilerOptions?.moduleResolution === 'node10') {
    configFile.config.compilerOptions.moduleResolution = 'node'
  }

  const tsVersion = webpackPreprocessor.getResolvedTypescriptVersion(typeof typeScriptPath === 'string' ? typeScriptPath : undefined)

  let isLessThanTs6
  let isGreaterThanOrEqualToTs6

  if (tsVersion && semver.valid(tsVersion)) {
    isLessThanTs6 = semver.lt(tsVersion, '6.0.0-0')
    isGreaterThanOrEqualToTs6 = !isLessThanTs6
  }

  // Use the v3 plugin for TS < 6 to remain passive; TS 6+ uses v4, which
  // tolerates the missing-baseUrl shape recommended by TypeScript 6+.
  const TsconfigPathsPlugin = isLessThanTs6
    ? require('tsconfig-paths-webpack-plugin-v3')
    : require('tsconfig-paths-webpack-plugin')

  webpackOptions.module.rules.push({
    test: typescriptExtensionRegex,
    exclude: [/node_modules/],
    use: [
      {
        loader: require.resolve('ts-loader'),
        options: {
          ...(isGreaterThanOrEqualToTs6 ? {
            configFile: configFile?.path,
          } : {}),
          compiler: typeScriptPath,
          ...(isLessThanTs6 ? {
            compilerOptions: configFile?.config?.compilerOptions,
          } : {}),
          logLevel: 'error',
          silent: true,
          transpileOnly: true,
        },
      },
    ],
  })

  webpackOptions.resolve.extensions = webpackOptions.resolve.extensions.concat(['.ts', '.tsx'])
  webpackOptions.resolve.extensionAlias = webpackOptions.resolve.extensionAlias || { '.js': ['.ts', '.js'], '.mjs': ['.mts', '.mjs'] }

  // Only register the paths plugin when we actually located a tsconfig.json.
  // tsconfig-paths-webpack-plugin v4 no longer early-returns when its internal
  // loadConfig fails, so passing an undefined configFile causes it to walk up
  // from process.cwd() and crash with "matchPath is not a function" on resolve.
  if (configFile?.path) {
    webpackOptions.resolve.plugins = [new TsconfigPathsPlugin({
      configFile: configFile.path,
      silent: true,
    })]
  }

  // @ts-expect-error - not typed intentionally
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
              ].map((plugin) => require.resolve(plugin)),
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

        // Due to Pnp compatibility issues, we want to make sure that we resolve to the 'process' library installed with the binary,
        // which should resolve on leaf app/packages/server/node_modules/@cypress/webpack-batteries-included-preprocessor and up the tree.
        // In other words, we want to resolve 'process' that is installed with cypress (or the package itself, i.e. @cypress/webpack-batteries-included-preprocessor)
        // and not in the user's node_modules directory as it may not exist.
        // @see https://github.com/cypress-io/cypress/issues/27947.
        process: require.resolve('process/browser.js'),
      }),
      // If the user is trying to debug their bundle, we'll add the BundleAnalyzerPlugin
      // to see the size of the support file (first bundle when running `cypress open`)
      // and spec files (subsequent bundles when running `cypress open`)
      ...(Debug.enabled(WBADebugNamespace) ? [new BundleAnalyzerPlugin()] : []),
    ],
    resolve: {
      extensions: ['.js', '.json', '.jsx', '.mjs', '.coffee'],
      fallback: {
        assert: false,
        buffer: require.resolve('buffer/'),
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
        os: require.resolve('os-browserify/browser'),
        path: require.resolve('path-browserify'),
        perf_hooks: false,
        punycode: false,
        process: require.resolve('process/browser.js'),
        querystring: false,
        readline: false,
        repl: false,
        stream: require.resolve('stream-browserify'),
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

const preprocessor = (options: {
  typescript?: string | boolean
  webpackOptions?: any
} = {}) => {
  return (file: FileEvent) => {
    if (!options.typescript && typescriptExtensionRegex.test(file.filePath)) {
      return Promise.reject(new Error(`You are attempting to run a TypeScript file, but do not have TypeScript installed. Ensure you have 'typescript' installed to enable TypeScript support.\n\nThe file: ${file.filePath}`))
    }

    options.webpackOptions = options.webpackOptions || getDefaultWebpackOptions()

    if (options.typescript) {
      options = addTypeScriptConfig(file, options)
    }

    // @ts-expect-error - typescript is casted back to a string | undefined inside addTypeScriptConfig
    return webpackPreprocessor(options)(file)
  }
}

preprocessor.defaultOptions = {
  webpackOptions: getDefaultWebpackOptions(),
  watchOptions: {},
}

preprocessor.getFullWebpackOptions = (filePath?: string, typescript?: string | boolean) => {
  const webpackOptions = getDefaultWebpackOptions()

  if (typescript && filePath) {
    return addTypeScriptConfig({ filePath }, { typescript, webpackOptions }).webpackOptions
  }

  return webpackOptions
}

// for testing purposes, but do not add this to the typescript interface
// @ts-expect-error - not typed intentionally
preprocessor.__reset = webpackPreprocessor.__reset

export = preprocessor
