module.exports = {
  'retries': 2,
  'e2e': {
    setupNodeEvents (on, config) {
      const { useFixedBrowserLaunchSize } = require('../utils')

      on('before:browser:launch', (browser, options) => {
        useFixedBrowserLaunchSize(browser, options, config)

        return options
      })

      return config
    },
  },
}
