const fs = require('fs-extra')

module.exports = {
  fixturesFolder: false,
  video: true,
  e2e: {
    supportFile: false,
    setupNodeEvents (on, config) {
      on('after:spec', (spec, results) => {
        return fs.remove(results.video)
      })

      return config
    },
  },
}
