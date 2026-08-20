module.exports = {
  e2e: {
    supportFile: false,
    setupNodeEvents (on, config) {
      return {
        ...config,
        experimentalSkipDomainInjection: true,
      }
    },
  },
}
