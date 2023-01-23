const { defineConfig } = require('cypress')

module.exports = defineConfig({
  component: {
    experimentalSingleTabRunMode: true,
    devServer: {
      bundler: 'webpack',
      framework: 'vue-cli',
    },
  },
})
