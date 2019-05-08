import webpack, { Configuration, optimize } from 'webpack'
import path from 'path'
import HtmlWebpackPlugin = require('html-webpack-plugin')
import CopyWebpackPlugin = require('copy-webpack-plugin')
import MiniCSSExtractWebpackPlugin = require('mini-css-extract-plugin')
import CleanWebpackPlugin from 'clean-webpack-plugin'
import _ from 'lodash'

import sassGlobImporter = require('node-sass-globbing')

const mode = process.env.NODE_ENV as ('development' | 'production' | 'test' | 'reporter') || 'development'
const webpackmode = mode === 'production' ? mode : 'development'

const isDevServer = !!process.env.DEV_SERVER

const config: webpack.Configuration = {
  entry: {
    cypress_runner: ['./src/main.jsx'],
  },
  mode: webpackmode,
  node: {
    fs: 'empty',
    child_process: 'empty',
    net: 'empty',
    tls: 'empty',
    module: 'empty'
  },
  resolve: {
    alias: {
      'react': path.resolve('./node_modules/react')
    },
    extensions: ['.ts', '.js', '.jsx', '.tsx', '.coffee', '.scss'],
  },
  output: {
    path: path.resolve('./dist'),
    filename: '[name].js',
  },

  // Enable source maps
  devtool: 'inline-cheap-module-source-map',

  stats: {
    errors: true,
    warningsFilter: /node_modules\/mocha\/lib\/mocha.js/,
    warnings: true,
    all: false,
    builtAt: true,
    colors: true,
    modules: true,
    maxModules: 400,
    excludeModules: /main.scss/,
  },

  module: {
    rules: [
      {
        test: /\.coffee/,
        exclude: /node_modules/,
        use: {
          loader: require.resolve('coffee-loader'),
        },
      },
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
            presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'],
            babelrc: false,
          },
        },
      },
      {
        test: /\.s?css$/,
        exclude: /node_modules/,
        use: [
          { loader: MiniCSSExtractWebpackPlugin.loader },
          {
            loader: 'css-loader',
            options: {
              // sourceMap: true,
              modules: false,
            },
          }, // translates CSS into CommonJS
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
              importer: sassGlobImporter,
            },
          }, // compiles Sass to CSS, using Node Sass by default
        ],
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: './fonts/[name].[ext]',
            },
          },
        ],
      },
    ],
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: isDevServer ? './static/index.dev.html' : './static/index.html',
      inject: false,
    }),
    new CleanWebpackPlugin(),
    new CopyWebpackPlugin([{ from: './static/fonts', to: 'fonts' }]),
    new MiniCSSExtractWebpackPlugin('[name].css'),
  ],

  devServer: {
    port: 3938,
    stats: {
      errors: true,
      warningsFilter: /node_modules\/mocha\/lib\/mocha.js/,
      warnings: true,
      all: false,
      builtAt: true,
      colors: true,
      modules: true,
      excludeModules: /main.scss/,
    },
    noInfo: true,
    writeToDisk: (filepath) => /index.html/.test(filepath),
    headers: {
      "Access-Control-Allow-Origin": "*",
    }
  }

}

if (mode === 'reporter') {
  const reporterConfig: webpack.Configuration = {
    entry: {
      cypress_reporter: ['../reporter/src']
    },
    output: {
      path: path.resolve('../reporter/dist'),
      filename: '[name].js'
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './static/index.reporter.html',
        chunks: ['cypress_reporter']
      }),
      new CleanWebpackPlugin(),
      new CopyWebpackPlugin([{ from: './static/fonts', to: 'fonts' }]),
      new MiniCSSExtractWebpackPlugin('[name].css'),
    ]
  }

  _.extend(config, reporterConfig)
}


if (mode === 'test') {
  const testConfig: webpack.Configuration = {
    devtool: 'inline-cheap-module-source-map',
    target: 'node',
    entry: {
      cypress_test: ['../reporter/test/index.spec.js']
    },
    output: {
      path: path.resolve('../reporter/dist-test'),
      filename: '[name].js',
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
      // devtoolFallbackModuleFilenameTemplate: '[absolute-resource-path]?[hash]'
    },
    optimization: undefined,
    plugins: [
      new CopyWebpackPlugin([{ from: './static/fonts', to: 'fonts' }]),
    ],

    externals: [require('webpack-node-externals')()],

  }

  _.extend(config, testConfig)

}

export default config
