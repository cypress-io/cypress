const { defineConfig } = require('cypress')

module.exports = defineConfig({
  component: {
    setupNodeEvents (on, config) {},
    specPattern: 'src/**/*spec.{js,tsx}',
  },
})
