module.exports = {
  'allowCypressEnv': false,
  'e2e': {
    'supportFile': false,
    setupNodeEvents (on, config) {
      on('invalid:event', () => {})

      return config
    },
  },
}
