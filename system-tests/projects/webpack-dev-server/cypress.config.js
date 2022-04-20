const { defineConfig } = require('cypress')

module.exports = defineConfig({
  component: {
    supportFile: false,
    devServer: {
      bundler: 'webpack',
    },
  },
})
