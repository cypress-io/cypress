const { defineConfig } = require('cypress')

module.exports = defineConfig({
  component: {
    experimentalSingleTabRunMode: true,
    supportFile: false,
    devServer: {
      bundler: 'webpack',
    },
  },
})
