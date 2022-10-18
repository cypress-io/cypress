import _ from 'lodash'
import Promise from 'bluebird'

import $utils from '../../cypress/utils'
import $errUtils from '../../cypress/error_utils'
import type { Log } from '../../cypress/log'
import { $Location } from '../../cypress/location'

// TODO: add hostOnly to COOKIE_PROPS
// https://github.com/cypress-io/cypress/issues/363
// https://github.com/cypress-io/cypress/issues/17527
const COOKIE_PROPS = 'name value path secure httpOnly expiry domain sameSite'.split(' ')

const commandNameRe = /(:)(\w)/

function pickCookieProps (cookie) {
  if (!cookie) return cookie

  if (_.isArray(cookie)) {
    return cookie.map(pickCookieProps)
  }

  return _.pick(cookie, COOKIE_PROPS)
}

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

// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#Attributes
function cookieValidatesHostPrefix (options) {
  return options.secure === false || (options.path && options.path !== '/')
}
function cookieValidatesSecurePrefix (options) {
  return options.secure === false
}

interface InternalGetCookieOptions extends Partial<Cypress.Loggable & Cypress.Timeoutable> {
  _log?: Log
  cookie?: Cypress.Cookie
}

interface InternalGetCookiesOptions extends Partial<Cypress.Loggable & Cypress.Timeoutable> {
  _log?: Log
  cookies?: Cypress.Cookie[]
}

interface InternalSetCookieOptions extends Partial<Cypress.SetCookieOptions> {
  _log?: Log
  name: string
  cookie?: Cypress.Cookie
}

type InternalClearCookieOptions = InternalGetCookieOptions

interface InternalClearCookiesOptions extends Partial<Cypress.Loggable & Cypress.Timeoutable> {
  _log?: Log
  cookies?: Cypress.Cookie[]
  domain?: any
}

export default function (Commands, Cypress, cy, state, config) {
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

  const getAndClear = (log?, timeout?, options = {}) => {
    return automateCookies('get:cookies', options, log, timeout)
    .then((resp) => {
      // bail early if we got no cookies!
      if (resp && (resp.length === 0)) {
        return resp
      }

      // iterate over all of these and ensure none are allowed
      // or preserved
      const cookies = Cypress.Cookies.getClearableCookies(resp)

      return automateCookies('clear:cookies', cookies, log, timeout)
    })
    .then(pickCookieProps)
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

  // TODO: https://github.com/cypress-io/cypress/issues/23093
  // Cypress sessions will clear cookies on its own before each test.
  // Once experimentalSessionAndOrigin is made GA, remove this logic. Leave clearing
  // session data (cookies / local storage / session storage) to reset functionality.
  if (!Cypress.config('experimentalSessionAndOrigin')) {
    // TODO: handle failure here somehow
    // maybe by tapping into the Cypress reset
    // stuff, or handling this in the runner itself?
    Cypress.on('test:before:run:async', () => {
      return getAndClear()
    })
  }

  return Commands.addAll({
    getCookie (name, userOptions: Partial<Cypress.Loggable & Cypress.Timeoutable> = {}) {
      const options: InternalGetCookieOptions = _.defaults({}, userOptions, {
        log: true,
      })

      const responseTimeout = options.timeout || config('responseTimeout')

      options.timeout = options.timeout || config('defaultCommandTimeout')

      if (options.log) {
        options._log = Cypress.log({
          message: name,
          timeout: responseTimeout,
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

      return cy.retryIfCommandAUTOriginMismatch(() => {
        return automateCookies('get:cookie', { name }, options._log, responseTimeout)
        .then(pickCookieProps)
        .then((resp) => {
          options.cookie = resp

          return resp
        })
        .catch(handleBackendError('getCookie', 'reading the requested cookie from', onFail))
      }, options.timeout)
    },

    getCookies (userOptions: Partial<Cypress.Loggable & Cypress.Timeoutable> = {}) {
      const options: InternalGetCookiesOptions = _.defaults({}, userOptions, {
        log: true,
      })

      const responseTimeout = options.timeout || config('responseTimeout')

      options.timeout = options.timeout || config('defaultCommandTimeout')

      if (options.log) {
        options._log = Cypress.log({
          message: '',
          timeout: responseTimeout,
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

      return cy.retryIfCommandAUTOriginMismatch(() => {
        return automateCookies('get:cookies', _.pick(options, 'domain'), options._log, responseTimeout)
        .then(pickCookieProps)
        .then((resp) => {
          options.cookies = resp

          return resp
        })
        .catch(handleBackendError('getCookies', 'reading cookies from', options._log))
      }, options.timeout)
    },

    setCookie (name, value, userOptions: Partial<Cypress.SetCookieOptions> = {}) {
      const options: InternalSetCookieOptions = _.defaults({}, userOptions, {
        name,
        value,
        path: '/',
        secure: false,
        httpOnly: false,
        log: true,
        expiry: $utils.addTwentyYears(),
      })

      const responseTimeout = options.timeout || config('responseTimeout')

      options.timeout = options.timeout || config('defaultCommandTimeout')

      const cookie = pickCookieProps(options)

      if (options.log) {
        options._log = Cypress.log({
          message: [name, value],
          timeout: responseTimeout,
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

      if (options.name.startsWith('__Secure-') && cookieValidatesSecurePrefix(options)) {
        $errUtils.throwErrByPath('setCookie.secure_prefix', { onFail })
      }

      if (options.name.startsWith('__Host-') && cookieValidatesHostPrefix(options)) {
        $errUtils.throwErrByPath('setCookie.host_prefix', { onFail })
      }

      Cypress.emit('set:cookie', cookie)

      return cy.retryIfCommandAUTOriginMismatch(() => {
        return automateCookies('set:cookie', cookie, options._log, responseTimeout)
        .then(pickCookieProps)
        .then((resp) => {
          options.cookie = resp

          return resp
        }).catch(handleBackendError('setCookie', 'setting the requested cookie in', onFail))
      }, options.timeout)
    },

    clearCookie (name, userOptions: Partial<Cypress.Loggable & Cypress.Timeoutable> = {}) {
      const options: InternalClearCookieOptions = _.defaults({}, userOptions, {
        log: true,
      })

      const responseTimeout = options.timeout || config('responseTimeout')

      options.timeout = options.timeout || config('defaultCommandTimeout')

      if (options.log) {
        options._log = Cypress.log({
          message: name,
          timeout: responseTimeout,
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

      Cypress.emit('clear:cookie', name)

      // TODO: prevent clearing a cypress namespace
      return cy.retryIfCommandAUTOriginMismatch(() => {
        return automateCookies('clear:cookie', { name }, options._log, responseTimeout)
        .then(pickCookieProps)
        .then((resp) => {
          options.cookie = resp

          // null out the current subject
          return null
        })
        .catch(handleBackendError('clearCookie', 'clearing the requested cookie in', onFail))
      }, options.timeout)
    },

    clearCookies (userOptions: Partial<Cypress.Loggable & Cypress.Timeoutable> = {}) {
      const options: InternalClearCookiesOptions = _.defaults({}, userOptions, {
        log: true,
      })

      const responseTimeout = options.timeout || config('responseTimeout')

      options.timeout = options.timeout || config('defaultCommandTimeout')

      if (options.log) {
        options._log = Cypress.log({
          message: '',
          timeout: responseTimeout,
          consoleProps () {
            const c = options.cookies
            const obj = {}

            obj['Yielded'] = 'null'

            if (c && c.length) {
              obj['Cleared Cookies'] = c
              obj['Num Cookies'] = c.length
            } else {
              obj['Note'] = 'No cookies were found or removed.'
            }

            return obj
          },
        })
      }

      Cypress.emit('clear:cookies')

      return cy.retryIfCommandAUTOriginMismatch(() => {
        return getAndClear(options._log, responseTimeout, { domain: options.domain })
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
      }, options.timeout)
    },
  })
}
