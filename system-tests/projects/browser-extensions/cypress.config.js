const path = require('path')

module.exports = {
  'e2e': {
    'supportFile': false,
    setupNodeEvents (on, config) {
      on('before:browser:launch', (browser, options) => {
        options.extensions.push(path.join(__dirname, '../plugin-extension/ext'))
        options.preferences.devTools = true

        return options
      })

      return config
    },
  },
}
