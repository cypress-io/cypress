module.exports = {
  'e2e': {
    'supportFile': false,
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
