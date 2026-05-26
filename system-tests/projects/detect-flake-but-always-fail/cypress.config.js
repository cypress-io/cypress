module.exports = {
  numTestsKeptInMemory: 0,
  e2e: {
    supportFile: false,
    retries: {
      openMode: true,
      runMode: true,
      experimentalStrategy: 'detect-flake-but-always-fail',
      experimentalOptions: {
        maxRetries: 9,
        stopIfAnyPassed: false,
      },
    },
  },
}
