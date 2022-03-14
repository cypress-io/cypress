import _ from 'lodash'
import Promise from 'bluebird'

import $errUtils from '../../cypress/error_utils'
const { throwErrByPath } = $errUtils

interface InternalUrlOptions extends Partial<Cypress.UrlOptions> {
  _log?: any
}

interface InternalHashOptions extends Partial<Cypress.Loggable & Cypress.Timeoutable> {
  _log?: any
}

export default (Commands, Cypress, cy) => {
  Commands.addAll({
    url (options: Partial<Cypress.UrlOptions> = {}) {
      const _options: InternalUrlOptions = _.defaults({}, options, { log: true })

      if (_options.log !== false) {
        _options._log = Cypress.log({
          message: '',
          timeout: _options.timeout,
        })
      }

      const getHref = () => {
        return cy.getRemoteLocation('href')
      }

      const resolveHref = () => {
        return Promise.try(getHref).then((href) => {
          if (_options.decode) {
            href = decodeURI(href)
          }

          return cy.verifyUpcomingAssertions(href, _options, {
            onRetry: resolveHref,
          })
        })
      }

      return resolveHref()
    },

    hash (options: Partial<Cypress.Loggable & Cypress.Timeoutable> = {}) {
      const _options: InternalHashOptions = _.defaults({}, options, { log: true })

      if (_options.log !== false) {
        _options._log = Cypress.log({
          message: '',
          timeout: _options.timeout,
        })
      }

      const getHash = () => {
        return cy.getRemoteLocation('hash')
      }

      const resolveHash = () => {
        return Promise.try(getHash).then((hash) => {
          return cy.verifyUpcomingAssertions(hash, _options, {
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

        if (location === '') {
          // maybe the page's domain is "invisible" to us
          // and we cannot get the location. Return null
          // so the command keeps retrying, maybe there is
          // a redirect that puts us on the domain we can access
          return null
        }

        return _.isString(key)
          // use existential here because we only want to throw
          // on null or undefined values (and not empty strings)
          ? location[key] ?? throwErrByPath('location.invalid_key', { args: { key } })
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
