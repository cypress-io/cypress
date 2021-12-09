const fs = require('fs-extra')

module.exports = {
  'fixturesFolder': false,
  'supportFile': false,
  'e2e': {
    setupNodeEvents (on, config) {
      on('after:spec', (spec, results) => {
        return fs.remove(results.video)
      })

      return config
    },
  },
}
