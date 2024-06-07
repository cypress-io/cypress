const { defineConfig } = require('cypress')

module.exports = defineConfig({
  component: {
    fixturesFolder: false,
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
  },
})
