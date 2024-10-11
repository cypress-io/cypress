import _ from 'lodash'
import UrlParse from 'url-parse'
import Promise from 'bluebird'

import $utils from '../../cypress/utils'
import $errUtils from '../../cypress/error_utils'
import { LogUtils, Log } from '../../cypress/log'
import { bothUrlsMatchAndOneHasHash } from '../navigation'
import { $Location, LocationObject } from '../../cypress/location'
import { isRunnerAbleToCommunicateWithAut } from '../../util/commandAUTCommunication'
import { whatIsCircular } from '../../util/what-is-circular'

import type { RunState } from '@packages/types'

import debugFn from 'debug'
const debug = debugFn('cypress:driver:navigation')

let id = null
let previouslyVisitedLocation: LocationObject | undefined
let knownCommandCausedInstability: boolean = false

const REQUEST_URL_OPTS = 'auth failOnStatusCode retryOnNetworkFailure retryOnStatusCodeFailure retryIntervals method body headers'
.split(' ')

const VISIT_OPTS = 'url log onBeforeLoad onLoad timeout requestTimeout'
.split(' ')
.concat(REQUEST_URL_OPTS)

const reset = (test: any = {}) => {
  knownCommandCausedInstability = false

  previouslyVisitedLocation = undefined

  id = test.id
}

const VALID_VISIT_METHODS = ['GET', 'POST']

const isValidVisitMethod = (method) => {
  return _.includes(VALID_VISIT_METHODS, method)
}

const timedOutWaitingForPageLoad = (ms, log) => {
  debug('timedOutWaitingForPageLoad')

  $errUtils.throwErrByPath('navigation.timed_out', {
    args: {
      configFile: Cypress.config('configFile'),
      ms,
    },
    onFail: log,
  })
}

const specifyFileByRelativePath = (url, log) => {
  $errUtils.throwErrByPath('visit.specify_file_by_relative_path', {
    onFail: log,
    args: {
      attemptedUrl: url,
    },
  })
}

const navigationChanged = async (Cypress, cy, state, source, arg) => {
  // get the current url of our remote application
  const remoteLocation = await cy.getCrossOriginRemoteLocation()
  const url = remoteLocation?.href

  debug('navigation changed:', url)

  // don't trigger for empty url's or about:blank
  if (_.isEmpty(url) || (url === 'about:blank') || (url === 'about:srcdoc')) {
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

  // Navigation changed events will be logged by the primary cypress instance.
  if (Cypress.isCrossOriginSpecBridge) {
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

const stabilityChanged = async (Cypress, state, config, stable) => {
  debug('stabilityChanged:', stable)

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

  // We need to sync this state value prior to checking it otherwise we will erroneously log a loading event after the test is complete.
  if (Cypress.isCrossOriginSpecBridge) {
    const duringUserTestExecution = await Cypress.specBridgeCommunicator.toPrimaryPromise({
      event: 'sync:during:user:test:execution',
    })

    cy.state('duringUserTestExecution', duringUserTestExecution)
  }

  // this prevents a log occurring when we navigate to about:blank in between tests
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
    // If this was triggered as part of a cypress command, eg, clicking a form submit button, we don't want our
    // snapshot timing tied to when the current command resolves. This empty 'snapshots' array prevents
    // command.snapshotLogs() - which the command queue calls as part of resolving each command - from creating a
    // snapshot too early.
    snapshots: [],
    consoleProps () {
      return {
        Note: 'This event initially fires when your application fires its \'beforeunload\' event and completes when your application fires its \'load\' event after the next page loads.',
      }
    },
  })

  cy.clearTimeout('page load')

  const onPageLoadErr = (err) => {
    state('onPageLoadErr', null)

    // If the error thrown is a cypress error, return it instead of throwing a cross origin error.
    if ($errUtils.isCypressErr(err)) {
      return err
    }

    const { origin } = $Location.create(window.location.href)

    try {
      $errUtils.throwErrByPath('navigation.cross_origin', {
        onFail: options._log,
        args: {
          configFile: Cypress.config('configFile'),
          message: err.message,
          origin,
        },
      })
    } catch (error) {
      err = error

      return err
    }
  }

  state('onPageLoadErr', onPageLoadErr)

  const getRedirectionCount = (href) => {
    // redirecting to about:blank should not count towards the redirection limit.
    if (href === 'about:blank') {
      return 0
    }

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
    debug('waiting for window:load')

    const promise = new Promise((resolve) => {
      const handleDownloadUnloadEvent = () => {
        cy.state('onPageLoadErr', null)
        cy.isStable(true, 'download')

        options._log
        .set({
          message: 'download fired beforeUnload event',
          consoleProps () {
            return {
              Note: 'This event fired when the download was initiated.',
            }
          },
        }).snapshot().end()

        resolve()
      }

      const onWindowLoad = ({ url }) => {
        const href = state('autLocation').href
        const count = getRedirectionCount(href)
        const limit = config('redirectionLimit')

        if (count === limit) {
          $errUtils.throwErrByPath('navigation.reached_redirection_limit', {
            onFail: options._log,
            args: {
              href,
              limit,
            },
          })
        }

        updateRedirectionCount(href)

        // this prevents a log occurring when we navigate to about:blank in-between tests
        if (!state('duringUserTestExecution')) return

        cy.state('onPageLoadErr', null)

        if (url === 'about:blank') {
          // we treat this as a system log since navigating to about:blank must have been caused by Cypress
          options._log?.set({ message: '', name: 'Clear page', type: 'system' }).snapshot().end()
        } else {
          options._log?.set('message', '--page loaded--').snapshot().end()
        }

        resolve()
      }

      const onCrossOriginFailure = (err) => {
        options._log?.set('message', '--page loaded--').snapshot().error(err)

        resolve()
      }

      const onInternalWindowLoad = (details) => {
        switch (details.type) {
          case 'same:origin':
            return onWindowLoad(details)
          case 'cross:origin:failure':
            return onCrossOriginFailure(details.error)
          default:
            throw new Error(`Unexpected internal:window:load type: ${details?.type}`)
        }
      }

      cy.once('download:received', handleDownloadUnloadEvent)
      cy.once('internal:window:load', onInternalWindowLoad)

      // If this request is still pending after the test run, resolve it, no commands were waiting on its result.
      cy.once('test:after:run', () => {
        if (promise.isPending()) {
          options._log?.set('message', '').end()
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
// value to the responseTimeout, and add the isCrossOriginSpecBridge value.
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
    isFromSpecBridge: Cypress.isCrossOriginSpecBridge,
    hasAlreadyVisitedUrl: options.hasAlreadyVisitedUrl,
  })
  .value()
}

type NotOkResponseError = Error & {
  gotResponse: boolean
}

type InvalidContentTypeError = Error & {
  invalidContentType: boolean
}

interface InternalVisitOptions extends Partial<Cypress.VisitOptions> {
  _log?: Log
  hasAlreadyVisitedUrl: boolean
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

          options._log = Cypress.log({ timeout: options.timeout, hidden: options.log === false })

          options._log?.snapshot('before', { next: 'after' })

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

      options._log = Cypress.log({ timeout: options.timeout, hidden: options.log === false })

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

    visit (url, userOptions: Partial<Cypress.VisitOptions> = {}) {
      if (userOptions.url && url) {
        $errUtils.throwErrByPath('visit.no_duplicate_url', { args: { optionsUrl: userOptions.url, url } })
      }

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

      const onLoadIsUserDefined = !!userOptions.onLoad
      const onBeforeLoadIsUserDefined = !!userOptions.onBeforeLoad

      const options: InternalVisitOptions = _.defaults({}, userOptions, {
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

      options.hasAlreadyVisitedUrl = !!previouslyVisitedLocation

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

      options._log = Cypress.log({
        message: options.method === 'GET' ? url : `${options.method} ${url}`,
        hidden: options.log === false,
        timeout: options.timeout,
        consoleProps () {
          return consoleProps
        },
      })

      url = $Location.normalize(url)

      if (Cypress.isCrossOriginSpecBridge) {
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

          // if this is a cross origin spec bridge, we need to tell the primary to change
          // the AUT iframe since we don't have access to it
          if (Cypress.isCrossOriginSpecBridge) {
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

        // If we are visiting a cross origin domain and have onLoad or onBeforeLoad options specified, throw an error.
        if (!isRunnerAbleToCommunicateWithAut()) {
          if (onLoadIsUserDefined) {
            $errUtils.throwErrByPath('visit.invalid_cross_origin_on_load', { args: { url, autLocation: Cypress.state('autLocation') }, errProps: { isCallbackError: true } })
          }

          if (onBeforeLoadIsUserDefined) {
            $errUtils.throwErrByPath('visit.invalid_cross_origin_on_before_load', { args: { url, autLocation: Cypress.state('autLocation') }, errProps: { isCallbackError: true } })
          }
        }

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

      const visit = () => {
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

        // in a cross origin spec bridge, the window may not have been set yet if nothing has been loaded in the secondary origin,
        // it's also possible for a new test to start and for a cross-origin failure to occur if the win is set but
        // the AUT hasn't yet navigated to the secondary origin
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
            // if this is a cross-origin error, skip it
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

          if (options._log) {
            let message = options._log!.get('message')

            if (redirects && redirects.length) {
              message = [message].concat(redirects).join(' -> ')
            }

            options._log!.set({ message })
          }

          consoleProps['Resolved Url'] = url
          consoleProps['Redirects'] = redirects
          consoleProps['Cookies Set'] = cookies

          remote = $Location.create(url)

          // if the origin currently matches,
          // or we have previously visited a location,
          // or are a spec bridge,
          // then go ahead and change the iframe's src
          // we use the super domain origin as we can interact with subdomains based document.domain set to the super domain origin
          if (remote.superDomainOrigin === existing.superDomainOrigin || previouslyVisitedLocation || Cypress.isCrossOriginSpecBridge) {
            if (!previouslyVisitedLocation) {
              previouslyVisitedLocation = remote
            }

            url = $Location.fullyQualifyUrl(url)

            return changeIframeSrc(url, 'window:load')
            .then(() => {
              return onLoad(resp)
            })
          }

          // tell our backend we're changing origins
          // TODO: add in other things we want to preserve
          // state for like scrollTop
          let runState: RunState = {
            currentId: id,
            tests: Cypress.runner.getTestsState(),
            startTime: Cypress.runner.getStartTime(),
            emissions: Cypress.runner.getEmissions(),
          }

          runState.passed = Cypress.runner.countByTestState(runState.tests, 'passed')
          runState.failed = Cypress.runner.countByTestState(runState.tests, 'failed')
          runState.pending = Cypress.runner.countByTestState(runState.tests, 'pending')
          runState.numLogs = LogUtils.countLogsByTests(runState.tests)

          return Cypress.action('cy:collect:run:state')
          .then((otherRunStates = []) => {
            // merge all the states together holla'
            runState = _.reduce(otherRunStates, (memo, obj) => {
              return _.extend(memo, obj)
            }, runState)

            return Cypress.backend('preserve:run:state', runState)
          })
          .then(() => {
            // and now we must change the url to be the new
            // origin but include the test that we're currently on
            const newUri = new UrlParse(remote.origin)

            newUri
            .set('pathname', existing.pathname)
            .set('query', existing.search)
            .set('hash', existing.hash)

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

          // if the err came from the user's onBeforeLoad/onLoad callback or is cross-origin, it's
          // not a network failure, and we should throw the original error
          if (err.isCallbackError || err.isCrossOrigin) {
            delete err.isCallbackError
            delete err.isCrossOrigin
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
