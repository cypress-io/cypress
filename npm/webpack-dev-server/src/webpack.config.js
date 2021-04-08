// @ts-check
const path = require('path')
const fs = require('fs')
const { MiniHtmlWebpackPlugin } = require('./miniWebpackHtmlPlugin')

/** @type {import('webpack').Configuration} */
module.exports = {
  mode: 'development',
  optimization: {
    splitChunks: {
      chunks: 'all',
    },
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    new MiniHtmlWebpackPlugin({
      template: fs.readFileSync(path.resolve(__dirname, '..', 'index-template.html'), 'utf8'),
    }),
  ],
}
