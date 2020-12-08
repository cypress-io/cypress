const path = require('path')

module.exports = {
  mode: 'development',
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
