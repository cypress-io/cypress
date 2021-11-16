module.exports = {
  'e2e': {
    setupNodeEvents (on, config) {
      on('task', {
        'returns:arg' (arg) {
          return arg
        },
      })

      return config
    },
  },
}
