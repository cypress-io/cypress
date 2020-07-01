// A basic webpack configuration
// The default for running tests in this project
// https://vue-loader.vuejs.org/guide/#manual-setup
const VueLoaderPlugin = require('vue-loader/lib/plugin')
const path = require('path')
module.exports = {
    resolve: {
      extensions: ['.js', '.json', '.vue'],
      alias: {
        'cypress-vue-unit-test': path.join(__dirname, 'src')
      }
    },
    module: {
      rules: [
        {
          test: /\.vue$/,
          loader: 'vue-loader',
          options: {
            loaders: {
              // you need to specify `i18n` loaders key with
              // `vue-i18n-loader` (https://github.com/kazupon/vue-i18n-loader)
              i18n: '@kazupon/vue-i18n-loader'
            }
          }
        },
        // this will apply to both plain `.css` files
        // AND `<style>` blocks in `.vue` files
        {
          test: /\.css$/,
          use: [
            'vue-style-loader',
            'css-loader'
          ]
        }
      ]
    },
    plugins: [
    // make sure to include the plugin for the magic
      new VueLoaderPlugin()
    ]
}
