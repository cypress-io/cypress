module.exports = {
  'retries': 2,
  'e2e': {
    'supportFile': false,
    setupNodeEvents (on, config) {
      const { useFixedBrowserLaunchSize } = require('@tooling/system-tests/lib/pluginUtils')

      on('before:browser:launch', (browser, options) => {
        useFixedBrowserLaunchSize(browser, options, config)

        return options
      })

      return config
    },
  },
}
