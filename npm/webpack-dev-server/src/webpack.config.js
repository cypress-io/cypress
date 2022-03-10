const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

/**
 * @param {string} [template] - base template to use
 * @returns {import('webpack').Configuration}
 */
module.exports = function makeDefaultConfig (indexHtmlFile) {
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
      template: indexHtmlFile || path.resolve(__dirname, '..', 'index-template.html'),
    })],
  }
}
