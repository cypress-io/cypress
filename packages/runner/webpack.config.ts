import webpack from 'webpack'
import path from 'path'
import HtmlWebpackPlugin = require('html-webpack-plugin')
import CopyWebpackPlugin = require('copy-webpack-plugin')
import ExtractTextWebpackPlugin = require('extract-text-webpack-plugin')
import MiniCSSExtractWebpackPlugin = require('mini-css-extract-plugin')

import sassGlobImporter = require('node-sass-globbing')

import HappyPack = require('happypack')

const config: webpack.Configuration = {
  // entry: './src/main.scss',
  entry: {
    'cypress_runner.js': ['./src/main.jsx'],
    cypress_runner: ['./src/main.scss'],
    cypress_selector_playground: ['./src/selector-playground/selector-playground.scss'],
  },
  stats: 'minimal',
  mode: 'development',
  node: {
    fs: 'empty',
    child_process: 'empty',
  },
  resolve: {
    extensions: ['.ts', '.js', '.jsx', '.tsx', '.coffee', '.scss'],
  },
  output: {
    path: path.resolve('./dist'),
    filename: '[name]',
  },

  module: {
    rules: [
      {
        test: /\.coffee/,
        exclude: /.*node_modules.*/,
        use: {
          loader: require.resolve('coffee-loader'),
        },
      },
      {
        test: /\.(ts|js|jsx|tsx)$/,
        exclude: /.*node_modules.*/,
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
        exclude: /.*node_modules.*/,
        // use: ExtractTextWebpackPlugin.extract({
        // 	fallback: 'style-loader',
        // 	use: ['css-loader', 'sass-loader']
        // })
        // use: ExtractTextWebpackPlugin.extract({
        use: [
          { loader: MiniCSSExtractWebpackPlugin.loader },
          // { loader: 'style-loader' }, // creates style nodes from JS strings
          {
            loader: 'css-loader',
            options: {
              sourceMap: true,
              modules: true,
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
        // }),
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '/fonts/[name].[ext]',
            },
          },
        ],
      },
    ],
  },
  plugins: [
    // new HappyPack({
    //   loaders: [
    //     {
    //       loader: require.resolve('babel-loader'),
    //       options: {
    //         plugins: [
    //           // "istanbul",
    //           [require.resolve('@babel/plugin-proposal-decorators'), { legacy: true }],
    //           [require.resolve('@babel/plugin-proposal-class-properties'), { loose: true }],
    //         ],
    //         presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'],
    //         babelrc: false,
    //       },
    //     },
    //   ],
    // }),
    new HtmlWebpackPlugin({
      template: './static/index.html',
      inject: false,
    }),
    new CopyWebpackPlugin([{ from: './static/fonts', to: 'fonts' }]),
    new MiniCSSExtractWebpackPlugin('[name]'),
  ],
}

export default config
