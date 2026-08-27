module.exports = {
  e2e: {
    supportFile: false,
    setupNodeEvents (on, config) {
      // in the case the tests needed to be debugged:

      // on('before:browser:launch', (browser, launchOptions) => {
      //   launchOptions.args.push('--auto-open-devtools-for-tabs')

      //   return launchOptions
      // })
    },
  },
}
