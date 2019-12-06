/* eslint-disable
    brace-style,
    no-undef,
    no-unused-vars,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require('lodash')
const cookieParser = require('strict-cookie-parser')
const Promise = require('bluebird')

const $dom = require('../../dom')
const $utils = require('../../cypress/utils')
const $Location = require('../../cypress/location')

const COOKIE_PROPS = 'name value path secure httpOnly expiry domain'.split(' ')

const commandNameRe = /(:)(\w)/

const getCommandFromEvent = (event) => {
  return event.replace(commandNameRe, (match, p1, p2) => {
    return p2.toUpperCase()
  })
}

const mergeDefaults = function (obj) {
  // we always want to be able to see and influence cookies
  // on our superdomain
  const { superDomain } = $Location.create(window.location.href)

  const merge = (o) =>
  // and if the user did not provide a domain
  // then we know to set the default to be origin
  {
    return _.defaults(o, { domain: superDomain })
  }

  if (_.isArray(obj)) {
    return _.map(obj, merge)
  }

  return merge(obj)
}

const validateCookieName = function (cmd, name, onFail) {
  if (cookieParser.isCookieName(name) !== true) {
    return Cypress.utils.throwErrByPath('cookies.invalid_name', { args: { cmd, name }, onFail })
  }
}

module.exports = function (Commands, Cypress, cy, state, config) {
  const automateCookies = function (event, obj = {}, log, timeout) {
    const automate = () => {
      return Cypress.automation(event, mergeDefaults(obj))
      .catch((err) => {
        return $utils.throwErr(err, { onFail: log })
      })
    }

    if (!timeout) {
      return automate()
    }

    // need to remove the current timeout
    // because we're handling timeouts ourselves
    cy.clearTimeout(event)

    return automate()
    .timeout(timeout)
    .catch(Promise.TimeoutError, (err) => {
      return $utils.throwErrByPath('cookies.timed_out', {
        onFail: log,
        args: {
          cmd: getCommandFromEvent(event),
          timeout,
        },
      })
    })
  }

  const getAndClear = (log, timeout, options = {}) => {
    return automateCookies('get:cookies', options, log, timeout)
    .then((resp) => {
    // bail early if we got no cookies!
      if (resp && (resp.length === 0)) {
        return resp
      }

      // iterate over all of these and ensure none are whitelisted
      // or preserved
      const cookies = Cypress.Cookies.getClearableCookies(resp)

      return automateCookies('clear:cookies', cookies, log, timeout)
    })
  }

  Cypress.on('test:before:run:async', () =>
  // TODO: handle failure here somehow
  // maybe by tapping into the Cypress reset
  // stuff, or handling this in the runner itself?
  {
    return getAndClear()
  })

  return Commands.addAll({
    getCookie (name, options = {}) {
      _.defaults(options, {
        log: true,
        timeout: config('responseTimeout'),
      })

      if (options.log) {
        options._log = Cypress.log({
          message: name,
          displayName: 'get cookie',
          consoleProps () {
            let c
            const obj = {}

            c = options.cookie

            if (c) {
              obj['Yielded'] = c
            } else {
              obj['Yielded'] = 'null'
              obj['Note'] = `No cookie with the name: '${name}' was found.`
            }

            return obj
          },
        })
      }

      const onFail = options._log

      if (!_.isString(name)) {
        $utils.throwErrByPath('getCookie.invalid_argument', { onFail })
      }

      validateCookieName('getCookie', name, onFail)

      return automateCookies('get:cookie', { name }, options._log, options.timeout)
      .then((resp) => {
        options.cookie = resp

        return resp
      })
    },

    getCookies (options = {}) {
      _.defaults(options, {
        log: true,
        timeout: config('responseTimeout'),
      })

      if (options.log) {
        options._log = Cypress.log({
          message: '',
          displayName: 'get cookies',
          consoleProps () {
            let c
            const obj = {}

            c = options.cookies

            if (c) {
              obj['Yielded'] = c
              obj['Num Cookies'] = c.length
            }

            return obj
          },
        })
      }

      return automateCookies('get:cookies', _.pick(options, 'domain'), options._log, options.timeout)
      .then((resp) => {
        options.cookies = resp

        return resp
      })
    },

    setCookie (name, value, userOptions = {}) {
      const options = _.clone(userOptions)

      _.defaults(options, {
        name,
        value,
        path: '/',
        secure: false,
        httpOnly: false,
        log: true,
        expiry: $utils.addTwentyYears(),
        timeout: config('responseTimeout'),
      })

      const cookie = _.pick(options, COOKIE_PROPS)

      if (options.log) {
        options._log = Cypress.log({
          message: [name, value],
          displayName: 'set cookie',
          consoleProps () {
            let c
            const obj = {}

            c = options.cookie

            if (c) {
              obj['Yielded'] = c
            }

            return obj
          },
        })
      }

      const onFail = options._log

      if (!_.isString(name) || !_.isString(value)) {
        Cypress.utils.throwErrByPath('setCookie.invalid_arguments', { onFail })
      }

      validateCookieName('setCookie', name, onFail)

      if (cookieParser.parseCookieValue(value) === null) {
        Cypress.utils.throwErrByPath('setCookie.invalid_value', { args: { value }, onFail })
      }

      return automateCookies('set:cookie', cookie, options._log, options.timeout)
      .then((resp) => {
        options.cookie = resp

        return resp
      }).catch((err) => {
        return Cypress.utils.throwErrByPath('setCookie.backend_error', {
          args: {
            browserDisplayName: Cypress.browser.displayName,
            errStack: err.stack,
          },
          onFail,
        })
      })
    },

    clearCookie (name, options = {}) {
      _.defaults(options, {
        log: true,
        timeout: config('responseTimeout'),
      })

      if (options.log) {
        options._log = Cypress.log({
          message: name,
          displayName: 'clear cookie',
          consoleProps () {
            let c
            const obj = {}

            obj['Yielded'] = 'null'

            c = options.cookie

            if (c) {
              obj['Cleared Cookie'] = c
            } else {
              obj['Note'] = `No cookie with the name: '${name}' was found or removed.`
            }

            return obj
          },
        })
      }

      const onFail = options._log

      if (!_.isString(name)) {
        $utils.throwErrByPath('clearCookie.invalid_argument', { onFail })
      }

      validateCookieName('clearCookie', name, onFail)

      // TODO: prevent clearing a cypress namespace
      return automateCookies('clear:cookie', { name }, options._log, options.timeout)
      .then((resp) => {
        options.cookie = resp

        // null out the current subject
        return null
      })
    },

    clearCookies (options = {}) {
      _.defaults(options, {
        log: true,
        timeout: config('responseTimeout'),
      })

      if (options.log) {
        options._log = Cypress.log({
          message: '',
          displayName: 'clear cookies',
          consoleProps () {
            let c
            const obj = {}

            obj['Yielded'] = 'null'

            if ((c = options.cookies) && c.length) {
              obj['Cleared Cookies'] = c
              obj['Num Cookies'] = c.length
            } else {
              obj['Note'] = 'No cookies were found or removed.'
            }

            return obj
          },
        })
      }

      return getAndClear(options._log, options.timeout, { domain: options.domain })
      .then((resp) => {
        options.cookies = resp

        // null out the current subject
        return null
      }).catch((err) => {
        // make sure we always say to clearCookies
        err.message = err.message.replace('getCookies', 'clearCookies')
        throw err
      })
    },
  })
}
