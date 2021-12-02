// @ts-nocheck

/* eslint-disable prefer-rest-params */
import _ from 'lodash'
import Promise from 'bluebird'
import debugFn from 'debug'
import { registerFetch } from 'unfetch'

import $dom from '../dom'
import $utils from './utils'
import $errUtils from './error_utils'
import $stackUtils from './stack_utils'

import { create as createChai, IChai } from '../cy/chai'
import { create as createXhr, IXhr } from '../cy/xhrs'
import { create as createJQuery, IJQuery } from '../cy/jquery'
import { create as createAliases, IAliases } from '../cy/aliases'
import * as $Events from './events'
import { create as createEnsures, IEnsures } from '../cy/ensures'
import { create as createFocused, IFocused } from '../cy/focused'
import { create as createMouse, Mouse } from '../cy/mouse'
import { Keyboard } from '../cy/keyboard'
import { create as createLocation, ILocation } from '../cy/location'
import { create as createAssertions, IAssertions } from '../cy/assertions'
import $Listeners from '../cy/listeners'
import { $Chainer } from './chainer'
import { create as createTimer, ITimer } from '../cy/timers'
import { create as createTimeouts, ITimeouts } from '../cy/timeouts'
import { create as createRetries, IRetries } from '../cy/retries'
import { create as createStability, IStability } from '../cy/stability'
import $selection from '../dom/selection'
import { create as createSnapshots, ISnapshots } from '../cy/snapshots'
import { $Command } from './command'
import $CommandQueue from './command_queue'
import { initVideoRecorder } from '../cy/video-recorder'
import { TestConfigOverride } from '../cy/testConfigOverrides'

const debugErrors = debugFn('cypress:driver:errors')

const returnedFalse = (result) => {
  return result === false
}

const getContentWindow = ($autIframe) => {
  return $autIframe.prop('contentWindow')
}

const setWindowDocumentProps = function (contentWindow, state) {
  state('window', contentWindow)

  return state('document', contentWindow.document)
}

const setRemoteIframeProps = ($autIframe, state) => {
  return state('$autIframe', $autIframe)
}

function __stackReplacementMarker (fn, ctx, args) {
  return fn.apply(ctx, args)
}

declare let top: WindowProxy & { __alreadySetErrorHandlers__: boolean } | null

// We only set top.onerror once since we make it configurable:false
// but we update cy instance every run (page reload or rerun button)
let curCy: $Cy | null = null
const setTopOnError = function (Cypress, cy: $Cy) {
  if (curCy) {
    curCy = cy

    return
  }

  curCy = cy

  // prevent overriding top.onerror twice when loading more than one
  // instance of test runner.
  if (top.__alreadySetErrorHandlers__) {
    return
  }

  // eslint-disable-next-line @cypress/dev/arrow-body-multiline-braces
  const onTopError = (handlerType) => (event) => {
    const { originalErr, err, promise } = $errUtils.errorFromUncaughtEvent(handlerType, event)

    // in some callbacks like for cy.intercept, we catch the errors and then
    // rethrow them, causing them to get caught by the top frame
    // but they came from the spec, so we need to differentiate them
    const isSpecError = $errUtils.isSpecError(Cypress.config('spec'), err)

    const handled = curCy!.onUncaughtException({
      err,
      promise,
      handlerType,
      frameType: isSpecError ? 'spec' : 'app',
    })

    debugErrors('uncaught top error: %o', originalErr)

    $errUtils.logError(Cypress, handlerType, originalErr, handled)

    // return undefined so the browser does its default
    // uncaught exception behavior (logging to console)
    return undefined
  }

  top.addEventListener('error', onTopError('error'))

  // prevent Mocha from setting top.onerror
  Object.defineProperty(top, 'onerror', {
    set () {},
    get () {},
    configurable: false,
    enumerable: true,
  })

  top.addEventListener('unhandledrejection', onTopError('unhandledrejection'))

  top.__alreadySetErrorHandlers__ = true
}

// NOTE: this makes the cy object an instance
// TODO: refactor the 'create' method below into this class
class $Cy implements ITimeouts, IStability, IAssertions, IRetries, IJQuery, ILocation, ITimer, IChai, IXhr, IAliases, IEnsures, ISnapshots, IFocused {
  id: string
  state: any
  config: any
  devices: {
    keyboard: Keyboard
    mouse: Mouse
  }

  timeout: ITimeouts['timeout']
  clearTimeout: ITimeouts['clearTimeout']

  isStable: IStability['isStable']
  whenStable: IStability['whenStable']

  assert: IAssertions['assert']
  verifyUpcomingAssertions: IAssertions['verifyUpcomingAssertions']

  retry: IRetries['retry']

  getRemotejQueryInstance: IJQuery['getRemotejQueryInstance']

  getRemoteLocation: ILocation['getRemoteLocation']

  fireBlur: IFocused['fireBlur']
  fireFocus: IFocused['fireFocus']
  needsFocus: IFocused['needsFocus']
  getFocused: IFocused['getFocused']

  pauseTimers: ITimer['pauseTimers']

  expect: IChai['expect']

  getIndexedXhrByAlias: IXhr['getIndexedXhrByAlias']
  getRequestsByAlias: IXhr['getRequestsByAlias']

  addAlias: IAliases['addAlias']
  getAlias: IAliases['getAlias']
  getNextAlias: IAliases['getNextAlias']
  validateAlias: IAliases['validateAlias']
  aliasNotFoundFor: IAliases['aliasNotFoundFor']
  getXhrTypeByAlias: IAliases['getXhrTypeByAlias']

  ensureElement: IEnsures['ensureElement']
  ensureAttached: IEnsures['ensureAttached']
  ensureWindow: IEnsures['ensureWindow']
  ensureDocument: IEnsures['ensureDocument']
  ensureElDoesNotHaveCSS: IEnsures['ensureElDoesNotHaveCSS']
  ensureElementIsNotAnimating: IEnsures['ensureElementIsNotAnimating']
  ensureNotDisabled: IEnsures['ensureNotDisabled']
  ensureVisibility: IEnsures['ensureVisibility']
  ensureStrictVisibility: IEnsures['ensureStrictVisibility']
  ensureNotHiddenByAncestors: IEnsures['ensureNotHiddenByAncestors']
  ensureExistence: IEnsures['ensureExistence']
  ensureElExistence: IEnsures['ensureElExistence']
  ensureDescendents: IEnsures['ensureDescendents']
  ensureValidPosition: IEnsures['ensureValidPosition']
  ensureScrollability: IEnsures['ensureScrollability']
  ensureNotReadonly: IEnsures['ensureNotReadonly']

  createSnapshot: ISnapshots['createSnapshot']
  detachDom: ISnapshots['detachDom']
  getStyles: ISnapshots['getStyles']

  // Private methods
  resetTimer: ReturnType<typeof createTimer>['reset']

  ensureSubjectByType: ReturnType<typeof createEnsures>['ensureSubjectByType']
  ensureRunnable: ReturnType<typeof createEnsures>['ensureRunnable']

  onCssModified: ReturnType<typeof createSnapshots>['onCssModified']
  onBeforeWindowLoad: ReturnType<typeof createSnapshots>['onBeforeWindowLoad']

  documentHasFocus: ReturnType<typeof createFocused>['documentHasFocus']
  interceptFocus: ReturnType<typeof createFocused>['interceptFocus']
  interceptBlur: ReturnType<typeof createFocused>['interceptBlur']

  constructor (specWindow, Cypress, Cookies, state, config) {
    this.id = _.uniqueId('cy')
    this.state = state
    this.config = config
    initVideoRecorder(Cypress)

    // bind methods
    this.$$ = this.$$.bind(this)

    // init traits

    const timeouts = createTimeouts(state)

    this.timeout = timeouts.timeout
    this.clearTimeout = timeouts.clearTimeout

    const statility = createStability(Cypress, state)

    this.isStable = statility.isStable
    this.whenStable = statility.whenStable

    const assertions = createAssertions(Cypress, this)

    this.assert = assertions.assert
    this.verifyUpcomingAssertions = assertions.verifyUpcomingAssertions

    const onFinishAssertions = function () {
      return assertions.finishAssertions.apply(window, arguments)
    }

    const retries = createRetries(Cypress, state, this.timeout, this.clearTimeout, this.whenStable, onFinishAssertions)

    this.retry = retries.retry

    const jquery = createJQuery(state)

    this.getRemotejQueryInstance = jquery.getRemotejQueryInstance

    const location = createLocation(state)

    this.getRemoteLocation = location.getRemoteLocation

    const focused = createFocused(state)

    this.fireBlur = focused.fireBlur
    this.fireFocus = focused.fireFocus
    this.needsFocus = focused.needsFocus
    this.getFocused = focused.getFocused

    this.documentHasFocus = focused.documentHasFocus
    this.interceptFocus = focused.interceptFocus
    this.interceptBlur = focused.interceptBlur

    const keyboard = new Keyboard(state)

    this.devices = {
      keyboard,
      mouse: createMouse(state, keyboard, focused, Cypress),
    }

    const timer = createTimer(Cypress)

    this.pauseTimers = timer.pauseTimers
    this.resetTimer = timer.reset

    const { expect } = createChai!(specWindow, state, this.assert)

    this.expect = expect

    const xhr = createXhr(state)

    this.getIndexedXhrByAlias = xhr.getIndexedXhrByAlias
    this.getRequestsByAlias = xhr.getRequestsByAlias

    const aliases = createAliases(this)

    this.addAlias = aliases.addAlias
    this.getAlias = aliases.getAlias
    this.getNextAlias = aliases.getNextAlias
    this.validateAlias = aliases.validateAlias
    this.aliasNotFoundFor = aliases.aliasNotFoundFor
    this.getXhrTypeByAlias = aliases.getXhrTypeByAlias

    const ensures = createEnsures(state, this.expect)

    this.ensureElement = ensures.ensureElement
    this.ensureAttached = ensures.ensureAttached
    this.ensureWindow = ensures.ensureWindow
    this.ensureDocument = ensures.ensureDocument
    this.ensureElDoesNotHaveCSS = ensures.ensureElDoesNotHaveCSS
    this.ensureElementIsNotAnimating = ensures.ensureElementIsNotAnimating
    this.ensureNotDisabled = ensures.ensureNotDisabled
    this.ensureVisibility = ensures.ensureVisibility
    this.ensureStrictVisibility = ensures.ensureStrictVisibility
    this.ensureNotHiddenByAncestors = ensures.ensureNotHiddenByAncestors
    this.ensureExistence = ensures.ensureExistence
    this.ensureElExistence = ensures.ensureElExistence
    this.ensureDescendents = ensures.ensureDescendents
    this.ensureValidPosition = ensures.ensureValidPosition
    this.ensureScrollability = ensures.ensureScrollability
    this.ensureNotReadonly = ensures.ensureNotReadonly

    this.ensureSubjectByType = ensures.ensureSubjectByType
    this.ensureRunnable = ensures.ensureRunnable

    const snapshots = createSnapshots(this.$$, state)

    this.createSnapshot = snapshots.createSnapshot
    this.detachDom = snapshots.detachDom
    this.getStyles = snapshots.getStyles

    this.onCssModified = snapshots.onCssModified
    this.onBeforeWindowLoad = snapshots.onBeforeWindowLoad
  }

  $$ (selector, context) {
    if (context == null) {
      context = this.state('document')
    }

    return $dom.query(selector, context)
  }

  // private
  wrapNativeMethods (contentWindow) {
    try {
      // return null to trick contentWindow into thinking
      // its not been iframed if modifyObstructiveCode is true
      if (this.config('modifyObstructiveCode')) {
        Object.defineProperty(contentWindow, 'frameElement', {
          get () {
            return null
          },
        })
      }

      const cy = this

      contentWindow.HTMLElement.prototype.focus = function (focusOption) {
        return cy.interceptFocus(this, contentWindow, focusOption)
      }

      contentWindow.HTMLElement.prototype.blur = function () {
        return cy.interceptBlur(this)
      }

      contentWindow.SVGElement.prototype.focus = function (focusOption) {
        return cy.interceptFocus(this, contentWindow, focusOption)
      }

      contentWindow.SVGElement.prototype.blur = function () {
        return cy.interceptBlur(this)
      }

      contentWindow.HTMLInputElement.prototype.select = function () {
        return $selection.interceptSelect.call(this)
      }

      contentWindow.document.hasFocus = function () {
        return cy.documentHasFocus.call(this)
      }

      const cssModificationSpy = function (original, ...args) {
        cy.onCssModified(this.href)

        return original.apply(this, args)
      }

      const { insertRule } = contentWindow.CSSStyleSheet.prototype
      const { deleteRule } = contentWindow.CSSStyleSheet.prototype

      contentWindow.CSSStyleSheet.prototype.insertRule = _.wrap(insertRule, cssModificationSpy)
      contentWindow.CSSStyleSheet.prototype.deleteRule = _.wrap(deleteRule, cssModificationSpy)

      if (this.config('experimentalFetchPolyfill')) {
        // drop "fetch" polyfill that replaces it with XMLHttpRequest
        // from the app iframe that we wrap for network stubbing
        contentWindow.fetch = registerFetch(contentWindow)
        // flag the polyfill to test this experimental feature easier
        this.state('fetchPolyfilled', true)
      }
    } catch (error) { } // eslint-disable-line no-empty
  }
}

export default {
  create (specWindow, Cypress, Cookies, state, config, log) {
    let cy = new $Cy(specWindow, Cypress, Cookies, state, config)
    const commandFns = {}

    state('specWindow', specWindow)

    const warnMixingPromisesAndCommands = function () {
      const title = state('runnable').fullTitle()

      $errUtils.warnByPath('miscellaneous.mixing_promises_and_commands', {
        args: { title },
      })
    }

    const testConfigOverride = new TestConfigOverride()

    const isStopped = () => {
      return queue.stopped
    }

    const isCy = (val) => {
      return (val === cy) || $utils.isInstanceOf(val, $Chainer)
    }

    const runnableCtx = function (name) {
      cy.ensureRunnable(name)

      return state('runnable').ctx
    }

    const urlNavigationEvent = (event) => {
      return Cypress.action('app:navigation:changed', `page navigation event (${event})`)
    }

    const contentWindowListeners = function (contentWindow) {
      $Listeners.bindTo(contentWindow, {
        // eslint-disable-next-line @cypress/dev/arrow-body-multiline-braces
        onError: (handlerType) => (event) => {
          const { originalErr, err, promise } = $errUtils.errorFromUncaughtEvent(handlerType, event)
          const handled = cy.onUncaughtException({
            err,
            promise,
            handlerType,
            frameType: 'app',
          })

          debugErrors('uncaught AUT error: %o', originalErr)

          $errUtils.logError(Cypress, handlerType, originalErr, handled)

          // return undefined so the browser does its default
          // uncaught exception behavior (logging to console)
          return undefined
        },
        onSubmit (e) {
          return Cypress.action('app:form:submitted', e)
        },
        onBeforeUnload (e) {
          cy.isStable(false, 'beforeunload')

          Cookies.setInitial()

          cy.resetTimer()

          Cypress.action('app:window:before:unload', e)

          // return undefined so our beforeunload handler
          // doesn't trigger a confirmation dialog
          return undefined
        },
        onUnload (e) {
          return Cypress.action('app:window:unload', e)
        },
        onNavigation (...args) {
          return Cypress.action('app:navigation:changed', ...args)
        },
        onAlert (str) {
          return Cypress.action('app:window:alert', str)
        },
        onConfirm (str) {
          const results = Cypress.action('app:window:confirm', str)

          // return false if ANY results are false
          // else true
          const ret = !_.some(results, returnedFalse)

          Cypress.action('app:window:confirmed', str, ret)

          return ret
        },
      })
    }

    const enqueue = function (obj) {
      // if we have a nestedIndex it means we're processing
      // nested commands and need to insert them into the
      // index past the current index as opposed to
      // pushing them to the end we also dont want to
      // reset the run defer because splicing means we're
      // already in a run loop and dont want to create another!
      // we also reset the .next property to properly reference
      // our new obj

      // we had a bug that would bomb on custom commands when it was the
      // first command. this was due to nestedIndex being undefined at that
      // time. so we have to ensure to check that its any kind of number (even 0)
      // in order to know to insert it into the existing array.
      let nestedIndex = state('nestedIndex')

      // if this is a number, then we know we're about to insert this
      // into our commands and need to reset next + increment the index
      if (_.isNumber(nestedIndex)) {
        state('nestedIndex', (nestedIndex += 1))
      }

      // we look at whether or not nestedIndex is a number, because if it
      // is then we need to insert inside of our commands, else just push
      // it onto the end of the queue
      const index = _.isNumber(nestedIndex) ? nestedIndex : queue.length

      queue.insert(index, $Command.create(obj))

      return Cypress.action('cy:command:enqueued', obj)
    }

    const getCommandsUntilFirstParentOrValidSubject = function (command, memo = []) {
      if (!command) {
        return null
      }

      // push these onto the beginning of the commands array
      memo.unshift(command)

      // break and return the memo
      if ((command.get('type') === 'parent') || $dom.isAttached(command.get('subject'))) {
        return memo
      }

      return getCommandsUntilFirstParentOrValidSubject(command.get('prev'), memo)
    }

    const removeSubject = () => {
      return state('subject', undefined)
    }

    const pushSubjectAndValidate = function (name, args, firstCall, prevSubject) {
      if (firstCall) {
        // if we have a prevSubject then error
        // since we're invoking this improperly
        let needle

        if (prevSubject && ((needle = 'optional', ![].concat(prevSubject).includes(needle)))) {
          const stringifiedArg = $utils.stringifyActual(args[0])

          $errUtils.throwErrByPath('miscellaneous.invoking_child_without_parent', {
            args: {
              cmd: name,
              args: _.isString(args[0]) ? `\"${stringifiedArg}\"` : stringifiedArg,
            },
          })
        }

        // else if this is the very first call
        // on the chainer then make the first
        // argument undefined (we have no subject)
        removeSubject()
      }

      const subject = state('subject')

      if (prevSubject) {
        // make sure our current subject is valid for
        // what we expect in this command
        cy.ensureSubjectByType(subject, prevSubject, name)
      }

      args.unshift(subject)

      Cypress.action('cy:next:subject:prepared', subject, args, firstCall)

      return args
    }

    const doneEarly = function () {
      queue.stop()

      // we only need to worry about doneEarly when
      // it comes from a manual event such as stopping
      // Cypress or when we yield a (done) callback
      // and could arbitrarily call it whenever we want
      const p = state('promise')

      // if our outer promise is pending
      // then cancel outer and inner
      // and set canceled to be true
      if (p && p.isPending()) {
        state('canceled', true)
        state('cancel')()
      }

      return cleanup()
    }

    const cleanup = function () {
      // cleanup could be called during a 'stop' event which
      // could happen in between a runnable because they are async
      if (state('runnable')) {
        // make sure we reset the runnable's timeout now
        state('runnable').resetTimeout()
      }

      // if a command fails then after each commands
      // could also fail unless we clear this out
      state('commandIntermediateValue', undefined)

      // reset the nestedIndex back to null
      state('nestedIndex', null)

      // also reset recentlyReady back to null
      state('recentlyReady', null)

      // and forcibly move the index needle to the
      // end in case we have after / afterEach hooks
      // which need to run
      return state('index', queue.length)
    }

    const fail = (err, options = {}) => {
      // this means the error has already been through this handler and caught
      // again. but we don't need to run it through again, so we can re-throw
      // it and it will fail the test as-is
      if (err && err.hasFailed) {
        delete err.hasFailed

        throw err
      }

      options = _.defaults(options, {
        async: false,
      })

      let rets

      queue.stop()

      if (typeof err === 'string') {
        err = new Error(err)
      }

      err.stack = $stackUtils.normalizedStack(err)

      err = $errUtils.enhanceStack({
        err,
        userInvocationStack: $errUtils.getUserInvocationStack(err, state),
        projectRoot: config('projectRoot'),
      })

      err = $errUtils.processErr(err, config)

      err.hasFailed = true

      // store the error on state now
      state('error', err)

      const finish = function (err) {
        // if the test has a (done) callback, we fail the test with that
        const d = state('done')

        if (d) {
          return d(err)
        }

        // if this failure was asynchronously called (outside the promise chain)
        // but the promise chain is still active, reject it. if we're inside
        // the promise chain, this isn't necessary and will actually mess it up
        const r = state('reject')

        if (options.async && r) {
          return r(err)
        }

        // we're in the promise chain, so throw the error and it will
        // get caught by mocha and fail the test
        throw err
      }

      // this means the error came from a 'fail' handler, so don't send
      // 'cy:fail' action again, just finish up
      if (err.isCyFailErr) {
        delete err.isCyFailErr

        return finish(err)
      }

      // if we have a "fail" handler
      // 1. catch any errors it throws and fail the test
      // 2. otherwise swallow any errors
      // 3. but if the test is not ended with a done()
      //    then it should fail
      // 4. and tests without a done will pass

      // if we dont have a "fail" handler
      // 1. callback with state("done") when async
      // 2. throw the error for the promise chain
      try {
        // collect all of the callbacks for 'fail'
        rets = Cypress.action('cy:fail', err, state('runnable'))
      } catch (cyFailErr) {
        // and if any of these throw synchronously immediately error
        cyFailErr.isCyFailErr = true

        return fail(cyFailErr)
      }

      // bail if we had callbacks attached
      if (rets && rets.length) {
        return
      }

      // else figure out how to finish this failure
      return finish(err)
    }

    const queue = $CommandQueue.create(state, cy.timeout, cy.whenStable, cleanup, fail, isCy)

    _.extend(cy, {
      // command queue instance
      queue,

      // errors sync methods
      fail,

      // is cy
      isCy,

      isStopped,

      initialize ($autIframe) {
        setRemoteIframeProps($autIframe, state)

        // dont need to worry about a try/catch here
        // because this is during initialize and its
        // impossible something is wrong here
        setWindowDocumentProps(getContentWindow($autIframe), state)

        // initially set the content window listeners too
        // so we can tap into all the normal flow of events
        // like before:unload, navigation events, etc
        contentWindowListeners(getContentWindow($autIframe))

        // the load event comes from the autIframe anytime any window
        // inside of it loads.
        // when this happens we need to check for cross origin errors
        // by trying to talk to the contentWindow document to see if
        // its accessible.
        // when we find ourselves in a cross origin situation, then our
        // proxy has not injected Cypress.action('window:before:load')
        // so Cypress.onBeforeAppWindowLoad() was never called
        return $autIframe.on('load', () => {
          // if setting these props failed
          // then we know we're in a cross origin failure
          let onpl; let r

          try {
            setWindowDocumentProps(getContentWindow($autIframe), state)

            // we may need to update the url now
            urlNavigationEvent('load')

            // we normally DONT need to reapply contentWindow listeners
            // because they would have been automatically applied during
            // onBeforeAppWindowLoad, but in the case where we visited
            // about:blank in a visit, we do need these
            contentWindowListeners(getContentWindow($autIframe))

            Cypress.action('app:window:load', state('window'))

            // we are now stable again which is purposefully
            // the last event we call here, to give our event
            // listeners time to be invoked prior to moving on
            return cy.isStable(true, 'load')
          } catch (err) {
            let e = err

            // we failed setting the remote window props
            // which means we're in a cross domain failure
            // check first to see if you have a callback function
            // defined and let the page load change the error
            onpl = state('onPageLoadErr')

            if (onpl) {
              e = onpl(e)
            }

            // and now reject with it
            r = state('reject')

            if (r) {
              return r(e)
            }
          }
        })
      },

      stop () {
        // don't do anything if we've already stopped
        if (queue.stopped) {
          return
        }

        return doneEarly()
      },

      // reset is called before each test
      reset (test) {
        try {
          const s = state()

          const backup = {
            window: s.window,
            document: s.document,
            $autIframe: s.$autIframe,
            specWindow: s.specWindow,
            activeSessions: s.activeSessions,
          }

          // reset state back to empty object
          state.reset()

          // and then restore these backed up props
          state(backup)

          queue.reset()
          queue.clear()
          cy.resetTimer()
          testConfigOverride.restoreAndSetTestConfigOverrides(test, Cypress.config, Cypress.env)

          cy.removeAllListeners()
        } catch (err) {
          fail(err)
        }
      },

      addCommandSync (name, fn) {
        cy[name] = function () {
          return fn.apply(runnableCtx(name), arguments)
        }
      },

      addChainer (name, fn) {
        // add this function to our chainer class
        return $Chainer.add(name, fn)
      },

      addCommand ({ name, fn, type, prevSubject }) {
        // TODO: prob don't need this anymore
        commandFns[name] = fn

        const wrap = function (firstCall) {
          fn = commandFns[name]
          const wrapped = wrapByType(fn, firstCall)

          wrapped.originalFn = fn

          return wrapped
        }

        const wrapByType = function (fn, firstCall) {
          if (type === 'parent') {
            return fn
          }

          // child, dual, assertion, utility command
          // pushes the previous subject into them
          // after verifying its of the correct type
          return function (...args) {
            // push the subject into the args
            args = pushSubjectAndValidate(name, args, firstCall, prevSubject)

            return fn.apply(runnableCtx(name), args)
          }
        }

        cy[name] = function (...args) {
          const userInvocationStack = $stackUtils.captureUserInvocationStack(specWindow.Error)

          let ret

          cy.ensureRunnable(name)

          // this is the first call on cypress
          // so create a new chainer instance
          const chain = $Chainer.create(name, userInvocationStack, specWindow, args)

          // store the chain so we can access it later
          state('chain', chain)

          // if we are in the middle of a command
          // and its return value is a promise
          // that means we are attempting to invoke
          // a cypress command within another cypress
          // command and we should error
          ret = state('commandIntermediateValue')

          if (ret) {
            const current = state('current')

            // if this is a custom promise
            if ($utils.isPromiseLike(ret) && $utils.noArgsAreAFunction(current.get('args'))) {
              $errUtils.throwErrByPath(
                'miscellaneous.command_returned_promise_and_commands', {
                  args: {
                    current: current.get('name'),
                    called: name,
                  },
                },
              )
            }
          }

          // if we're the first call onto a cy
          // command, then kick off the run
          if (!state('promise')) {
            if (state('returnedCustomPromise')) {
              warnMixingPromisesAndCommands()
            }

            queue.run()
          }

          return chain
        }

        return cy.addChainer(name, (chainer, userInvocationStack, args) => {
          const { firstCall, chainerId } = chainer

          // dont enqueue / inject any new commands if
          // onInjectCommand returns false
          const onInjectCommand = state('onInjectCommand')
          const injected = _.isFunction(onInjectCommand)

          if (injected) {
            if (onInjectCommand.call(cy, name, ...args) === false) {
              return
            }
          }

          enqueue({
            name,
            args,
            type,
            chainerId,
            userInvocationStack,
            injected,
            fn: wrap(firstCall),
          })

          return true
        })
      },

      now (name, ...args) {
        return Promise.resolve(
          commandFns[name].apply(cy, args),
        )
      },

      replayCommandsFrom (current) {
        // reset each chainerId to the
        // current value
        const chainerId = state('chainerId')

        const insert = function (command) {
          command.set('chainerId', chainerId)

          // clone the command to prevent
          // mutating its properties
          return enqueue(command.clone())
        }

        // - starting with the aliased command
        // - walk up to each prev command
        // - until you reach a parent command
        // - or until the subject is in the DOM
        // - from that command walk down inserting
        //   every command which changed the subject
        // - coming upon an assertion should only be
        //   inserted if the previous command should
        //   be replayed

        const commands = getCommandsUntilFirstParentOrValidSubject(current)

        if (commands) {
          let initialCommand = commands.shift()

          const commandsToInsert = _.reduce(commands, (memo, command, index) => {
            let needle
            const push = () => {
              return memo.push(command)
            }

            if (!(command.get('type') !== 'assertion')) {
              // if we're an assertion and the prev command
              // is in the memo, then push this one
              if ((needle = command.get('prev'), memo.includes(needle))) {
                push()
              }
            } else if (!(command.get('subject') === initialCommand.get('subject'))) {
              // when our subjects dont match then
              // reset the initialCommand to this command
              // so the next commands can compare against
              // this one to figure out the changing subjects
              initialCommand = command

              push()
            }

            return memo
          }

          , [initialCommand])

          for (let c of commandsToInsert) {
            insert(c)
          }
        }

        // prevent loop comprehension
        return null
      },

      onBeforeAppWindowLoad (contentWindow) {
        // we set window / document props before the window load event
        // so that we properly handle events coming from the application
        // from the time that happens BEFORE the load event occurs
        setWindowDocumentProps(contentWindow, state)

        urlNavigationEvent('before:load')

        contentWindowListeners(contentWindow)

        cy.wrapNativeMethods(contentWindow)

        cy.onBeforeWindowLoad()
      },

      onUncaughtException ({ handlerType, frameType, err, promise }) {
        err = $errUtils.createUncaughtException({
          handlerType,
          frameType,
          state,
          err,
        })

        const runnable = state('runnable')

        // don't do anything if we don't have a current runnable
        if (!runnable) return

        // uncaught exceptions should be only be catchable in the AUT (app)
        // or if in component testing mode, since then the spec frame and
        // AUT frame are the same
        if (frameType === 'app' || config('testingType') === 'component') {
          try {
            const results = Cypress.action('app:uncaught:exception', err, runnable, promise)

            // dont do anything if any of our uncaught:exception
            // listeners returned false
            if (_.some(results, returnedFalse)) {
              // return true to signal that the user handled this error
              return true
            }
          } catch (uncaughtExceptionErr) {
            err = $errUtils.createUncaughtException({
              err: uncaughtExceptionErr,
              handlerType: 'error',
              frameType: 'spec',
              state,
            })
          }
        }

        try {
          fail(err)
        } catch (failErr) {
          const r = state('reject')

          if (r) {
            r(err)
          }
        }
      },

      setRunnable (runnable, hookId) {
        // when we're setting a new runnable
        // prepare to run again!
        queue.reset()

        // reset the promise again
        state('promise', undefined)

        state('hookId', hookId)

        state('runnable', runnable)

        state('test', $utils.getTestFromRunnable(runnable))

        state('ctx', runnable.ctx)

        const { fn } = runnable

        const restore = () => {
          return runnable.fn = fn
        }

        runnable.fn = function () {
          restore()

          const timeout = config('defaultCommandTimeout')

          // control timeouts on runnables ourselves
          if (_.isFinite(timeout)) {
            cy.timeout(timeout)
          }

          // store the current length of our queue
          // before we invoke the runnable.fn
          const currentLength = queue.length

          try {
            // if we have a fn.length that means we
            // are accepting a done callback and need
            // to change the semantics around how we
            // attach the run queue
            let done

            if (fn.length) {
              const originalDone = arguments[0]

              arguments[0] = (done = function (err) {
                // TODO: handle no longer error when ended early
                doneEarly()

                originalDone(err)

                // return null else we there are situations
                // where returning a regular bluebird promise
                // results in a warning about promise being created
                // in a handler but not returned
                return null
              })

              // store this done property
              // for async tests
              state('done', done)
            }

            let ret = __stackReplacementMarker(fn, this, arguments)

            // if we returned a value from fn
            // and enqueued some new commands
            // and the value isn't currently cy
            // or a promise
            if (ret &&
              (queue.length > currentLength) &&
              (!isCy(ret)) &&
              (!$utils.isPromiseLike(ret))) {
              // TODO: clean this up in the utility function
              // to conditionally stringify functions
              ret = _.isFunction(ret) ?
                ret.toString()
                :
                $utils.stringify(ret)

              $errUtils.throwErrByPath('miscellaneous.returned_value_and_commands', {
                args: { returned: ret },
              })
            }

            // if we attached a done callback
            // and returned a promise then we
            // need to automatically bind to
            // .catch() and return done(err)
            // TODO: this has gone away in mocha 3.x.x
            // due to overspecifying a resolution.
            // in those cases we need to remove
            // returning a promise
            if (fn.length && ret && ret.catch) {
              ret = ret.catch(done)
            }

            // if we returned a promise like object
            if ((!isCy(ret)) && $utils.isPromiseLike(ret)) {
              // indicate we've returned a custom promise
              state('returnedCustomPromise', true)

              // this means we instantiated a promise
              // and we've already invoked multiple
              // commands and should warn
              if (queue.length > currentLength) {
                warnMixingPromisesAndCommands()
              }

              return ret
            }

            // if we're cy or we've enqueued commands
            if (isCy(ret) || (queue.length > currentLength)) {
              if (fn.length) {
                // if user has passed done callback don't return anything
                // so we don't get an 'overspecified' error from mocha
                return
              }

              // otherwise, return the 'queue promise', so mocha awaits it
              return state('promise')
            }

            // else just return ret
            return ret
          } catch (err) {
            // if runnable.fn threw synchronously, then it didnt fail from
            // a cypress command, but we should still teardown and handle
            // the error
            return fail(err)
          }
        }
      },
    })

    setTopOnError(Cypress, cy)

    // make cy global in the specWindow
    specWindow.cy = cy

    $Events.extend(cy)

    return cy
  },
}
