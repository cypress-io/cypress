module.exports = {
  e2e: {
    supportFile: false,
    setupNodeEvents (on, config) {
      config.e2e.integrationFolder = 'path/to/integration/folder'

      return config
    },
  },
}
