const state = {}

module.exports = {
  'allowCypressEnv': false,
  'e2e': {
    'record': false,
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
