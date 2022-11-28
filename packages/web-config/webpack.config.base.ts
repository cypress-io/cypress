import chalk from 'chalk'
import CleanWebpackPlugin from 'clean-webpack-plugin'
const webpack = require('webpack')
import { RuleSetRule, DefinePlugin, Configuration } from 'webpack'
// @ts-ignore
import LiveReloadPlugin from 'webpack-livereload-plugin'

// @ts-ignore
import sassGlobImporter = require('node-sass-glob-importer')
import HtmlWebpackPlugin = require('html-webpack-plugin')
import MiniCSSExtractWebpackPlugin = require('mini-css-extract-plugin')
// import { RuleSetRule } from 'webpack'

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
  fallbackModuleFilenameTemplate: 'cypress://[namespace]/[resourcePath]?[hash]',
})

evalDevToolPlugin.evalDevToolPlugin = true

const optimization = {
  usedExports: true,
  providedExports: true,
  sideEffects: true,
  namedChunks: true,
  namedModules: true,
  removeAvailableModules: true,
  mergeDuplicateChunks: true,
  flagIncludedChunks: true,
  removeEmptyChunks: true,
}

const stats = {
  errors: true,
  warningsFilter: /node_modules\/mocha\/lib\/mocha.js/,
  warnings: true,
  all: false,
  builtAt: true,
  colors: true,
  modules: true,
  maxModules: 20,
  excludeModules: /(main|test-entry).scss/,
  timings: true,
}

function makeSassLoaders ({ modules }: { modules: boolean }): RuleSetRule {
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
          modules,
        },
      }, // translates CSS into CommonJS
      {
        loader: require.resolve('postcss-loader'),
        options: {
          plugins: [
            require('autoprefixer')({ overrideBrowserslist: ['last 2 versions'], cascade: false }),
          ],
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
  const commonConfig: Configuration = {
    mode: 'none',
    node: {
      fs: 'empty',
      child_process: 'empty',
      net: 'empty',
      tls: 'empty',
      module: 'empty',
    },
    resolve: {
      extensions: ['.ts', '.js', '.jsx', '.tsx', '.scss', '.json'],
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
        },
        {
          test: /\.(png|gif)$/,
          use: [
            {
              loader: require.resolve('file-loader'),
              options: {
                name: './img/[name].[ext]',
              },
            },
          ],
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
      new CleanWebpackPlugin({ cleanStaleWebpackAssets: false }),
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

      ...[
        (env === 'production'
          ? new DefinePlugin({ 'process.env.NODE_ENV': JSON.stringify('production') })
          : evalDevToolPlugin
        ),
      ],
      ...(liveReloadEnabled ? [new LiveReloadPlugin({ appendScriptTag: 'true', port: 0, hostname: 'localhost', protocol: 'http' })] : []),
    ],

    cache: true,
  }

  return commonConfig
}

// eslint-disable-next-line @cypress/dev/arrow-body-multiline-braces
export const getSimpleConfig = () => ({
  node: {
    fs: 'empty',
    child_process: 'empty',
    net: 'empty',
    tls: 'empty',
    module: 'empty',
  },
  resolve: {
    extensions: ['.js', '.ts', '.json'],
  },

  stats,
  optimization,

  cache: true,

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

  plugins: [
    new CleanWebpackPlugin({ cleanStaleWebpackAssets: false }),
  ],
})

export { HtmlWebpackPlugin }

export function getCopyWebpackPlugin () {
  return require('copy-webpack-plugin')
}
