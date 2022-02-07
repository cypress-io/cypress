module.exports = {
  e2e: {
    setupNodeEvents: (on, config) => {
      const err = new Error('Function sync error from setupNodeEvents')

      err.name = 'FunctionSyncError'

      throw err
    },
  },
}
