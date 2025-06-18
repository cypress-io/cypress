import _ from 'lodash'

import $errUtils from '../../cypress/error_utils'
import { getUrlFromAutomation } from './helpers/location'

export function urlQueryCommand (Cypress: Cypress.Cypress, cy: Cypress.Cypress, options: Partial<Cypress.UrlOptions> = {}) {
  Cypress.log({ message: '', hidden: options.log === false, timeout: options.timeout })

  // Since webkit doesn't have an automation client and doesn't support cy.origin(), we need to use the legacy method to get the url
  if (Cypress.isBrowser('webkit')) {
    // Make sure the url command can communicate with the AUT.
    // otherwise, it yields an empty string
    // @ts-expect-error
    Cypress.ensure.commandCanCommunicateWithAUT(cy)
    this.set('timeout', options.timeout)

    return () => {
      // @ts-expect-error
      const href = cy.getRemoteLocation('href')

      return options.decode ? decodeURI(href) : href
    }
  }

  const fn = getUrlFromAutomation.bind(this)(Cypress, options)

  return () => {
    const fullUrlObj = fn()

    if (fullUrlObj) {
      const href = fullUrlObj.href

      return options.decode ? decodeURI(href) : href
    }
  }
}

export function hashQueryCommand (Cypress: Cypress.Cypress, cy: Cypress.Cypress, options: Partial<Cypress.Loggable & Cypress.Timeoutable> = {}) {
  Cypress.log({ message: '', hidden: options.log === false, timeout: options.timeout })

  // Since webkit doesn't have an automation client and doesn't support cy.origin(), we need to use the legacy method to get the hash
  if (Cypress.isBrowser('webkit')) {
    // Make sure the hash command can communicate with the AUT.
    // @ts-expect-error
    Cypress.ensure.commandCanCommunicateWithAUT(cy)
    this.set('timeout', options.timeout)

    // @ts-expect-error
    return () => cy.getRemoteLocation('hash')
  }

  const fn = getUrlFromAutomation.bind(this)(Cypress, options)

  return () => {
    const fullUrlObj = fn()

    if (fullUrlObj) {
      return fullUrlObj.hash
    }
  }
}

export function locationQueryCommand (Cypress: Cypress.Cypress, cy: Cypress.Cypress, key: string, options: Partial<Cypress.Loggable & Cypress.Timeoutable> = {}) {
  // normalize arguments allowing key + options to be undefined
  // key can represent the options

  // Make sure the location command can communicate with the AUT.
  // otherwise the command just yields 'null' and the reason may be unclear to the user.
  if (_.isObject(key)) {
    options = key
  }

  Cypress.log({
    message: _.isString(key) ? key : '',
    hidden: options.log === false,
    timeout: options.timeout,
  })

  // Since webkit doesn't have an automation client and doesn't support cy.origin(), we need to use the legacy method to get the location
  if (Cypress.isBrowser('webkit')) {
    // normalize arguments allowing key + options to be undefined
    // key can represent the options

    // Make sure the location command can communicate with the AUT.
    // otherwise the command just yields 'null' and the reason may be unclear to the user.
    //@ts-expect-error
    Cypress.ensure.commandCanCommunicateWithAUT(cy)

    this.set('timeout', options.timeout)
  }

  //@ts-expect-error
  const fn = Cypress.isBrowser('webkit') ? cy.getRemoteLocation : getUrlFromAutomation.bind(this)(Cypress, options)

  return () => {
    const location = fn()

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

export default (Commands, Cypress, cy) => {
  Commands.addQuery('url', function (options: Partial<Cypress.UrlOptions> = {}) {
    return urlQueryCommand.call(this, Cypress, cy, options)
  })

  Commands.addQuery('hash', function (options: Partial<Cypress.Loggable & Cypress.Timeoutable> = {}) {
    return hashQueryCommand.call(this, Cypress, cy, options)
  })

  Commands.addQuery('location', function (key: string, options: Partial<Cypress.Loggable & Cypress.Timeoutable> = {}) {
    return locationQueryCommand.call(this, Cypress, cy, key, options)
  })
}
