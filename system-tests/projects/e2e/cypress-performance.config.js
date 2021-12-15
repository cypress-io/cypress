module.exports = {
  baseUrl: 'http://localhost:3434',
  video: false,
  'e2e': {
    setupNodeEvents: require('./cypress/plugins'),
  },
}
