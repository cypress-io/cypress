import chalk from 'chalk'
import { CleanWebpackPlugin } from 'clean-webpack-plugin'
import webpack from 'webpack'
// @ts-ignore
import LiveReloadPlugin from 'webpack-livereload-plugin'

// @ts-ignore
import sassGlobImporter = require('node-sass-glob-importer')
import HtmlWebpackPlugin = require('html-webpack-plugin')
import MiniCSSExtractWebpackPlugin = require('mini-css-extract-plugin')

const env = process.env.NODE_ENV === 'production' ? 'production' : 'development'
const args = process.argv.slice(2)
const liveReloadEnabled = !(args.includes('--no-livereload') || process.env.NO_LIVERELOAD)
const watchModeEnabled = args.includes('--watch') || args.includes('-w')

// opt out of livereload with arg --no-livereload
// eslint-disable-next-line no-console
if (liveReloadEnabled && watchModeEnabled) console.log(chalk.gray(`\nLive Reloading is enabled. use ${chalk.bold('--no-livereload')} to disable`))

process.env.NODE_ENV = env

// @ts-ignore
const evalDevToolPlugin = new webpack.EvalDevToolModulePlugin({
  moduleFilenameTemplate: 'cypress://[namespace]/[resource-path]',
  // TODO: changed [hash] to [contenthash] @see https://webpack.js.org/migrate/5/#clean-up-configuration
  fallbackModuleFilenameTemplate: 'cypress://[namespace]/[resourcePath]?[hash]',
})

evalDevToolPlugin.evalDevToolPlugin = true

const optimization = {
  usedExports: true,
  providedExports: true,
  sideEffects: true,
  // TODO: remove chunkIds & moduleIds @see https://webpack.js.org/migrate/5/#clean-up-configuration
  chunkIds: 'named',
  moduleIds: 'named',
  removeAvailableModules: true,
  mergeDuplicateChunks: true,
  flagIncludedChunks: true,
  removeEmptyChunks: true,
}

const stats = {
  errors: true,
  warnings: true,
  all: false,
  builtAt: true,
  colors: true,
  modules: true,
  excludeModules: /(main|test-entry).scss/,
  timings: true,
}

const ignoreWarnings = [/node_modules\/mocha\/lib\/mocha.js/]

function makeSassLoaders ({ modules }: { modules: boolean }) {
  const exclude = [/node_modules/]

  if (!modules) exclude.push(/\.modules?\.s[ac]ss$/i)

  return {
    test: modules ? /\.modules?\.s[ac]ss$/i : /\.s[ac]ss$/i,
    exclude,
    enforce: 'pre',
    use: [
      {
        loader: require.resolve('css-modules-typescript-loader'),
        options: {
          modules: true,
          mode: process.env.CI ? 'verify' : 'emit',
        },
      },
      {
        loader: require.resolve('css-loader'),
        options: {
          // sourceMap: true,
          // esModule: false,
          modules,
        },
      }, // translates CSS into CommonJS
      {
        loader: require.resolve('postcss-loader'),
        options: {
          postcssOptions: {
            plugins: [
              require('autoprefixer')({ overrideBrowserslist: ['last 2 versions'], cascade: false }),
            ],
          },
        },
      },
      {
        loader: require.resolve('resolve-url-loader'),
      },
      {
        loader: require.resolve('sass-loader'),
        options: {
          implementation: require('sass'),
          sourceMap: true,
          sassOptions: {
            importer: sassGlobImporter(),
          },
        },
      }, // compiles Sass to CSS, using Node Sass by default
    ],
  }
}

// the chrome version should be synced with
// npm/webpack-batteries-included-preprocessor/index.js and
// packages/server/lib/browsers/chrome.ts
const babelPresetEnvConfig = [require.resolve('@babel/preset-env'), { targets: { 'chrome': '64' } }]
const babelPresetTypeScriptConfig = [require.resolve('@babel/preset-typescript'), { allowNamespaces: true }]

export const getCommonConfig = () => {
  const commonConfig = {
    mode: 'none',
    ignoreWarnings,
    resolve: {
      extensions: ['.ts', '.js', '.jsx', '.tsx', '.scss', '.json'],
      // see https://gist.github.com/ef4/d2cf5672a93cf241fd47c020b9b3066a for polyfill migration details
      fallback: {
        Buffer: require.resolve('buffer/'),
        child_process: false,
        fs: false,
        module: false,
        net: false,
        os: require.resolve('os-browserify/browser'),
        path: require.resolve('path-browserify'),
        process: require.resolve('process/browser'),
        stream: require.resolve('stream-browserify'),
        tls: false,
        url: require.resolve('url/'),
      },
    },

    stats,
    optimization,

    module: {
      rules: [
        {
          test: /\.(ts|js|jsx|tsx)$/,
          exclude: /node_modules/,
          use: {
            loader: require.resolve('babel-loader'),
            options: {
              plugins: [
                // "istanbul",
                [require.resolve('@babel/plugin-proposal-decorators'), { legacy: true }],
                [require.resolve('@babel/plugin-proposal-class-properties'), { loose: true }],
              ],
              presets: [
                babelPresetEnvConfig,
                require.resolve('@babel/preset-react'),
                babelPresetTypeScriptConfig,
              ],
              babelrc: false,
            },
          },
        },
        {
          test: /\.s?css$/,
          exclude: /node_modules/,
          use: [
            { loader: MiniCSSExtractWebpackPlugin.loader },
          ],
        },
        makeSassLoaders({ modules: false }),
        makeSassLoaders({ modules: true }),
        {
          test: /\.(eot|svg|ttf|woff|woff2)$/,
          use: [
            {
              loader: require.resolve('file-loader'),
              options: {
                name: './fonts/[name].[ext]',
              },
            },
          ],
          // TODO: replaces file-loader. @see https://webpack.js.org/guides/asset-modules/
          // type: 'asset/resource',
        },
        {
          test: /\.(png|gif)$/,
          use: [
            {
              loader: require.resolve('file-loader'),
              options: {
                name: './fonts/[name].[ext]',
              },
            },
          ],
          // TODO: replaces file-loader. @see https://webpack.js.org/guides/asset-modules/
          // type: 'asset/resource',
        },
        {
          test: /\.wasm$/,
          type: 'javascript/auto',
          use: [
            {
              loader: require.resolve('arraybuffer-loader'),
            },
          ],
        },
      ],
    },

    plugins: [
      new MiniCSSExtractWebpackPlugin(),

      // Enable source maps / eval maps
      // 'EvalDevtoolModulePlugin' is used in development
      //    because it is fast and maps to filenames while showing compiled source
      // 'SourceMapDevToolPlugin' is used in production for the same reasons as 'eval', but it
      //    shows full source and does not cause crossorigin errors like 'eval' (in Chromium < 63)
      // files will be mapped like: `cypress://../driver/cy/commands/click.coffee`

      // other sourcemap options:
      // [new webpack.SourceMapDevToolPlugin({
      //   moduleFilenameTemplate: 'cypress://[namespace]/[resource-path]',
      //   fallbackModuleFilenameTemplate: 'cypress://[namespace]/[resourcePath]?[hash]'
      // })] :

      (env === 'production'
        ? new webpack.DefinePlugin({ 'process.env.NODE_ENV': JSON.stringify('production') })
        : evalDevToolPlugin
      ),
      // Cypress needs access globally to the buffer and process objects.
      // These were polyfilled by webpack in v4 and no longer are in v5.
      // To work around this, we provide the process and buffer and globals into the webpack bundle.
      // @see https://gist.github.com/ef4/d2cf5672a93cf241fd47c020b9b3066a#polyfilling-globals
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
        process: 'process/browser',
      }),
      ...(liveReloadEnabled ? [new LiveReloadPlugin({ appendScriptTag: true, port: 0, hostname: 'localhost', protocol: 'http' })] : []),
    ],

    cache: true,
  }

  return commonConfig
}

// eslint-disable-next-line @cypress/dev/arrow-body-multiline-braces
export const getSimpleConfig = () => ({
  ignoreWarnings,
  resolve: {
    extensions: ['.js', '.ts', '.json'],
    // see https://gist.github.com/ef4/d2cf5672a93cf241fd47c020b9b3066a for polyfill migration details
    fallback: {
      Buffer: require.resolve('buffer/'),
      child_process: false,
      fs: false,
      module: false,
      net: false,
      os: require.resolve('os-browserify/browser'),
      path: require.resolve('path-browserify'),
      process: require.resolve('process/browser'),
      stream: require.resolve('stream-browserify'),
      tls: false,
      url: require.resolve('url/'),
    },
  },

  stats,
  optimization,

  cache: true,

  plugins: [
    new webpack.DefinePlugin({
      // The main & cross-origin injection code in @packages/runner needs
      // access to the process.env.NODE_DEBUG variable.
      // Since the injection lives inside html, it makes most sense to just use the
      // DefinePlugin to push the value into the bundle instead of providing the whole process
      'process.env.NODE_DEBUG': JSON.stringify('process.env.NODE_DEBUG'),
    }),
  ],
  module: {
    rules: [
      {
        test: /\.(js|ts)$/,
        exclude: /node_modules/,
        use: {
          loader: require.resolve('babel-loader'),
          options: {
            plugins: [
              [require.resolve('@babel/plugin-proposal-class-properties'), { loose: true }],
            ],
            presets: [
              babelPresetEnvConfig,
              babelPresetTypeScriptConfig,
            ],
            babelrc: false,
          },
        },
      },
      // FIXME: we don't actually want or need wasm support in the
      // cross origin bundle that uses this config, but we need to refactor
      // the driver so that it doesn't load the wasm code in
      // packages/driver/src/cypress/source_map_utils.js when creating
      // the cross origin bundle. for now, this is necessary so the build
      // doesn't fail
      // https://github.com/cypress-io/cypress/issues/19888
      {
        test: /\.wasm$/,
        type: 'javascript/auto',
        use: [
          {
            loader: require.resolve('arraybuffer-loader'),
          },
        ],
      },
    ],
  },
})

export { HtmlWebpackPlugin }

export function getCopyWebpackPlugin () {
  return require('copy-webpack-plugin')
}

export function getCleanWebpackPlugin () {
  return CleanWebpackPlugin
}
