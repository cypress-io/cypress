import _ from 'lodash'
import Promise from 'bluebird'

import $utils from '../../cypress/utils'
import $errUtils from '../../cypress/error_utils'
import type { Log } from '../../cypress/log'

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

function validateDomainOption (domain: any, commandName: string, log: Log | undefined) {
  if (domain !== undefined && domain !== null && !_.isString(domain)) {
    $errUtils.throwErrByPath('cookies.invalid_domain', {
      onFail: log,
      args: {
        cmd: commandName,
        domain,
      },
    })
  }
}

export default function (Commands, Cypress, cy, state, config) {
  const getDefaultDomain = () => {
    const hostname = state('window')?.location.hostname

    // if hostname is undefined, the AUT is on about:blank, so use the
    // spec frame's hostname instead
    return hostname || window.location.hostname
  }

  const mergeDefaults = function (obj) {
    // set the default domain to be the AUT hostname
    const merge = (o) => {
      return _.defaults(o, { domain: getDefaultDomain() })
    }

    if (_.isArray(obj)) {
      return _.map(obj, merge)
    }

    return merge(obj)
  }

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

      return automateCookies('clear:cookies', resp, log, timeout)
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

  return Commands.addAll({
    getCookie (name, userOptions: Cypress.CookieOptions = {}) {
      const options: Cypress.CookieOptions = _.defaults({}, userOptions, {
        log: true,
      })

      const responseTimeout = options.timeout || config('responseTimeout')

      options.timeout = options.timeout || config('defaultCommandTimeout')

      let cookie: Cypress.Cookie
      let log: Log | undefined

      if (options.log) {
        log = Cypress.log({
          message: userOptions.domain ? [name, { domain: userOptions.domain }] : name,
          timeout: responseTimeout,
          consoleProps () {
            const obj = {}

            if (cookie) {
              obj['Yielded'] = cookie
            } else {
              obj['Yielded'] = 'null'
              obj['Note'] = `No cookie with the name: '${name}' was found.`
            }

            return obj
          },
        })
      }

      if (!_.isString(name)) {
        $errUtils.throwErrByPath('getCookie.invalid_argument', { onFail: log })
      }

      validateDomainOption(options.domain, 'getCookie', log)

      return cy.retryIfCommandAUTOriginMismatch(() => {
        return automateCookies('get:cookie', { name, domain: options.domain }, log, responseTimeout)
        .then(pickCookieProps)
        .tap((result) => {
          cookie = result
        })
        .catch(handleBackendError('getCookie', 'reading the requested cookie from', log))
      }, options.timeout)
    },

    getCookies (userOptions: Cypress.CookieOptions = {}) {
      const options: Cypress.CookieOptions = _.defaults({}, userOptions, {
        log: true,
      })

      const responseTimeout = options.timeout || config('responseTimeout')

      options.timeout = options.timeout || config('defaultCommandTimeout')

      let cookies: Cypress.Cookie[] = []
      let log: Log | undefined

      if (options.log) {
        log = Cypress.log({
          message: userOptions.domain ? { domain: userOptions.domain } : '',
          timeout: responseTimeout,
          consoleProps () {
            const obj = {}

            if (cookies.length) {
              obj['Yielded'] = cookies
              obj['Num Cookies'] = cookies.length
            }

            return obj
          },
        })
      }

      validateDomainOption(options.domain, 'getCookies', log)

      return cy.retryIfCommandAUTOriginMismatch(() => {
        return automateCookies('get:cookies', _.pick(options, 'domain'), log, responseTimeout)
        .then(pickCookieProps)
        .tap((result: Cypress.Cookie[]) => {
          cookies = result
        })
        .catch(handleBackendError('getCookies', 'reading cookies from', log))
      }, options.timeout)
    },

    setCookie (name, value, userOptions: Partial<Cypress.SetCookieOptions> = {}) {
      const options: Partial<Cypress.SetCookieOptions> = _.defaults({}, userOptions, {
        path: '/',
        secure: false,
        httpOnly: false,
        log: true,
        expiry: $utils.addTwentyYears(),
      })

      const responseTimeout = options.timeout || config('responseTimeout')

      options.timeout = options.timeout || config('defaultCommandTimeout')

      const cookie = _.extend(pickCookieProps(options), { name, value })
      let resultingCookie: Cypress.Cookie
      let log: Log | undefined

      if (options.log) {
        log = Cypress.log({
          message: userOptions.domain ? [name, value, { domain: userOptions.domain }] : [name, value],
          timeout: responseTimeout,
          consoleProps () {
            const obj = {}

            if (resultingCookie) {
              obj['Yielded'] = resultingCookie
            }

            return obj
          },
        })
      }

      cookie.sameSite = normalizeSameSite(cookie.sameSite)

      if (!_.isUndefined(cookie.sameSite) && !VALID_SAMESITE_VALUES.includes(cookie.sameSite)) {
        $errUtils.throwErrByPath('setCookie.invalid_samesite', {
          onFail: log,
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
          onFail: log,
          args: {
            value: options.sameSite, // for clarity, throw the error with the user's unnormalized option
          },
        })
      }

      if (!_.isString(name) || !_.isString(value)) {
        $errUtils.throwErrByPath('setCookie.invalid_arguments', { onFail: log })
      }

      if (name.startsWith('__Secure-') && cookieValidatesSecurePrefix(options)) {
        $errUtils.throwErrByPath('setCookie.secure_prefix', { onFail: log })
      }

      if (name.startsWith('__Host-') && cookieValidatesHostPrefix(options)) {
        $errUtils.throwErrByPath('setCookie.host_prefix', { onFail: log })
      }

      validateDomainOption(options.domain, 'setCookie', log)

      Cypress.emit('set:cookie', cookie)

      return cy.retryIfCommandAUTOriginMismatch(() => {
        return automateCookies('set:cookie', cookie, log, responseTimeout)
        .then(pickCookieProps)
        .tap((result) => {
          resultingCookie = result
        }).catch(handleBackendError('setCookie', 'setting the requested cookie in', log))
      }, options.timeout)
    },

    clearCookie (name, userOptions: Cypress.CookieOptions = {}) {
      const options: Cypress.CookieOptions = _.defaults({}, userOptions, {
        log: true,
      })

      const responseTimeout = options.timeout || config('responseTimeout')

      options.timeout = options.timeout || config('defaultCommandTimeout')

      let cookie: Cypress.Cookie
      let log: Log | undefined

      if (options.log) {
        log = Cypress.log({
          message: userOptions.domain ? [name, { domain: userOptions.domain }] : [name],
          timeout: responseTimeout,
          consoleProps () {
            const obj = {}

            obj['Yielded'] = 'null'

            if (cookie) {
              obj['Cleared Cookie'] = cookie
            } else {
              obj['Note'] = `No cookie with the name: '${name}' was found or removed.`
            }

            return obj
          },
        })
      }

      if (!_.isString(name)) {
        $errUtils.throwErrByPath('clearCookie.invalid_argument', { onFail: log })
      }

      validateDomainOption(options.domain, 'clearCookie', log)

      Cypress.emit('clear:cookie', name)

      // TODO: prevent clearing a cypress namespace
      return cy.retryIfCommandAUTOriginMismatch(() => {
        return automateCookies('clear:cookie', { name, domain: options.domain }, log, responseTimeout)
        .then(pickCookieProps)
        .then((result) => {
          cookie = result

          // null out the current subject
          return null
        })
        .catch(handleBackendError('clearCookie', 'clearing the requested cookie in', log))
      }, options.timeout)
    },

    clearCookies (userOptions: Cypress.CookieOptions = {}) {
      const options: Cypress.CookieOptions = _.defaults({}, userOptions, {
        log: true,
      })

      const responseTimeout = options.timeout || config('responseTimeout')

      options.timeout = options.timeout || config('defaultCommandTimeout')

      let cookies: Cypress.Cookie[] = []
      let log: Log | undefined

      if (options.log) {
        log = Cypress.log({
          message: userOptions.domain ? { domain: userOptions.domain } : '',
          timeout: responseTimeout,
          consoleProps () {
            const obj = {}

            obj['Yielded'] = 'null'

            if (cookies.length) {
              obj['Cleared Cookies'] = cookies
              obj['Num Cookies'] = cookies.length
            } else {
              obj['Note'] = 'No cookies were found or removed.'
            }

            return obj
          },
        })
      }

      validateDomainOption(options.domain, 'clearCookies', log)

      Cypress.emit('clear:cookies')

      return cy.retryIfCommandAUTOriginMismatch(() => {
        return getAndClear(log, responseTimeout, { domain: options.domain })
        .then((result) => {
          cookies = result

          // null out the current subject
          return null
        }).catch((err) => {
        // make sure we always say to clearCookies
          err.message = err.message.replace('getCookies', 'clearCookies')
          throw err
        })
        .catch(handleBackendError('clearCookies', 'clearing cookies in', log))
      }, options.timeout)
    },
  })
}
