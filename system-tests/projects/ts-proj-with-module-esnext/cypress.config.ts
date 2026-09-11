import { asyncGreeting } from './greeting'

module.exports = {
  'supportFolder': false,
  'e2e': {
    'supportFile': false,
    setupNodeEvents (on, config) {
      on('task', {
        hello: asyncGreeting,
      })

      return config
    },
  },
}
