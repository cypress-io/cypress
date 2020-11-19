// TODO: move this file into a "webpack" plugin
// `packages/webpack-plugin-ct`

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
  resolve: {
    alias: {
      // this enables loading the "full" version of vue
      // instead of only loading the vue runtime
      vue$: 'vue/dist/vue.esm.js',
    },
  },

  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
}
