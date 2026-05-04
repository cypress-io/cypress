const { defineConfig } = require('cypress')

module.exports = defineConfig({
  allowCypressEnv: false,
  component: {
    experimentalSingleTabRunMode: true,
    supportFile: false,
    devServer: {
      framework: 'vue',
      bundler: 'vite',
    },
  },
})
