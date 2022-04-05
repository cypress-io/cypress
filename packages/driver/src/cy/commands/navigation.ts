import _ from 'lodash'
import whatIsCircular from '@cypress/what-is-circular'
import UrlParse from 'url-parse'
import Promise from 'bluebird'

import $utils from '../../cypress/utils'
import $errUtils from '../../cypress/error_utils'
import { LogUtils } from '../../cypress/log'
import { bothUrlsMatchAndOneHasHash } from '../navigation'
import { $Location } from '../../cypress/location'

import debugFn from 'debug'
const debug = debugFn('cypress:driver:navigation')

let id = null
let previousUrlVisited: string | undefined
let hasVisitedAboutBlank: boolean = false
let currentlyVisitingAboutBlank: boolean = false
let knownCommandCausedInstability: boolean = false

const REQUEST_URL_OPTS = 'auth failOnStatusCode retryOnNetworkFailure retryOnStatusCodeFailure retryIntervals method body headers'
.split(' ')

const VISIT_OPTS = 'url log onBeforeLoad onLoad timeout requestTimeout'
.split(' ')
.concat(REQUEST_URL_OPTS)

const reset = (test: any = {}) => {
  knownCommandCausedInstability = false

  // continuously reset this
  // before each test run!
  previousUrlVisited = undefined

  // make sure we reset that we haven't
  // visited about blank again
  hasVisitedAboutBlank = false

  currentlyVisitingAboutBlank = false

  id = test.id
}

const VALID_VISIT_METHODS = ['GET', 'POST']

const isValidVisitMethod = (method) => {
  return _.includes(VALID_VISIT_METHODS, method)
}

const timedOutWaitingForPageLoad = (ms, log) => {
  debug('timedOutWaitingForPageLoad')

  const anticipatedCrossOriginHref = cy.state('anticipatingCrossOriginResponse')?.href

  // Were we anticipating a cross domain page when we timed out?
  if (anticipatedCrossOriginHref) {
    // We remain in an anticipating state until either a load even happens or a timeout.
    cy.isAnticipatingCrossOriginResponseFor(undefined)

    // By default origins is just this location.
    let originPolicies = [$Location.create(location.href).originPolicy]

    const currentCommand = cy.queue.state('current')

    if (currentCommand?.get('name') === 'origin') {
      // If the current command is a switchDomain command, we should have gotten a request on the origin it expects.
      originPolicies = [cy.state('latestActiveOriginPolicy')]
    } else if (Cypress.isMultiDomain && cy.queue.isOnLastCommand()) {
      // If this is multi-domain and the we're on the last command, we should have gotten a request on the origin of one of the parents.
      originPolicies = cy.state('parentOriginPolicies')
    }

    $errUtils.throwErrByPath('navigation.switch_to_domain_load_timed_out', {
      args: {
        configFile: Cypress.config('configFile'),
        ms,
        crossOriginUrl: $Location.create(anticipatedCrossOriginHref),
        originPolicies,
      },
      onFail: log,
    })
  } else {
    $errUtils.throwErrByPath('navigation.timed_out', {
      args: {
        configFile: Cypress.config('configFile'),
        ms,
      },
      onFail: log,
    })
  }
}

const cannotVisitDifferentOrigin = ({ remote, existing, previousUrlVisited, log, isMultiDomain = false }) => {
  const differences: string[] = []

  if (remote.protocol !== existing.protocol) {
    differences.push('protocol')
  }

  if (remote.port !== existing.port) {
    differences.push('port')
  }

  if (remote.superDomain !== existing.superDomain) {
    differences.push('superdomain')
  }

  const errOpts = {
    onFail: log,
    args: {
      differences: differences.join(', '),
      previousUrl: previousUrlVisited,
      attemptedUrl: remote.origin,
      isMultiDomain,
    },
  }

  $errUtils.throwErrByPath('visit.cannot_visit_different_origin', errOpts)
}

const specifyFileByRelativePath = (url, log) => {
  $errUtils.throwErrByPath('visit.specify_file_by_relative_path', {
    onFail: log,
    args: {
      attemptedUrl: url,
    },
  })
}

const aboutBlank = (cy, win) => {
  return new Promise((resolve) => {
    cy.once('window:load', resolve)

    return $utils.locHref('about:blank', win)
  })
}

const navigationChanged = (Cypress, cy, state, source, arg) => {
  // get the current url of our remote application
  const url = cy.getRemoteLocation('href')

  debug('navigation changed:', url)

  // dont trigger for empty url's or about:blank
  if (_.isEmpty(url) || (url === 'about:blank')) {
    return
  }

  // start storing the history entries
  let urls = state('urls') || []
  let urlPosition = state('urlPosition')

  if (urlPosition === undefined) {
    urlPosition = -1
  }

  const previousUrl = urls[urlPosition]

  // ensure our new url doesn't match whatever
  // the previous was. this prevents logging
  // additionally when the url didn't actually change
  if (url === previousUrl) {
    return
  }

  // else notify the world and log this event
  Cypress.action('cy:url:changed', url)

  const navHistoryDelta = state('navHistoryDelta')

  // if navigation was changed via a manipulation of the browser session we
  // need to update the urlPosition to match the position of the history stack
  // and we do not need to push a new url onto the urls state
  if (navHistoryDelta) {
    urlPosition = urlPosition + navHistoryDelta
    state('navHistoryDelta', undefined)
  } else {
    urls = urls.slice(0, urlPosition + 1)
    urls.push(url)
    urlPosition = urlPosition + 1
  }

  state('urls', urls)
  state('url', url)
  state('urlPosition', urlPosition)

  // don't output a command log for 'load' or 'before:load' events
  // return if source in command
  if (knownCommandCausedInstability) {
    return
  }

  // ensure our new url doesnt match whatever
  // the previous was. this prevents logging
  // additionally when the url didnt actually change
  Cypress.log({
    name: 'new url',
    message: url,
    event: true,
    type: 'parent',
    end: true,
    snapshot: true,
    consoleProps () {
      const obj: Record<string, any> = {
        'New Url': url,
      }

      if (source) {
        obj['Url Updated By'] = source
      }

      if (arg) {
        obj.Args = arg
      }

      return obj
    },
  })
}

const formSubmitted = (Cypress, e) => {
  Cypress.log({
    type: 'parent',
    name: 'form sub',
    message: '--submitting form--',
    event: true,
    end: true,
    snapshot: true,
    consoleProps () {
      return {
        'Originated From': e.target,
        'Args': e,
      }
    },
  })
}

const pageLoading = (bool, Cypress, state) => {
  if (state('pageLoading') === bool) {
    return
  }

  state('pageLoading', bool)

  Cypress.action('app:page:loading', bool)
}

const stabilityChanged = (Cypress, state, config, stable) => {
  debug('stabilityChanged:', stable)
  if (currentlyVisitingAboutBlank) {
    if (stable === false) {
      // if we're currently visiting about blank
      // and becoming unstable for the first time
      // notifiy that we're page loading
      pageLoading(true, Cypress, state)

      return
    }

    // else wait until after we finish visiting
    // about blank
    return
  }

  // let the world know that the app is page:loading
  pageLoading(!stable, Cypress, state)

  // if we aren't becoming unstable
  // then just return now
  if (stable !== false) {
    return
  }

  // if we purposefully just caused the page to load
  // (and thus instability) don't log this out
  if (knownCommandCausedInstability) {
    return
  }

  // bail if we dont have a runnable
  // because beforeunload can happen at any time
  // we may no longer be testing and thus dont
  // want to fire a new loading event
  // TODO
  // this may change in the future since we want
  // to add debuggability in the chrome console
  // which at that point we may keep runnable around
  if (!state('runnable')) {
    return
  }

  // this prevents a log occurring when we navigate to about:blank inbetween tests
  // e.g. for new sessions lifecycle
  if (!state('duringUserTestExecution')) {
    return
  }

  const options: Record<string, any> = {}

  _.defaults(options, {
    timeout: config('pageLoadTimeout'),
  })

  options._log = Cypress.log({
    type: 'parent',
    name: 'page load',
    message: '--waiting for new page to load--',
    event: true,
    timeout: options.timeout,
    consoleProps () {
      return {
        Note: 'This event initially fires when your application fires its \'beforeunload\' event and completes when your application fires its \'load\' event after the next page loads.',
      }
    },
  })

  cy.clearTimeout('page load')

  const onPageLoadErr = (err) => {
    state('onPageLoadErr', null)

    const { originPolicy } = $Location.create(window.location.href)

    try {
      $errUtils.throwErrByPath('navigation.cross_origin', {
        onFail: options._log,
        args: {
          configFile: Cypress.config('configFile'),
          message: err.message,
          originPolicy,
        },
      })
    } catch (error) {
      err = error

      return err
    }
  }

  state('onPageLoadErr', onPageLoadErr)

  const getRedirectionCount = (href) => {
    // object updated at test:before:run:async
    const count = state('redirectionCount')

    if (count[href] === undefined) {
      count[href] = 0
    }

    return count[href]
  }

  const updateRedirectionCount = (href) => {
    const count = state('redirectionCount')

    count[href]++
  }

  const loading = () => {
    const href = state('window').location.href
    const count = getRedirectionCount(href)
    const limit = config('redirectionLimit')

    if (count === limit) {
      $errUtils.throwErrByPath('navigation.reached_redirection_limit', {
        args: {
          href,
          limit,
        },
      })
    }

    updateRedirectionCount(href)

    debug('waiting for window:load')

    const promise = new Promise((resolve) => {
      const onWindowLoad = (win) => {
        // this prevents a log occurring when we navigate to about:blank inbetween tests
        if (!state('duringUserTestExecution')) return

        cy.state('onPageLoadErr', null)

        if (win.location.href === 'about:blank') {
          // we treat this as a system log since navigating to about:blank must have been caused by Cypress
          options._log.set({ message: '', name: 'Clear Page', type: 'system' }).snapshot().end()
        } else {
          options._log.set('message', '--page loaded--').snapshot().end()
        }

        resolve()
      }

      const onCrossDomainWindowLoad = ({ url }) => {
        options._log.set('message', '--page loaded--').snapshot().end()

        //Updating the URL state, This is done to display the new url event when we return to the primary domain
        let urls = state('urls') || []
        let urlPosition = state('urlPosition')

        if (urlPosition === undefined) {
          urlPosition = -1
        }

        urls.push(url)
        urlPosition = urlPosition + 1

        state('urls', urls)
        state('url', url)
        state('urlPosition', urlPosition)

        resolve()
      }

      const onCrossDomainFailure = (err) => {
        options._log.set('message', '--page loaded--').snapshot().end()
        options._log.set('state', 'failed')
        options._log.set('error', err)

        resolve()
      }

      const onInternalWindowLoad = (details) => {
        switch (details.type) {
          case 'same:domain':
            return onWindowLoad(details.window)
          case 'cross:domain':
            return onCrossDomainWindowLoad(details)
          case 'cross:domain:failure':
            return onCrossDomainFailure(details.error)
          default:
            throw new Error(`Unexpected internal:window:load type: ${details?.type}`)
        }
      }

      cy.once('internal:window:load', onInternalWindowLoad)

      // If this request is still pending after the test run, resolve it, no commands were waiting on its result.
      cy.once('test:after:run', () => {
        if (promise.isPending()) {
          options._log.set('message', '').end()
          resolve()
        }
      })
    })

    return promise
  }

  const reject = (err) => {
    const r = state('reject')

    if (r) {
      return r(err)
    }
  }

  try {
    return loading()
    .timeout(options.timeout, 'page load')
    .catch(Promise.TimeoutError, () => {
      // clean this up
      cy.state('onPageLoadErr', null)

      try {
        return timedOutWaitingForPageLoad(options.timeout, options._log)
      } catch (err) {
        return reject(err)
      }
    })
  } catch (e) {
    return reject(e)
  }
}

// filter the options to only the REQUEST_URL_OPTS options, normalize the timeout
// value to the responseTimeout, and add the isMultiDomain value.
//
// there are really two timeout values - pageLoadTimeout
// and the underlying responseTimeout. for the purposes
// of resolving the url, we only care about
// responseTimeout - since pageLoadTimeout is a driver
// and browser concern. therefore we normalize the options
// object and send 'responseTimeout' as options.timeout
// for the backend.
const normalizeOptions = (options) => {
  return _
  .chain(options)
  .pick(REQUEST_URL_OPTS)
  .extend({
    timeout: options.responseTimeout,
    isMultiDomain: Cypress.isMultiDomain,
  })
  .value()
}

type NotOkResponseError = Error & {
  gotResponse: boolean
}

type InvalidContentTypeError = Error & {
  invalidContentType: boolean
}

export default (Commands, Cypress, cy, state, config) => {
  reset()

  Cypress.on('test:before:run:async', () => {
    state('redirectionCount', {})

    // reset any state on the backend
    // TODO: this is a bug in e2e it needs to be returned
    return Cypress.backend('reset:server:state')
  })

  Cypress.on('test:before:run', reset)

  Cypress.on('stability:changed', (bool, event) => {
    // only send up page loading events when we're
    // not stable!
    stabilityChanged(Cypress, state, config, bool)
  })

  Cypress.on('navigation:changed', (source, arg) => {
    navigationChanged(Cypress, cy, state, source, arg)
  })

  Cypress.on('form:submitted', (e) => {
    formSubmitted(Cypress, e)
  })

  const visitFailedByErr = (err, url, fn) => {
    err.url = url

    Cypress.action('cy:visit:failed', err)

    return fn()
  }

  const requestUrl = (url, options = {}) => {
    return Cypress.backend(
      'resolve:url',
      url,
      normalizeOptions(options),
    )
    .then((resp: any = {}) => {
      if (!resp.isOkStatusCode) {
        // if we didn't even get an OK response
        // then immediately die
        const err: NotOkResponseError = new Error as any

        err.gotResponse = true
        _.extend(err, resp)

        throw err
      }

      if (!resp.isHtml) {
        // throw invalid contentType error
        const err: InvalidContentTypeError = new Error as any

        err.invalidContentType = true
        _.extend(err, resp)

        throw err
      }

      return resp
    })
  }

  Cypress.on('window:before:load', (contentWindow) => {
    // if a user-loaded script redefines document.querySelectorAll and
    // numTestsKeptInMemory is 0 (no snapshotting), jQuery thinks
    // that document.querySelectorAll is not available (it tests to see that
    // it's the native definition for some reason) and doesn't use it,
    // which can fail with a weird error if querying shadow dom.
    // this ensures that jQuery determines support for document.querySelectorAll
    // before user scripts are executed.
    // (when snapshotting is enabled, it can achieve the same thing if an XHR
    // causes it to snapshot before the user script is executed, but that's
    // not guaranteed to happen.)
    // https://github.com/cypress-io/cypress/issues/7676
    // this shouldn't error, but we wrap it to ignore potential errors
    // out of an abundance of caution
    try {
      cy.$$('body', contentWindow.document)
    } catch (e) {} // eslint-disable-line no-empty
  })

  Cypress.primaryOriginCommunicator.on('visit:url', ({ url }) => {
    $utils.iframeSrc(Cypress.$autIframe, url)
  })

  Commands.addAll({
    reload (...args) {
      let forceReload
      let userOptions
      const throwArgsErr = () => {
        $errUtils.throwErrByPath('reload.invalid_arguments')
      }

      switch (args.length) {
        case 0:
          forceReload = false
          userOptions = {}
          break

        case 1:
          if (_.isObject(args[0])) {
            userOptions = args[0]
          } else {
            forceReload = args[0]
          }

          break

        case 2:
          forceReload = args[0]
          userOptions = args[1]
          break

        default:
          throwArgsErr()
      }

      // clear the current timeout
      cy.clearTimeout('reload')

      let cleanup: (() => any) | null = null
      const options = _.defaults({}, userOptions, {
        log: true,
        timeout: config('pageLoadTimeout'),
      })

      const reload = () => {
        return new Promise((resolve) => {
          forceReload = forceReload || false
          userOptions = userOptions || {}

          if (!_.isObject(userOptions)) {
            throwArgsErr()
          }

          if (!_.isBoolean(forceReload)) {
            throwArgsErr()
          }

          if (options.log) {
            options._log = Cypress.log({ timeout: options.timeout })

            options._log.snapshot('before', { next: 'after' })
          }

          cleanup = () => {
            knownCommandCausedInstability = false

            return cy.removeListener('window:load', resolve)
          }

          knownCommandCausedInstability = true

          cy.once('window:load', resolve)

          return $utils.locReload(forceReload, state('window'))
        })
      }

      return reload()
      .timeout(options.timeout, 'reload')
      .catch(Promise.TimeoutError, () => {
        return timedOutWaitingForPageLoad(options.timeout, options._log)
      })
      .finally(() => {
        if (typeof cleanup === 'function') {
          cleanup()
        }

        return null
      })
    },

    go (numberOrString, userOptions = {}) {
      const options: Record<string, any> = _.defaults({}, userOptions, {
        log: true,
        timeout: config('pageLoadTimeout'),
      })

      if (options.log) {
        options._log = Cypress.log({ timeout: options.timeout })
      }

      const win = state('window')

      const goNumber = (num) => {
        if (num === 0) {
          $errUtils.throwErrByPath('go.invalid_number', { onFail: options._log })
        }

        let cleanup: (() => any) | null = null

        if (options._log) {
          options._log.snapshot('before', { next: 'after' })
        }

        const go = () => {
          return Promise.try(() => {
            let didUnload = false

            const beforeUnload = () => {
              didUnload = true
            }

            // clear the current timeout
            cy.clearTimeout()

            cy.once('window:before:unload', beforeUnload)

            const didLoad = new Promise((resolve) => {
              cleanup = function () {
                cy.removeListener('window:load', resolve)

                return cy.removeListener('window:before:unload', beforeUnload)
              }

              return cy.once('window:load', resolve)
            })

            knownCommandCausedInstability = true

            win.history.go(num)

            // need to set the attributes of 'go'
            // consoleProps here with win
            // make sure we resolve our go function
            // with the remove window (just like cy.visit)
            const retWin = () => state('window')

            return Promise
            .delay(100)
            .then(() => {
              knownCommandCausedInstability = false

              // if we've didUnload then we know we're
              // doing a full page refresh and we need
              // to wait until
              if (didUnload) {
                return didLoad.then(retWin)
              }

              return retWin()
            })
          })
        }

        return go()
        .timeout(options.timeout, 'go')
        .catch(Promise.TimeoutError, () => {
          return timedOutWaitingForPageLoad(options.timeout, options._log)
        }).finally(() => {
          if (typeof cleanup === 'function') {
            cleanup()
          }

          return null
        })
      }

      const goString = (str) => {
        switch (str) {
          case 'forward': return goNumber(1)
          case 'back': return goNumber(-1)
          default:
            return $errUtils.throwErrByPath('go.invalid_direction', {
              onFail: options._log,
              args: { str },
            })
        }
      }

      if (_.isFinite(numberOrString)) {
        return goNumber(numberOrString)
      }

      if (_.isString(numberOrString)) {
        return goString(numberOrString)
      }

      return $errUtils.throwErrByPath('go.invalid_argument', { onFail: options._log })
    },

    // TODO: Change the type of `any` to `Partial<Cypress.VisitOptions>`.
    visit (url, options: any = {}) {
      if (options.url && url) {
        $errUtils.throwErrByPath('visit.no_duplicate_url', { args: { optionsUrl: options.url, url } })
      }

      let userOptions = options

      if (_.isObject(url) && _.isEqual(userOptions, {})) {
        // options specified as only argument
        userOptions = url
        url = userOptions.url
      }

      if (!_.isString(url)) {
        $errUtils.throwErrByPath('visit.invalid_1st_arg')
      }

      const consoleProps = {}

      if (!_.isEmpty(userOptions)) {
        consoleProps['Options'] = _.pick(userOptions, VISIT_OPTS)
      }

      options = _.defaults({}, userOptions, {
        auth: null,
        failOnStatusCode: true,
        retryOnNetworkFailure: true,
        retryOnStatusCodeFailure: false,
        retryIntervals: [0, 100, 200, 200],
        method: 'GET',
        body: null,
        headers: {},
        log: true,
        responseTimeout: config('responseTimeout'),
        timeout: config('pageLoadTimeout'),
        onBeforeLoad () {},
        onLoad () {},
      })

      if (!_.isUndefined(options.qs) && !_.isObject(options.qs)) {
        $errUtils.throwErrByPath('visit.invalid_qs', { args: { qs: String(options.qs) } })
      }

      if (options.retryOnStatusCodeFailure && !options.failOnStatusCode) {
        $errUtils.throwErrByPath('visit.status_code_flags_invalid')
      }

      if (!isValidVisitMethod(options.method)) {
        $errUtils.throwErrByPath('visit.invalid_method', { args: { method: options.method } })
      }

      if (!_.isObject(options.headers)) {
        $errUtils.throwErrByPath('visit.invalid_headers')
      }

      const path = whatIsCircular(options.body)

      if (_.isObject(options.body) && path) {
        $errUtils.throwErrByPath('visit.body_circular', { args: { path } })
      }

      if (options.log) {
        let message = url

        if (options.method !== 'GET') {
          message = `${options.method} ${message}`
        }

        options._log = Cypress.log({
          message,
          timeout: options.timeout,
          consoleProps () {
            return consoleProps
          },
        })
      }

      url = $Location.normalize(url)

      if (Cypress.isMultiDomain) {
        url = $Location.qualifyWithBaseUrl(Cypress.state('originCommandBaseUrl'), url)
      } else {
        const baseUrl = config('baseUrl')

        if (baseUrl) {
          url = $Location.qualifyWithBaseUrl(baseUrl, url)
        }
      }

      const qs = options.qs

      if (qs) {
        url = $Location.mergeUrlWithParams(url, qs)
      }

      let cleanup: (() => any) | null = null

      // clear the current timeout
      cy.clearTimeout('visit')

      let win = state('window')
      const $autIframe = state('$autIframe')
      const runnable = state('runnable')

      const changeIframeSrc = (url, event) => {
        return new Promise((resolve, reject) => {
          let onBeforeLoadError

          const onBeforeLoad = (contentWindow) => {
            try {
              // when using the visit the document referrer should be set to an empty string
              Object.defineProperty(contentWindow.document, 'referrer', {
                value: '',
                enumerable: true,
                configurable: true,
              })

              options.onBeforeLoad?.call(runnable.ctx, contentWindow)
            } catch (err: any) {
              err.isCallbackError = true
              onBeforeLoadError = err
            }
          }

          const onEvent = (contentWindow) => {
            if (onBeforeLoadError) {
              reject(onBeforeLoadError)
            } else {
              resolve(contentWindow)
            }
          }

          // hashchange events fire too fast, so we use a different strategy.
          // they even resolve asynchronously before the application's
          // hashchange events have even fired
          // @see https://github.com/cypress-io/cypress/issues/652
          // also, the page doesn't fully reload on hashchange, so we
          // can't and don't wait for before:window:load
          if (event === 'hashchange') {
            win.addEventListener('hashchange', resolve)
          } else {
            // listen for window:before:load and reject if it errors
            // otherwise, resolve once this event fires
            cy.once(event, onEvent)
            cy.once('window:before:load', onBeforeLoad)
          }

          cleanup = () => {
            if (event === 'hashchange') {
              win.removeEventListener('hashchange', resolve)
            } else {
              cy.removeListener(event, onEvent)
              cy.removeListener('window:before:load', onBeforeLoad)
            }

            knownCommandCausedInstability = false
          }

          knownCommandCausedInstability = true

          // if this is multi-domain, we need to tell the primary to change
          // the AUT iframe since we don't have access to it
          if (Cypress.isMultiDomain) {
            return Cypress.specBridgeCommunicator.toPrimary('visit:url', { url })
          }

          return $utils.iframeSrc($autIframe, url)
        })
      }

      const onLoad = ({ runOnLoadCallback, totalTime }: {
        runOnLoadCallback?: boolean
        totalTime?: number
      }) => {
        // reset window on load
        win = state('window')

        // the onLoad callback should only be skipped if specified
        if (runOnLoadCallback !== false) {
          try {
            options.onLoad?.call(runnable.ctx, win)
          } catch (err: any) {
            // mark these as user callback errors, so they're treated differently
            // than Node.js errors when caught below
            err.isCallbackError = true
            throw err
          }
        }

        if (options._log) {
          options._log.set({
            url,
            totalTime,
          })
        }

        return Promise.resolve(win)
      }

      const go = () => {
        // hold onto our existing url
        const existing = $utils.locExisting()

        // TODO: $Location.resolve(existing.origin, url)

        if ($Location.isLocalFileUrl(url)) {
          return specifyFileByRelativePath(url, options._log)
        }

        let remoteUrl

        // in the case we are visiting a relative url
        // then prepend the existing origin to it
        // so we get the right remote url
        if (!$Location.isFullyQualifiedUrl(url)) {
          remoteUrl = $Location.fullyQualifyUrl(url)
        }

        let remote = $Location.create(remoteUrl || url)

        // reset auth options if we have them
        const a = remote.authObj

        if (a) {
          options.auth = a
        }

        // store the existing hash now since
        // we'll need to apply it later
        const existingHash = remote.hash || ''
        const existingAuth = remote.auth || ''

        if (previousUrlVisited && (remote.originPolicy !== existing.originPolicy)) {
          // if we've already visited a new superDomain
          // then die else we'd be in a terrible endless loop
          // we also need to disable retries to prevent the endless loop
          $utils.getTestFromRunnable(state('runnable'))._retries = 0

          const params = { remote, existing, previousUrlVisited, log: options._log }

          return cannotVisitDifferentOrigin(params)
        }

        // in multi-domain, the window may not have been set yet if nothing has been loaded in the secondary domain,
        // it's also possible for a new test to start and for a cross-domain failure to occur if the win is set but
        // the AUT hasn't yet navigated to the secondary domain
        if (win) {
          try {
            const current = $Location.create(win.location.href)

            // if all that is changing is the hash then we know
            // the browser won't actually make a new http request
            // for this, and so we need to resolve onLoad immediately
            // and bypass the actual visit resolution stuff
            if (bothUrlsMatchAndOneHasHash(current, remote)) {
              // https://github.com/cypress-io/cypress/issues/1311
              if (current.hash === remote.hash) {
                consoleProps['Note'] = 'Because this visit was to the same hash, the page did not reload and the onBeforeLoad and onLoad callbacks did not fire.'

                return onLoad({ runOnLoadCallback: false })
              }

              return changeIframeSrc(remote.href, 'hashchange')
              .then(() => {
                return onLoad({})
              })
            }
          } catch (e) {
            // if this is a cross-domain error, skip it
            if (e.name !== 'SecurityError') {
              throw e
            }
          }
        }

        if (existingHash) {
          // strip out the existing hash if we have one
          // before telling our backend to resolve this url
          url = url.replace(existingHash, '')
        }

        if (existingAuth) {
          // strip out the existing url if we have one
          url = url.replace(`${existingAuth}@`, '')
        }

        return requestUrl(url, options)
        .then((resp: any = {}) => {
          let { url, originalUrl, cookies, redirects, filePath } = resp

          // reapply the existing hash
          url += existingHash
          originalUrl += existingHash

          if (filePath) {
            consoleProps['File Served'] = filePath
          } else {
            if (url !== originalUrl) {
              consoleProps['Original Url'] = originalUrl
            }
          }

          if (options.log) {
            let message = options._log.get('message')

            if (redirects && redirects.length) {
              message = [message].concat(redirects).join(' -> ')
            }

            options._log.set({ message })
          }

          consoleProps['Resolved Url'] = url
          consoleProps['Redirects'] = redirects
          consoleProps['Cookies Set'] = cookies

          remote = $Location.create(url)

          // if the origin currently matches
          // then go ahead and change the iframe's src
          // and we're good to go
          if (remote.originPolicy === existing.originPolicy) {
            previousUrlVisited = remote.origin

            url = $Location.fullyQualifyUrl(url)

            return changeIframeSrc(url, 'window:load')
            .then(() => {
              return onLoad(resp)
            })
          }

          // if we are in multi-domain and the origin policies weren't the same,
          // we need to throw an error since the user tried to visit a new
          // domain which isn't allowed within a multi-domain block
          if (Cypress.isMultiDomain && win) {
            const existingAutOrigin = $Location.create(win.location.href).origin
            const params = { remote, existing, previousUrlVisited: existingAutOrigin, log: options._log, isMultiDomain: true }

            // TODO: need a better error message
            return cannotVisitDifferentOrigin(params)
          }

          // if we've already visited a new origin
          // then die else we'd be in a terrible endless loop
          if (previousUrlVisited) {
            const params = { remote, existing, previousUrlVisited, log: options._log }

            return cannotVisitDifferentOrigin(params)
          }

          // tell our backend we're changing domains
          // TODO: add in other things we want to preserve
          // state for like scrollTop
          let s: Record<string, any> = {
            currentId: id,
            tests: Cypress.runner.getTestsState(),
            startTime: Cypress.runner.getStartTime(),
            emissions: Cypress.runner.getEmissions(),
          }

          s.passed = Cypress.runner.countByTestState(s.tests, 'passed')
          s.failed = Cypress.runner.countByTestState(s.tests, 'failed')
          s.pending = Cypress.runner.countByTestState(s.tests, 'pending')
          s.numLogs = LogUtils.countLogsByTests(s.tests)

          return Cypress.action('cy:collect:run:state')
          .then((a = []) => {
            // merge all the states together holla'
            s = _.reduce(a, (memo, obj) => {
              return _.extend(memo, obj)
            }, s)

            return Cypress.backend('preserve:run:state', s)
          })
          .then(() => {
            // and now we must change the url to be the new
            // origin but include the test that we're currently on
            const newUri = new UrlParse(remote.origin)

            newUri
            .set('pathname', existing.pathname)
            .set('query', existing.search)
            .set('hash', existing.hash)

            // replace is broken in electron so switching
            // to href for now
            // $utils.locReplace(window, newUri.toString())
            $utils.locHref(newUri.toString(), window)

            // we are returning a Promise which never resolves
            // because we're changing top to be a brand new URL
            // and want to block the rest of our commands
            return Promise.delay(1e9)
          })
        })
        .catch((err) => {
          if (err.gotResponse || err.invalidContentType) {
            visitFailedByErr(err, err.originalUrl, () => {
              const args = {
                url: err.originalUrl,
                path: err.filePath,
                status: err.status,
                statusText: err.statusText,
                redirects: err.redirects,
                contentType: err.contentType,
              }

              let msg = ''

              if (err.gotResponse) {
                const type = err.filePath ? 'file' : 'http'

                msg = `visit.loading_${type}_failed`
              }

              if (err.invalidContentType) {
                msg = 'visit.loading_invalid_content_type'
              }

              $errUtils.throwErrByPath(msg, {
                onFail: options._log,
                args,
              })
            })

            return
          }

          // if it came from the user's onBeforeLoad or onLoad callback, it's
          // not a network failure, and we should throw the original error
          if (err.isCallbackError) {
            delete err.isCallbackError
            throw err
          }

          visitFailedByErr(err, url, () => {
            $errUtils.throwErrByPath('visit.loading_network_failed', {
              onFail: options._log,
              args: {
                url,
                error: err,
              },
              errProps: {
                appendToStack: {
                  title: 'From Node.js Internals',
                  content: err.stack,
                },
              },
            })
          })
        })
      }

      const visit = () => {
        // if we've visiting for the first time during
        // a test then we want to first visit about:blank
        // so that we nuke the previous state. subsequent
        // visits will not navigate to about:blank so that
        // our history entries are intact
        // skip for multi-domain since multi-domain requires
        // experimentalSessionSupport which already visits
        // about:blank between tests
        if (!hasVisitedAboutBlank && !Cypress.isMultiDomain) {
          hasVisitedAboutBlank = true
          currentlyVisitingAboutBlank = true

          return aboutBlank(cy, win)
          .then(() => {
            currentlyVisitingAboutBlank = false

            return go()
          })
        }

        return go()
      }

      return visit()
      .timeout(options.timeout, 'visit')
      .catch(Promise.TimeoutError, () => {
        return timedOutWaitingForPageLoad(options.timeout, options._log)
      }).finally(() => {
        if (typeof cleanup === 'function') {
          cleanup()
        }

        return null
      })
    },
  })
}
