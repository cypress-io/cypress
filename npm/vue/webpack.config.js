// A basic webpack configuration
// The default for running tests in this project
// https://vue-loader.vuejs.org/guide/#manual-setup
const VueLoaderPlugin = require('vue-loader/lib/plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path')
const pkg = require('package.json')

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
      '@cypress/vue': path.join(__dirname, pkg.main),
      vue: 'vue/dist/vue.esm.js',
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
