const { defineConfig: cypressDefineConfig } = require('cypress')

export default cypressDefineConfig({
  e2e: {
    setupNodeEvents () {},
  },
})
