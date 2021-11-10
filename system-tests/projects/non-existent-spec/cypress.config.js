module.exports = {
  'supportFile': false,
  'e2e': {
    setupNodeEvents (on, config) {
      on('file:preprocessor', () => '/does/not/exist.js')

      return config
    },
  },
}
