module.exports = {
  'allowCypressEnv': false,
  'e2e': {
    setupNodeEvents (on, config) {
      return {
        viewportWidth: 'foo',
      }
    },
  },
}
