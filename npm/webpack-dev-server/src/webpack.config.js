const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

/**
 * @param {string | undefined} [template] - base template to use
 * @param {string} [previewHead] - base template to use
 * @returns {import('webpack').Configuration}
 */
module.exports = function makeDefaultConfig (template, previewHead) {
  return {
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
    plugins: [new HtmlWebpackPlugin({
      template: template || path.resolve(__dirname, '..', 'index-template.html'),
      templateParameters: {
        previewHead,
      },
    })],
  }
}
