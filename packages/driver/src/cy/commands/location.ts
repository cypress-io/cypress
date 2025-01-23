import _ from 'lodash'

import $errUtils from '../../cypress/error_utils'

export default (Commands, Cypress, cy) => {
  Commands.addQuery('url', function url (options: Partial<Cypress.UrlOptions> = {}) {
    // Make sure the url command can communicate with the AUT.
    // otherwise, it yields an empty string
    Cypress.ensure.commandCanCommunicateWithAUT(cy)
    this.set('timeout', options.timeout)

    Cypress.log({ message: '', hidden: options.log === false, timeout: options.timeout })

    return () => {
      const href = cy.getRemoteLocation('href')

      return options.decode ? decodeURI(href) : href
    }
  })

  Commands.addQuery('hash', function url (options: Partial<Cypress.Loggable & Cypress.Timeoutable> = {}) {
    // Make sure the hash command can communicate with the AUT.
    Cypress.ensure.commandCanCommunicateWithAUT(cy)
    this.set('timeout', options.timeout)

    Cypress.log({ message: '', hidden: options.log === false, timeout: options.timeout })

    return () => cy.getRemoteLocation('hash')
  })

  Commands.addQuery('location', function location (key, options: Partial<Cypress.Loggable & Cypress.Timeoutable> = {}) {
    // normalize arguments allowing key + options to be undefined
    // key can represent the options

    // Make sure the location command can communicate with the AUT.
    // otherwise the command just yields 'null' and the reason may be unclear to the user.
    Cypress.ensure.commandCanCommunicateWithAUT(cy)
    if (_.isObject(key)) {
      options = key
    }

    this.set('timeout', options.timeout)

    Cypress.log({
      message: _.isString(key) ? key : '',
      hidden: options.log === false,
      timeout: options.timeout,
    })

    return () => {
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
        ? location[key] ?? $errUtils.throwErrByPath('location.invalid_key', { args: { key } })
        : location
    }
  })
}
