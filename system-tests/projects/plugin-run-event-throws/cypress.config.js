module.exports = {
  'fixturesFolder': false,
  'supportFile': false,
  'e2e': {
    setupNodeEvents (on, config) {
      on('before:spec', () => {
        throw new Error('error thrown in before:spec')
      })

      return config
    },
  },
}
