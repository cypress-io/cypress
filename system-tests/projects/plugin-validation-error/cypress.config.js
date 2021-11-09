module.exports = {
  e2e: {
    setupNodeEvents (on, config) {
      on('invalid:event', () => {})

      return config
    },
  },
}
