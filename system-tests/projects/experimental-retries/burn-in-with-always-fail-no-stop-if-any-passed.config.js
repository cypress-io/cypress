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
  experimentalBurnIn: {
    default: 2,
    flaky: 4,
  },
  retries: {
    openMode: false,
    runMode: true,
    experimentalStrategy: 'detect-flake-but-always-fail',
    experimentalOptions: {
      maxRetries: 6,
      stopIfAnyPassed: false,
    },
  },
}
