const _ = require('lodash')
const Promise = require('bluebird')

const $errUtils = require('../../cypress/error_utils')

module.exports = (Commands, Cypress, cy) => {
  Commands.addAll({
    url (options = {}) {
      const userOptions = options

      options = _.defaults({}, userOptions, { log: true })

      if (options.log !== false) {
        options._log = Cypress.log({
          message: '',
          timeout: options.timeout,
        })
      }

      const getHref = () => {
        return cy.getRemoteLocation('href')
      }

      const resolveHref = () => {
        return Promise.try(getHref).then((href) => {
          return cy.verifyUpcomingAssertions(href, options, {
            onRetry: resolveHref,
          })
        })
      }

      return resolveHref()
    },

    hash (options = {}) {
      const userOptions = options

      options = _.defaults({}, userOptions, { log: true })

      if (options.log !== false) {
        options._log = Cypress.log({
          message: '',
          timeout: options.timeout,
        })
      }

      const getHash = () => {
        return cy.getRemoteLocation('hash')
      }

      const resolveHash = () => {
        return Promise.try(getHash).then((hash) => {
          return cy.verifyUpcomingAssertions(hash, options, {
            onRetry: resolveHash,
          })
        })
      }

      return resolveHash()
    },

    location (key, options) {
      let userOptions = options

      // normalize arguments allowing key + options to be undefined
      // key can represent the options
      if (_.isObject(key) && _.isUndefined(userOptions)) {
        userOptions = key
      }

      userOptions = userOptions || {}

      options = _.defaults({}, userOptions, { log: true })

      const getLocation = () => {
        const location = cy.getRemoteLocation()

        return _.isString(key)
          // use existential here because we only want to throw
          // on null or undefined values (and not empty strings)
          ? location[key] ?? $errUtils.throwErrByPath('location.invalid_key', { args: { key } })
          : location
      }

      if (options.log !== false) {
        options._log = Cypress.log({
          message: key != null ? key : '',
          timeout: options.timeout,
        })
      }

      const resolveLocation = () => {
        return Promise.try(getLocation).then((ret) => {
          return cy.verifyUpcomingAssertions(ret, options, {
            onRetry: resolveLocation,
          })
        })
      }

      return resolveLocation()
    },
  })
}
