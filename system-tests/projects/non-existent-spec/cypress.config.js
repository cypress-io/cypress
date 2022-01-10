module.exports = {
  'e2e': {
    'supportFile': false,
    specPattern: 'cypress/**/*.spec.js',
    setupNodeEvents (on, config) {
      on('file:preprocessor', () => '/does/not/exist.js')

      return config
    },
  },
}
