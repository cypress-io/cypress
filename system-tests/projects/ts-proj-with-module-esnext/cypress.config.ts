import { asyncGreeting } from './greeting'

module.exports = {
  'supportFolder': false,
  'e2e': {
    setupNodeEvents (on, config) {
      on('task', {
        hello: asyncGreeting,
      })

      return config
    },
  },
}
