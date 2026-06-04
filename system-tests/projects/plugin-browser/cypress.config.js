module.exports = {
  'e2e': {
    'supportFile': false,
    setupNodeEvents (on, config) {
      on('before:browser:launch', (browser, launchOptions) => {
        const { name } = browser

        if ((name) === 'chrome') {
          launchOptions.args = [name, 'foo', 'bar', 'baz']

          return launchOptions
        }

        if ((name) === 'electron') {
          launchOptions.preferences = {
            browser: 'electron',
            foo: 'bar',
          }

          return launchOptions
        }

        throw new Error(`unrecognized browser name: '${name}' for before:browser:launch`)
      })

      return config
    },
  },
}
