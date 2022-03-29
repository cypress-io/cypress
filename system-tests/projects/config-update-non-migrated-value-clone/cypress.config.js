module.exports = {
  e2e: {
    supportFile: false,
    setupNodeEvents (on, config) {
      return {
        ...config,
        integrationFolder: 'path/to/integration/folder',
      }
    },
  },
}
