import _ from 'lodash'

import $errUtils from '../../cypress/error_utils'
import { getUrlFromAutomation } from './helpers/location'

export function urlQueryCommand (Cypress: Cypress.Cypress, options: Partial<Cypress.UrlOptions> = {}) {
  Cypress.log({ message: '', hidden: options.log === false, timeout: options.timeout })

  const fn = getUrlFromAutomation.bind(this)(Cypress, options)

  return () => {
    const fullUrlObj = fn()

    if (fullUrlObj) {
      const href = fullUrlObj.href

      return options.decode ? decodeURI(href) : href
    }
  }
}

export function hashQueryCommand (Cypress: Cypress.Cypress, options: Partial<Cypress.Loggable & Cypress.Timeoutable> = {}) {
  Cypress.log({ message: '', hidden: options.log === false, timeout: options.timeout })

  const fn = getUrlFromAutomation.bind(this)(Cypress, options)

  return () => {
    const fullUrlObj = fn()

    if (fullUrlObj) {
      return fullUrlObj.hash
    }
  }
}

export function locationQueryCommand (Cypress: Cypress.Cypress, key: string, options: Partial<Cypress.Loggable & Cypress.Timeoutable> = {}) {
  // normalize arguments allowing key + options to be undefined
  // key can represent the options
  if (_.isObject(key)) {
    options = key
  }

  Cypress.log({
    message: _.isString(key) ? key : '',
    hidden: options.log === false,
    timeout: options.timeout,
  })

  const fn = getUrlFromAutomation.bind(this)(Cypress, options)

  return () => {
    const location = fn({ retryAfterResolve: true })

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
      ? location[key] ?? $errUtils.throwErrByPath('location.invalid_key', { args: { key } })
      : location
  }
}

export default (Commands, Cypress) => {
  Commands.addQuery('url', function (options: Partial<Cypress.UrlOptions> = {}) {
    return urlQueryCommand.call(this, Cypress, options)
  })

  Commands.addQuery('hash', function (options: Partial<Cypress.Loggable & Cypress.Timeoutable> = {}) {
    return hashQueryCommand.call(this, Cypress, options)
  })

  Commands.addQuery('location', function (key: string, options: Partial<Cypress.Loggable & Cypress.Timeoutable> = {}) {
    return locationQueryCommand.call(this, Cypress, key, options)
  })
}
