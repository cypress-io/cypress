module.exports = {
  'supportFolder': false,
  'e2e': {
    setupNodeEvents (on, config) {
      on('before:browser:launch', (browser, launchOptions) => {
        launchOptions.args.push('--auto-open-devtools-for-tabs')

        return launchOptions
      })

      return config
    },
  },
}
