const path = require('path')

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
}
