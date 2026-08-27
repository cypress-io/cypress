module.exports = {
  e2e: {
    supportFile: false,
    setupNodeEvents (on, config) {
      config.experimentalSkipDomainInjection = true

      return config
    },
  },
}
