// collection of network rules to intercept or spy on network requests
const R = require('ramda')

const rules = []
const trafficRules = {
  reset: () => {
    rules.length = 0
  },

  add: (rule) => {
    rules.push(rule)
  },

  length: () => rules.length,

  toJSON: () => R.project(['method', 'url'], rules),
}

module.exports = trafficRules
