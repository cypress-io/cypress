const { defineConfig } = require('cypress')

module.exports = defineConfig({
  component: {
    devServer: {
      framework: 'svelte',
      bundler: 'webpack',
    },
  },
})
