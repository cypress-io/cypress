// const fs = require('fs')
// const json5 = require('json5')
const StartServerWebpackPlugin = require('razzle-start-server-webpack-plugin')
const path = require('path')
// const webpackNodeExternals = require('webpack-node-externals')

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
    mode: process.env.MINIFY_IND != null ? 'production' : 'development',
    devtool: false,
    node: {
      global: true,
      __filename: false,
      __dirname: true,
    },
    target: 'node',
    // externalsPresets: { electron: true },
    externals (context, request, callback) {
      // socket.io is patch-packaged in a way that we need to import the relative package,
      // we could likely force this better with an alias / fix the fact that we have multiple versions
      if (request.startsWith('@packages') || request.startsWith('.') || request.includes('socket.io')) {
        return callback()
      }

      if (request.endsWith('util/suppress_warnings') || request.endsWith('registerDir') || request.endsWith('/capture')) {
        // console.log({context, request})

        return callback(null, `commonjs ./${path.relative(__dirname, path.join(context, request.replace('@packages', '../../packages')))}`)
      }

      return callback(null, `commonjs ${request}`)
    },
    // externalsType: 'commonjs',
    // experiments: {
    //   // outputModule: true,
    // },
    output: {
      path: path.join(__dirname, 'packages', 'server'),
      libraryTarget: 'commonjs',
      library: ['server'],
      // libraryExport: ['server'],
      // module: true,
      // chunkFormat: 'commonjs',
      // chunkLoading: 'require',
      // libraryExport: 'devmonster',
      // libraryTarget: 'commonjs',
    },
    optimization: {
      usedExports: true,
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
          use: [
            {
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
          ],
        },
        {
          test: /\.graphql$/,
          loader: 'raw-loader',
        },
      ],
    },
  }
}
