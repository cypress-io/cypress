module.exports = {
  e2e: {
    supportFile: false,
    setupNodeEvents (on, config) {
      require('./cypress-preprocessor.config.js')(on, config)
    },
  },
  env: {
    areSourceMapsAvailable: false,
  },
}
