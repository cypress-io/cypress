const { defineConfig } = require('cypress')

module.exports = defineConfig({
  component: {
    experimentalSingleTabRunMode: true,
    devServer: {
      framework: 'svelte',
      bundler: 'webpack',
    },
  },
})
