const fs = require('fs')

module.exports = {
  'projectId': 'pid123',
  'e2e': {
    setupNodeEvents (on, config) {
      const plugin = require('./cypress/plugins')

      // @see https://on.cypress.io/screenshots-and-videos#Delete-videos-for-specs-without-failing-or-retried-tests
      // for videoUploadOnPasses workaround, which was removed in Cypress v13.0.0
      on(
        'after:spec',
        (spec, results) => {
          if (results && results.video) {
            const areFailuresPresent = results.stats.failures > 0

            if (!areFailuresPresent) {
              // delete the video if the spec passed and no tests retried
              fs.unlinkSync(results.video)
            }
          }
        },
      )

      return plugin(on, config)
    },
  },
}
