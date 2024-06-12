module.exports = {
  fixturesFolder: false,
  e2e: {
    supportFile: false,
    setupNodeEvents (on, config) {
      on('before:spec', () => {
        throw new Error('error thrown in before:spec')
      })

      return config
    },
  },
}
