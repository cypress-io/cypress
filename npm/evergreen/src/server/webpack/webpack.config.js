const path = require('path')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

module.exports = {
  mode: 'development',
  plugins: [
    new CleanWebpackPlugin(),
  ],
  optimization: {
    splitChunks: {
      chunks: 'all',
    },
  },
  entry: '@cypress/evergreen/dist/plugins/webpack-client.js',
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
}
