// A basic webpack configuration
// The default for running tests in this project
// https://vue-loader.vuejs.org/guide/#manual-setup
const { VueLoaderPlugin } = require('vue-loader')
const path = require('path')

module.exports = {
  mode: 'development',
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'js/[name].js',
    publicPath: '/',
    chunkFilename: 'js/[name].js',
  },

  resolve: {
    extensions: ['.js', '.json', '.vue'],
    alias: {
      // point at the built file
      '@cypress/vue': path.join(__dirname, 'dist'),
      vue: 'vue/dist/vue.runtime.esm-bundler.js',
      // TODO: remove after delivery of vtu next
      '@vue/test-utils$': '@vue/test-utils/dist/vue-test-utils.esm-bundler.js',
    },
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
      },
      // this will apply to both plain `.css` files
      // AND `<style>` blocks in `.vue` files
      {
        test: /\.css$/,
        use: ['vue-style-loader', 'css-loader'],
      },
      // https://github.com/intlify/vue-i18n-loader
      {
        resourceQuery: /blockType=i18n/,
        type: 'javascript/auto',
        loader: '@intlify/vue-i18n-loader',
      },
    ],
  },
  plugins: [
    // make sure to include the plugin for the magic
    new VueLoaderPlugin(),
  ],
}
