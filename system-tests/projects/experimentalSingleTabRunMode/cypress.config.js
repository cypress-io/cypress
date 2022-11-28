const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    setupNodeEvents: (on, config) => config,
    // invalid - used for e2e testing to verify error is shown
    experimentalSingleTabRunMode: true,
  },
  component: {
    experimentalSingleTabRunMode: true,
    devServer: {
      bundler: 'webpack',
    },
  },
})
