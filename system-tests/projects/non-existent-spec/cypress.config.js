module.exports = {
  'allowCypressEnv': false,
  'e2e': {
    'supportFile': false,
    setupNodeEvents (on, config) {
      on('file:preprocessor', () => '/does/not/exist.js')

      return config
    },
  },
}
