module.exports = {
  'e2e': {
    'supportFile': false,
    setupNodeEvents (on, config) {
      on('before:browser:launch', (browser) => {
        const { name } = browser

        switch (name) {
          case 'chrome':
            return [name, 'foo', 'bar', 'baz']
          case 'electron':
            return {
              preferences: {
                browser: 'electron',
                foo: 'bar',
              },
            }
          default:
            throw new Error(`unrecognized browser name: '${name}' for before:browser:launch`)
        }
      })

      return config
    },
  },
}
