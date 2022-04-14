module.exports = {
  'e2e': {
    'supportFile': false,
    setupNodeEvents (on, config) {
      on('invalid:event', () => {})

      return config
    },
  },
}
