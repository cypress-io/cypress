import _ from 'lodash'
import Promise from 'bluebird'

import $errUtils from '../../cypress/error_utils'
import type { Log } from '../../cypress/log'
const { throwErrByPath } = $errUtils

interface InternalUrlOptions extends Partial<Cypress.UrlOptions> {
  _log?: Log
}

interface InternalHashOptions extends Partial<Cypress.Loggable & Cypress.Timeoutable> {
  _log?: Log
}

export default (Commands, Cypress, cy) => {
  Commands.addAll({
    url (userOptions: Partial<Cypress.UrlOptions> = {}) {
      const options: InternalUrlOptions = _.defaults({}, userOptions, { log: true })

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
          if (options.decode) {
            href = decodeURI(href)
          }

          return cy.verifyUpcomingAssertions(href, options, {
            onRetry: resolveHref,
          })
        })
      }

      return resolveHref()
    },

    hash (userOptions: Partial<Cypress.Loggable & Cypress.Timeoutable> = {}) {
      const options: InternalHashOptions = _.defaults({}, userOptions, { log: true })

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
