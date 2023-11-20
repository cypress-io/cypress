const { defineConfig } = require('cypress')

module.exports = defineConfig({
  component: {
    experimentalSingleTabRunMode: true,
    devServer: {
      framework: 'create-react-app',
      bundler: 'webpack',
    },
  },
})
