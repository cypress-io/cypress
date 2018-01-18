// collection of network rules to intercept or spy on network requests
const R = require('ramda')

function create () {
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

    // when searching for the rule, start looking from the end
    // going back to the beginning. Matching rule that was added last should win
    // TODO make sure request and rules have normalized method, url
    getRule: (req) => R.findLast(R.allPass([
      R.propEq('url', req.url),
      R.propEq('method', req.method),
    ]))(rules),
  }
  return trafficRules
}

module.exports = {
  create,
}
