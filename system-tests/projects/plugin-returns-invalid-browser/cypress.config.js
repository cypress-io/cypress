module.exports = {
  'e2e': {
    setupNodeEvents (on, config) {
      // returns invalid config with a browser that is invalid
      // (missing multiple properties)
      return {
        browsers: [{
          name: 'browser name',
          family: 'chromium',
        }],
      }
    },
  },
}
