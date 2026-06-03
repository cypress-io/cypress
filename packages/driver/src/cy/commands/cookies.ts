import _ from 'lodash'
import Promise from 'bluebird'

import $utils from '../../cypress/utils'
import $errUtils from '../../cypress/error_utils'

const COOKIE_PROPS = 'name value path secure hostOnly httpOnly expiry domain sameSite'.split(' ')

function pickCookieProps (cookie) {
  if (!cookie) return cookie

  if (_.isArray(cookie)) {
    return cookie.map(pickCookieProps)
  }

  return _.pick(cookie, COOKIE_PROPS)
}

// from https://developer.chrome.com/extensions/cookies#type-SameSiteStatus
// note that `unspecified` is purposely omitted - Firefox and Chrome set
// different defaults, and Firefox lacks support for `unspecified`, so
// `undefined` is used in lieu of `unspecified`
// @see https://bugzilla.mozilla.org/show_bug.cgi?id=1624668
const VALID_SAMESITE_VALUES = ['no_restriction', 'lax', 'strict', 'unspecified']

function normalizeSameSite (sameSite?: string) {
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

function validateDomainOption (domain: any, commandName: string, log: Cypress.Log | undefined) {
  if (domain !== undefined && typeof domain !== 'string') {
    $errUtils.throwErrByPath('cookies.invalid_domain', {
      onFail: log,
      args: {
        cmd: commandName,
        domain,
      },
    })
  }
}

interface AutomationEventsAndOptions {
  'get:cookie': {
    domain: string
    name: string
  }
  'get:cookies': {
    domain?: string
  }
  'get:all:cookies': {}
  'set:cookie': {
    domain: string
    expiry: number
    httpOnly: boolean
    path: string
    secure: boolean
  }
  'clear:cookie': {
    domain: string
    name: string
  }
  'clear:cookies': Cypress.Cookie[]
}

type CommandName = 'getCookie' | 'getCookies' | 'getAllCookies' | 'setCookie' | 'clearCookie' | 'clearCookies' | 'clearAllCookies'

interface AutomateOptions<T extends keyof AutomationEventsAndOptions> {
  event: T
  options: AutomationEventsAndOptions[T]
  commandName: CommandName
  log?: Cypress.Log
  timeout: number
}

interface GetAndClearOptions {
  commandName: CommandName
  log?: Cypress.Log
  options: AutomationEventsAndOptions['get:cookies']
  timeout: number
}

export default function (Commands, Cypress: InternalCypress.Cypress, cy, state, config) {
  function getDefaultDomain () {
    const win = state('window') as Window | undefined
    const hostname = win?.location.hostname

    // if hostname is undefined, the AUT is on about:blank, so use the
    // spec frame's hostname instead
    return hostname || window.location.hostname
  }

  function automateCookies<T extends keyof AutomationEventsAndOptions> ({
    event,
    options,
    commandName,
    log,
    timeout,
  }: AutomateOptions<T>) {
    const automate = () => {
      return Cypress.automation(event, options)
      .catch((err) => {
        $errUtils.throwErr(err, { onFail: log })
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
          cmd: commandName,
          timeout,
        },
      })
    })
  }

  const getAndClear = ({ commandName, log, options, timeout }: GetAndClearOptions) => {
    return automateCookies({
      event: 'get:cookies',
      commandName,
      options,
      log,
      timeout,
    })
    .then((cookies: Cypress.Cookie[]) => {
      // bail early if we got no cookies!
      if (cookies && cookies.length === 0) {
        return cookies
      }

      return automateCookies({
        event: 'clear:cookies',
        commandName,
        options: cookies,
        log,
        timeout,
      })
    })
    .then(pickCookieProps)
  }

  const handleBackendError = (command: CommandName, action: string, onFail?: Cypress.Log) => {
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

  // getCookie and getCookies are query commands: they re-pull the cookie(s)
  // from the browser and re-run any attached assertions until they pass or the
  // command times out. This allows `cy.getCookie('foo').should('exist')` to wait
  // for a cookie that is set asynchronously (e.g. after a login request resolves).
  // @see https://github.com/cypress-io/cypress/issues/4802
  type CookieQuery = 'get:cookie' | 'get:cookies'

  interface CookieQueryParams {
    commandName: 'getCookie' | 'getCookies'
    event: CookieQuery
    action: string
    buildOptions: () => AutomationEventsAndOptions[CookieQuery]
    onResult: (result: any) => void
    log?: Cypress.Log
    timeout: number
  }

  // shared retry/automation plumbing for the getCookie(s) query commands.
  // returns a `fetch` function that (re-)reads cookies in the background and a
  // `getSubject` function suitable for returning from a query command.
  function createCookieQuery ({ commandName, event, action, buildOptions, onResult, log, timeout }: CookieQueryParams) {
    let hasResult = false
    let result: any
    let pending: Promise<void> | null = null
    let fatalError: Error | null = null
    let mostRecentError: Error = $errUtils.cypressErrByPath('cookies.timed_out', {
      args: { cmd: commandName, timeout },
    })

    const fetch = () => {
      // if a request is already in flight, wait for it instead of starting a new one
      if (pending) {
        return
      }

      hasResult = false
      pending = Promise.try(() => {
        // ensure we can communicate with the AUT before reading its location
        // (in getDefaultDomain) or cookies. if we can't, this throws and the
        // query retries until the AUT is reachable or the command times out.
        // @ts-expect-error
        Cypress.ensure.commandCanCommunicateWithAUT(cy)

        return Cypress.automation(event, buildOptions())
      })
      .timeout(timeout)
      .then(pickCookieProps)
      .then((res) => {
        result = res
        hasResult = true
        onResult(res)
      })
      .catch(Promise.TimeoutError, () => {
        mostRecentError = $errUtils.cypressErrByPath('cookies.timed_out', {
          args: { cmd: commandName, timeout },
        })
      })
      .catch((err) => {
        // a CypressError here (e.g. a cross-origin AUT mismatch) is retryable -
        // keep retrying until the AUT is reachable or the command times out
        if (err.name === 'CypressError') {
          mostRecentError = err

          return
        }

        // any other error is an unexpected backend failure - surface it
        // immediately rather than retrying until the command times out
        try {
          handleBackendError(commandName, action, log)(err)
        } catch (cypressErr: any) {
          cypressErr.retry = false
          fatalError = cypressErr
          mostRecentError = cypressErr
        }
      })
      .finally(() => {
        pending = null
      })
    }

    const getSubject = () => {
      if (fatalError) {
        throw fatalError
      }

      // once we've read the cookie(s), that remains the result until a failed
      // assertion clears it (via the command's onFail handler) and re-fetches.
      if (hasResult) {
        return result
      }

      fetch()

      // no result yet - the request is pending. throw and wait for the promise
      // to resolve on a future retry.
      throw mostRecentError
    }

    return { fetch, getSubject }
  }

  Commands.addQuery('getCookie', function getCookie (name: string, userOptions: Cypress.CookieOptions = {}) {
    const options: Cypress.CookieOptions = _.defaults({}, userOptions, {
      log: true,
    })

    const timeout = options.timeout || config('responseTimeout')

    this.set('timeout', timeout)

    let cookie: Cypress.Cookie | null = null
    const log: Cypress.Log | undefined = Cypress.log({
      message: userOptions.domain ? [name, { domain: userOptions.domain }] : name,
      hidden: !options.log,
      timeout,
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

    if (!_.isString(name)) {
      $errUtils.throwErrByPath('getCookie.invalid_argument', { onFail: log })
    }

    validateDomainOption(userOptions.domain, 'getCookie', log)

    const { fetch, getSubject } = createCookieQuery({
      commandName: 'getCookie',
      event: 'get:cookie',
      action: 'reading the requested cookie from',
      // getDefaultDomain() is called here (rather than above where default
      // options are set) so a cross-origin access error is retried.
      buildOptions: () => ({ name, domain: options.domain || getDefaultDomain() }),
      onResult: (result) => {
        cookie = result
      },
      log,
      timeout,
    })

    // when an assertion attached to this command fails, throw away the existing
    // result and re-read the cookie so the assertion can be retried.
    this.set('onFail', () => fetch())

    return getSubject
  })

  Commands.addQuery('getCookies', function getCookies (userOptions: Cypress.CookieOptions = {}) {
    const options: Cypress.CookieOptions = _.defaults({}, userOptions, {
      log: true,
    })

    const timeout = options.timeout || config('responseTimeout')

    this.set('timeout', timeout)

    let cookies: Cypress.Cookie[] = []
    const log: Cypress.Log | undefined = Cypress.log({
      message: userOptions.domain ? { domain: userOptions.domain } : '',
      hidden: !options.log,
      timeout,
      consoleProps () {
        const obj = {}

        if (cookies.length) {
          obj['Yielded'] = cookies
          obj['Num Cookies'] = cookies.length
        }

        return obj
      },
    })

    validateDomainOption(userOptions.domain, 'getCookies', log)

    const { fetch, getSubject } = createCookieQuery({
      commandName: 'getCookies',
      event: 'get:cookies',
      action: 'reading cookies from',
      // getDefaultDomain() is called here (rather than above where default
      // options are set) so a cross-origin access error is retried.
      buildOptions: () => ({ domain: options.domain || getDefaultDomain() }),
      onResult: (result: Cypress.Cookie[]) => {
        cookies = result
      },
      log,
      timeout,
    })

    // when an assertion attached to this command fails, throw away the existing
    // result and re-read the cookies so the assertion can be retried.
    this.set('onFail', () => fetch())

    return getSubject
  })

  return Commands.addAll({
    getAllCookies (userOptions: Partial<Cypress.Loggable & Cypress.Timeoutable> = {}) {
      const options: Cypress.CookieOptions = _.defaults({}, userOptions, {
        log: true,
        timeout: config('responseTimeout'),
      })

      let cookies: Cypress.Cookie[] = []
      const log: Cypress.Log | undefined = Cypress.log({
        message: '',
        hidden: !options.log,
        timeout: options.timeout,
        consoleProps () {
          const obj = {}

          if (cookies.length) {
            obj['Yielded'] = cookies
            obj['Num Cookies'] = cookies.length
          }

          return obj
        },
      })

      return automateCookies({
        event: 'get:cookies',
        commandName: 'getAllCookies',
        options: {},
        timeout: options.timeout!,
        log,
      })
      .then(pickCookieProps)
      .tap((result: Cypress.Cookie[]) => {
        cookies = result
      })
      .catch(handleBackendError('getAllCookies', 'reading cookies from', log))
    },

    setCookie (name: string, value: string, userOptions: Partial<Cypress.SetCookieOptions> = {}) {
      const options: Partial<Cypress.SetCookieOptions> = _.defaults({}, userOptions, {
        path: '/',
        secure: false,
        httpOnly: false,
        hostOnly: false,
        log: true,
        expiry: $utils.addTwentyYears(),
      })

      const responseTimeout = options.timeout || config('responseTimeout')

      options.timeout = options.timeout || config('defaultCommandTimeout')

      const cookie = _.extend(pickCookieProps(options), { name, value })
      let resultingCookie: Cypress.Cookie
      const log: Cypress.Log | undefined = Cypress.log({
        message: userOptions.domain ? [name, value, { domain: userOptions.domain }] : [name, value],
        hidden: !options.log,
        timeout: responseTimeout,
        consoleProps () {
          const obj = {}

          if (resultingCookie) {
            obj['Yielded'] = resultingCookie
          }

          return obj
        },
      })

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

      validateDomainOption(userOptions.domain, 'setCookie', log)

      Cypress.emit('set:cookie', cookie)

      return cy.retryIfCommandAUTOriginMismatch(() => {
        // getDefaultDomain() needs to be called inside
        // cy.retryIfCommandAUTOriginMismatch() (instead of above
        // where default options are set) in case it errors
        cookie.domain = options.domain || getDefaultDomain()

        return automateCookies({
          event: 'set:cookie',
          commandName: 'setCookie',
          options: cookie,
          timeout: responseTimeout,
          log,
        })
        .then(pickCookieProps)
        .tap((result) => {
          resultingCookie = result
        }).catch(handleBackendError('setCookie', 'setting the requested cookie in', log))
      }, options.timeout)
    },

    clearCookie (name: string, userOptions: Cypress.CookieOptions = {}) {
      const options: Cypress.CookieOptions = _.defaults({}, userOptions, {
        log: true,
      })

      const responseTimeout = options.timeout || config('responseTimeout')

      options.timeout = options.timeout || config('defaultCommandTimeout')

      let cookie: Cypress.Cookie
      const log: Cypress.Log | undefined = Cypress.log({
        message: userOptions.domain ? [name, { domain: userOptions.domain }] : [name],
        hidden: !options.log,
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

      if (!_.isString(name)) {
        $errUtils.throwErrByPath('clearCookie.invalid_argument', { onFail: log })
      }

      validateDomainOption(userOptions.domain, 'clearCookie', log)

      Cypress.emit('clear:cookie', name)

      // TODO: prevent clearing a cypress namespace
      return cy.retryIfCommandAUTOriginMismatch(() => {
        return automateCookies({
          event: 'clear:cookie',
          commandName: 'clearCookie',
          options: {
            name,
            // getDefaultDomain() needs to be called inside
            // cy.retryIfCommandAUTOriginMismatch() (instead of above
            // where default options are set) in case it errors
            domain: options.domain || getDefaultDomain(),
          },
          timeout: responseTimeout,
          log,
        })
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
      const log: Cypress.Log | undefined = Cypress.log({
        message: userOptions.domain ? { domain: userOptions.domain! } : '',
        hidden: !options.log,
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

      validateDomainOption(userOptions.domain, 'clearCookies', log)

      Cypress.emit('clear:cookies')

      return cy.retryIfCommandAUTOriginMismatch(() => {
        return getAndClear({
          log,
          timeout: responseTimeout,
          options: {
            // getDefaultDomain() needs to be called inside
            // cy.retryIfCommandAUTOriginMismatch() (instead of above
            // where default options are set) in case it errors
            domain: options.domain || getDefaultDomain(),
          },
          commandName: 'clearCookies',
        })
        .then((result) => {
          cookies = result

          // null out the current subject
          return null
        })
        .catch(handleBackendError('clearCookies', 'clearing cookies in', log))
      }, options.timeout)
    },

    clearAllCookies (userOptions: Partial<Cypress.Loggable & Cypress.Timeoutable>) {
      const options: Cypress.CookieOptions = _.defaults({}, userOptions, {
        log: true,
        timeout: config('responseTimeout'),
      })

      let cookies: Cypress.Cookie[] = []
      const log: Cypress.Log | undefined = Cypress.log({
        message: '',
        hidden: !options.log,
        timeout: options.timeout,
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

      Cypress.emit('clear:cookies')

      return getAndClear({
        log,
        timeout: options.timeout!,
        options: {},
        commandName: 'clearAllCookies',
      })
      .then((result) => {
        cookies = result

        // null out the current subject
        return null
      })
      .catch(handleBackendError('clearAllCookies', 'clearing cookies in', log))
    },
  })
}
