module.exports = {
  baseUrl: 'http://localhost:3434',
  video: false,
  'e2e': {
    'supportFile': 'cypress/support/index.js',
    setupNodeEvents: require('./cypress/plugins'),
  },
}
