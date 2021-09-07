const _ = require('lodash')
const Promise = require('bluebird')

const $errUtils = require('../../cypress/error_utils')

const clone = (obj) => {
  return JSON.parse(JSON.stringify(obj))
}

module.exports = (Commands, Cypress, cy, state, config) => {
  // this is called at the beginning of run, so clear the cache
  let cache = {}

  const reset = () => {
    cache = {}
  }

  Cypress.on('clear:fixtures:cache', reset)

  return Commands.addAll({
    fixture (fixture, ...args) {
      if (config('fixturesFolder') === false) {
        $errUtils.throwErrByPath('fixture.set_to_false')
      }

      // if we already have cached
      // this fixture then just return it

      // always return a promise here
      // to make our interface consistent
      // for use by other code
      const resp = cache[fixture]

      if (resp) {
        // clone the object first to prevent
        // accidentally mutating the one in the cache
        return Promise.resolve(clone(resp))
      }

      let options = {}

      if (_.isObject(args[0])) {
        options = args[0]
      } else if (_.isObject(args[1])) {
        options = args[1]
      }

      if (_.isString(args[0])) {
        options.encoding = args[0]
      }

      const timeout = options.timeout ?? Cypress.config('responseTimeout')

      // need to remove the current timeout
      // because we're handling timeouts ourselves
      cy.clearTimeout('get:fixture')

      return Cypress.backend('get:fixture', fixture, _.pick(options, 'encoding'))
      .timeout(timeout)
      .then((response) => {
        if (response && response.__error) {
          return $errUtils.throwErr(response.__error)
        }

        // add the fixture to the cache
        // so it can just be returned next time
        cache[fixture] = response

        // return the cloned response
        return clone(response)
      }).catch(Promise.TimeoutError, () => {
        return $errUtils.throwErrByPath('fixture.timed_out', {
          args: { timeout },
        })
      })
    },
  })
}
