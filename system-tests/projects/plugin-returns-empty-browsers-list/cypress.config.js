module.exports = {
  'e2e': {
    setupNodeEvents (on, config) {
      // returns invalid config - browsers list cannot be empty
      return {
        browsers: [],
      }
    },
  },
}
