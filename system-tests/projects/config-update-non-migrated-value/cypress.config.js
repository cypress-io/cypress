module.exports = {
  e2e: {
    supportFile: false,
    setupNodeEvents (on, config) {
      config.integrationFolder = 'path/to/integration/folder'

      return config
    },
  },
}
