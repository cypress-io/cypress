const _ = require('lodash')
const Promise = require('bluebird')

const $utils = require('../../cypress/utils')
const $errUtils = require('../../cypress/error_utils')
const $Location = require('../../cypress/location')

const COOKIE_PROPS = 'name value path secure httpOnly expiry domain sameSite'.split(' ')

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

  // and if the user did not provide a domain
  // then we know to set the default to be origin
  const merge = (o) => {
    return _.defaults(o, { domain: superDomain })
  }

  if (_.isArray(obj)) {
    return _.map(obj, merge)
  }

  return merge(obj)
}

// from https://developer.chrome.com/extensions/cookies#type-SameSiteStatus
// note that `unspecified` is purposely omitted - Firefox and Chrome set
// different defaults, and Firefox lacks support for `unspecified`, so
// `undefined` is used in lieu of `unspecified`
// @see https://bugzilla.mozilla.org/show_bug.cgi?id=1624668
const VALID_SAMESITE_VALUES = ['no_restriction', 'lax', 'strict']

const normalizeSameSite = (sameSite) => {
  if (_.isUndefined(sameSite)) {
    return sameSite
  }

  if (_.isString(sameSite)) {
    sameSite = sameSite.toLowerCase()
  }

  if (sameSite === 'none') {
    // "None" is the value sent in the header for `no_restriction`, so allow it here for convenience
    sameSite = 'no_restriction'
  }

  return sameSite
}

module.exports = function (Commands, Cypress, cy, state, config) {
  const automateCookies = function (event, obj = {}, log, timeout) {
    const automate = () => {
      return Cypress.automation(event, mergeDefaults(obj))
      .catch((err) => {
        return $errUtils.throwErr(err, { onFail: log })
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
      return $errUtils.throwErrByPath('cookies.timed_out', {
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

  const handleBackendError = (command, action, onFail) => {
    return (err) => {
      if (!_.includes(err.stack, err.message)) {
        err.stack = `${err.message}\n${err.stack}`
      }

      if (err.name === 'CypressError') {
        throw err
      }

      $errUtils.throwErrByPath('cookies.backend_error', {
        args: {
          action,
          cmd: command,
          browserDisplayName: Cypress.browser.displayName,
          error: err,
        },
        onFail,
        errProps: {
          appendToStack: {
            title: 'From Node.js Internals',
            content: err.stack,
          },
        },
      })
    }
  }

  // TODO: handle failure here somehow
  // maybe by tapping into the Cypress reset
  // stuff, or handling this in the runner itself?
  Cypress.on('test:before:run:async', () => {
    return getAndClear()
  })

  return Commands.addAll({
    getCookie (name, options = {}) {
      const userOptions = options

      options = _.defaults({}, userOptions, {
        log: true,
        timeout: config('responseTimeout'),
      })

      if (options.log) {
        options._log = Cypress.log({
          message: name,
          timeout: options.timeout,
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
        $errUtils.throwErrByPath('getCookie.invalid_argument', { onFail })
      }

      return automateCookies('get:cookie', { name }, options._log, options.timeout)
      .then((resp) => {
        options.cookie = resp

        return resp
      })
      .catch(handleBackendError('getCookie', 'reading the requested cookie from', onFail))
    },

    getCookies (options = {}) {
      const userOptions = options

      options = _.defaults({}, userOptions, {
        log: true,
        timeout: config('responseTimeout'),
      })

      if (options.log) {
        options._log = Cypress.log({
          message: '',
          timeout: options.timeout,
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
      .catch(handleBackendError('getCookies', 'reading cookies from', options._log))
    },

    setCookie (name, value, options = {}) {
      const userOptions = options

      options = _.defaults({}, userOptions, {
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
          timeout: options.timeout,
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

      cookie.sameSite = normalizeSameSite(cookie.sameSite)

      if (!_.isUndefined(cookie.sameSite) && !VALID_SAMESITE_VALUES.includes(cookie.sameSite)) {
        $errUtils.throwErrByPath('setCookie.invalid_samesite', {
          onFail,
          args: {
            value: options.sameSite, // for clarity, throw the error with the user's unnormalized option
            validValues: VALID_SAMESITE_VALUES,
          },
        })
      }

      // cookies with SameSite=None must also set Secure
      // @see https://web.dev/samesite-cookies-explained/#changes-to-the-default-behavior-without-samesite
      if (cookie.sameSite === 'no_restriction' && cookie.secure !== true) {
        $errUtils.throwErrByPath('setCookie.secure_not_set_with_samesite_none', {
          onFail,
          args: {
            value: options.sameSite, // for clarity, throw the error with the user's unnormalized option
          },
        })
      }

      if (!_.isString(name) || !_.isString(value)) {
        $errUtils.throwErrByPath('setCookie.invalid_arguments', { onFail })
      }

      return automateCookies('set:cookie', cookie, options._log, options.timeout)
      .then((resp) => {
        options.cookie = resp

        return resp
      }).catch(handleBackendError('setCookie', 'setting the requested cookie in', onFail))
    },

    clearCookie (name, options = {}) {
      const userOptions = options

      options = _.defaults({}, userOptions, {
        log: true,
        timeout: config('responseTimeout'),
      })

      if (options.log) {
        options._log = Cypress.log({
          message: name,
          timeout: options.timeout,
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
        $errUtils.throwErrByPath('clearCookie.invalid_argument', { onFail })
      }

      // TODO: prevent clearing a cypress namespace
      return automateCookies('clear:cookie', { name }, options._log, options.timeout)
      .then((resp) => {
        options.cookie = resp

        // null out the current subject
        return null
      })
      .catch(handleBackendError('clearCookie', 'clearing the requested cookie in', onFail))
    },

    clearCookies (options = {}) {
      const userOptions = options

      options = _.defaults({}, userOptions, {
        log: true,
        timeout: config('responseTimeout'),
      })

      if (options.log) {
        options._log = Cypress.log({
          message: '',
          timeout: options.timeout,
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
      .catch(handleBackendError('clearCookies', 'clearing cookies in', options._log))
    },
  })
}
