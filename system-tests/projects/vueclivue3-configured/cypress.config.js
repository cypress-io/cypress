const { defineConfig } = require('cypress')

module.exports = defineConfig({
  component: {
    devServer: {
      bundler: 'webpack',
      framework: 'vue-cli'
    },
  },
})