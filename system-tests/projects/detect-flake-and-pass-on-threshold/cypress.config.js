module.exports = {
  numTestsKeptInMemory: 0,
  e2e: {
    supportFile: false,
    retries: {
      openMode: true,
      runMode: true,
      experimentalStrategy: 'detect-flake-and-pass-on-threshold',
      experimentalOptions: {
        maxRetries: 9,
        passesRequired: 5,
      },
    },
  },
}
