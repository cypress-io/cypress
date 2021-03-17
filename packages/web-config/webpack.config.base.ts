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

function makeSassLoaders ({ modules }): RuleSetRule {
  const exclude = [/node_modules/]

  if (!modules) exclude.push(/\.modules?\.s[ac]ss$/i)

  return {
    test: modules ? /\.modules?\.s[ac]ss$/i : /\.s[ac]ss$/i,
    exclude,
    enforce: 'pre',
    use: [
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

const getCommonConfig = () => {
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

    stats: {
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
    },

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
                [require.resolve('@babel/preset-env'), { targets: { 'chrome': 63 } }],
                require.resolve('@babel/preset-react'),
                [require.resolve('@babel/preset-typescript'), { allowNamespaces: true }],
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

    optimization: {
      usedExports: true,
      providedExports: true,
      sideEffects: true,
      namedChunks: true,
      namedModules: true,
      removeAvailableModules: true,
      mergeDuplicateChunks: true,
      flagIncludedChunks: true,
      removeEmptyChunks: true,
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

export default getCommonConfig

export { HtmlWebpackPlugin }
