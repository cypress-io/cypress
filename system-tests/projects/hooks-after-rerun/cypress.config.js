const state = {}

module.exports = {
  'e2e': {
    setupNodeEvents (on, config) {
      on('task', {
        incrState (arg) {
          state[arg] = state[arg] + 1 || 1

          return null
        },
        getState () {
          return state
        },
      })

      return config
    },
  },
}
