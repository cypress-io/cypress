const path = require('path')

module.exports = {
  e2e: {
    setupNodeEvents (on, config) {
      on('before:browser:launch', (browser = {}, options) => {
        const pathToExt = path.resolve('ext')

        options.args.push(`--load-extension=${pathToExt}`)

        return options
      })

      return config
    },
  },
}
