module.exports = {
  'allowCypressEnv': false,
  'e2e': {
    baseUrl: 'http://localhost:3434',
    setupNodeEvents: require('./cypress/plugins'),
  },
}
