const fs = require('fs')
const json5 = require('json5')
const StartServerWebpackPlugin = require('razzle-start-server-webpack-plugin')
const path = require('path')
const webpackNodeExternals = require('webpack-node-externals')

/**
 * @return {import('webpack').Configuration}
 */
module.exports = (opts, config) => {
  /**
   * @type {import('webpack').Configuration['plugins']}
   */
  const plugins = []

  if (opts.WEBPACK_SERVE) {
    plugins.push(
      new StartServerWebpackPlugin({
        verbose: false,
        // debug: true,
        once: true,
        entryName: 'app',
        // nodeArgs: ['--inspect-brk'],
      }),
    )
  }

  /**
   * @type {import('webpack').Configuration}
   */
  return {
    mode: 'development',
    devtool: false,
    node: {
      global: true,
      __filename: false,
      __dirname: true,
    },
    target: 'node',
    // externalsPresets: { electron: true },
    externals: [
      // Needs to be global
      'graphql',
      'typescript',

      // Native modules, or ones with binaries we don't want to worry about
      'registry-js',
      'fsevents',
      'fluent-ffmpeg',

      // Others with errors, why do we even have some of these??
      'cson-parser',
      'coffeescript',
      'jsonlint',
      'konfig',

      // require.extensions use
      'tsconfig-paths',
      'ts-node',
      'ts-loader',

      // Things we don't want to bundle
      'esbuild',
      'bundle-require',
      'electron-packager',
      'marionette-client',

      // Things with css
      'errorhandler',

      // Optional / missing deps
      // 'utf-8-validate',
      'prettier',
      'original-fs',
      'osx-temperature-sensor',

      // Too many expression dependencies
      'express',
      'firefox-profile',
      'nexus',
      '@ffmpeg-installer/ffmpeg',
      /nexus\/dist\/utils/,

      // Skip the dev-servers / bundlers for now
      // '@cypress/vite-dev-server',
      // '@cypress/webpack-dev-server',
      // '@cypress/webpack-batteries-included-preprocessor',

      // What is the deal with this package:
      'electron',
      // '@packages/electron',

      function (context, request, callback) {
        if (request.startsWith('@cypress/')) {
          return callback(null, `commonjs ${request}`)
        }

        return callback()
      },
    ],
    // externalsType: 'commonjs',
    // experiments: {
    //   // outputModule: true,
    // },
    output: {
      path: path.join(__dirname, '.bundle'),
      libraryTarget: 'commonjs',
      library: ['server'],
      // libraryExport: ['server'],
      // module: true,
      // chunkFormat: 'commonjs',
      // chunkLoading: 'require',
      // libraryExport: 'devmonster',
      // libraryTarget: 'commonjs',
    },
    // optimization: {
    //   splitChunks: {
    //     cacheGroups: {
    //       commons: {
    //         test: /node_modules/,
    //         filename: 'node_vendor.js',
    //         chunks: 'all',
    //       },
    //     },
    //   },
    //   mergeDuplicateChunks: true,
    // },
    resolve: {
      extensions: ['.ts', '.js', '.cjs', '.mjs', '.json', '.wasm'],
      // Prefer commonjs when possible
      mainFields: ['main', 'module', 'browser'],
    },
    entry: {
      server: './packages/server/run.js',
      child: './packages/server/lib/plugins/child/require_async_child.js',
    },
    context: __dirname,
    devServer: {
      static: '.app',
      devMiddleware: {
        writeToDisk: true,
        stats: 'errors-only',
      },
      // compress: true,
      port: 9000,
      hot: true,
    },
    plugins,
    module: {
      rules: [
        {
          test: /\.(m|j|t)s$/,
          loader: 'esbuild-loader',
          options: {
            minify: false,
            loader: 'ts',
            target: 'node10',
            tsconfigRaw: {
              allowSyntheticDefaultImports: true,
              esModuleInterop: true,
            },
            // json5.parse(
            //   fs.readFileSync('./packages/ts/tsconfig.json', 'utf8'),
            // ),
          },
        },
        {
          test: /\.graphql$/,
          loader: 'raw-loader',
        },
      ],
    },
  }
}
