module.exports = {
  'projectId': 'pid123',
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
  retries: {
    runMode: true,
    openMode: true,
    experimentalStrategy: 'detect-flake-and-pass-on-threshold',
    experimentalOptions: {
      maxRetries: 4,
      passesRequired: 2,
    },
  },
  experimentalBurnIn: {
    default: 3,
    flaky: 5,
  },
}
