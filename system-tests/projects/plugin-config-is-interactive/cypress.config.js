const fs = require('fs')
const path = require('path')

module.exports = {
  allowCypressEnv: false,
  fixturesFolder: false,
  e2e: {
    supportFile: false,
    setupNodeEvents (on, config) {
      // Record the mode-related config values that setupNodeEvents actually
      // receives so the system test can assert on them. In run mode these
      // should be isInteractive=false / isTextTerminal=true.
      // https://github.com/cypress-io/cypress/issues/20789
      const outputPath = path.join(config.projectRoot, 'setupNodeEvents.config.json')

      fs.writeFileSync(outputPath, JSON.stringify({
        isInteractive: config.isInteractive,
        isTextTerminal: config.isTextTerminal,
      }))

      return config
    },
  },
}
