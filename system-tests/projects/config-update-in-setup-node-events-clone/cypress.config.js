module.exports = {
  allowCypressEnv: false,
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
