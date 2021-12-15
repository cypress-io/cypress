import * as head from 'lodash/head'

module.exports = {
  'e2e': {
    'supportFile': false,
    setupNodeEvents (on, config) {
      // make sure plugin can access dependencies
      head([1, 2, 3])

      return config
    },
  },
}
