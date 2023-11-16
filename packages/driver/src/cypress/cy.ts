/* eslint-disable prefer-rest-params */
import _ from 'lodash'
import Promise from 'bluebird'
import debugFn from 'debug'

import $utils from './utils'
import $errUtils, { ErrorFromProjectRejectionEvent } from './error_utils'
import $stackUtils from './stack_utils'

import { create as createChai, IChai } from '../cy/chai'
import { create as createXhr, IXhr } from '../cy/xhrs'
import { create as createJQuery, IJQuery } from '../cy/jquery'
import { create as createAliases, IAliases } from '../cy/aliases'
import { extend as extendEvents } from './events'
import { create as createFocused, IFocused } from '../cy/focused'
import { create as createMouse, Mouse } from '../cy/mouse'
import { Keyboard } from '../cy/keyboard'
import { create as createLocation, ILocation } from '../cy/location'
import { create as createAssertions, IAssertions } from '../cy/assertions'
import { bindToListeners } from '../cy/listeners'
import { $Chainer } from './chainer'
import { create as createTimer, ITimer } from '../cy/timers'
import { create as createTimeouts, ITimeouts } from '../cy/timeouts'
import { create as createRetries, IRetries } from '../cy/retries'
import { create as createStability, IStability } from '../cy/stability'
import { create as createSnapshots, ISnapshots } from '../cy/snapshots'
import { $Command } from './command'
import { CommandQueue } from './command_queue'
import { initVideoRecorder } from '../cy/video-recorder'
import { TestConfigOverride } from '../cy/testConfigOverrides'
import { create as createOverrides, IOverrides } from '../cy/overrides'
import { historyNavigationTriggeredHashChange } from '../cy/navigation'
import { EventEmitter2 } from 'eventemitter2'
import { handleCrossOriginCookies } from '../cross-origin/events/cookies'
import { handleTabActivation } from '../util/tab_activation'

import type { ICypress } from '../cypress'
import type { ICookies } from './cookies'
import type { StateFunc, SubjectChain, QueryFunction } from './state'

const debugErrors = debugFn('cypress:driver:errors')

const returnedFalse = (result) => {
  return result === false
}

const getContentWindow = ($autIframe) => {
  return $autIframe.prop('contentWindow')
}

const setWindowDocumentProps = function (contentWindow, state) {
  state('window', contentWindow)
  state('document', contentWindow.document)
}

function __stackReplacementMarker (fn, ctx, args) {
  return fn.apply(ctx, args)
}

declare let top: WindowProxy & { __alreadySetErrorHandlers__: boolean }

// We only set top.onerror once since we make it configurable:false
// but we update cy instance every run (page reload or rerun button)
let curCy: $Cy | null = null
const setTopOnError = function (Cypress, cy: $Cy) {
  if (curCy) {
    curCy = cy

    return
  }

  curCy = cy

  try {
    // prevent overriding top.onerror twice when loading more than one
    // instance of test runner.
    if (top.__alreadySetErrorHandlers__) {
      return
    }
  } catch (err) {
    return
  }

  // eslint-disable-next-line @cypress/dev/arrow-body-multiline-braces
  const onTopError = (handlerType) => (event) => {
    const { originalErr, err, promise } = $errUtils.errorFromUncaughtEvent(handlerType, event) as ErrorFromProjectRejectionEvent

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
    set () { },
    get () { },
    configurable: false,
    enumerable: true,
  })

  top.addEventListener('unhandledrejection', onTopError('unhandledrejection'))

  top.__alreadySetErrorHandlers__ = true
}

const ensureRunnable = (cy, cmd) => {
  if (!cy.state('runnable')) {
    $errUtils.throwErrByPath('miscellaneous.outside_test_with_cmd', {
      args: { cmd },
    })
  }
}

interface ICyFocused extends Omit<
  IFocused,
  'documentHasFocus' | 'interceptFocus' | 'interceptBlur'
> { }

interface ICySnapshots extends Omit<
  ISnapshots,
  'onCssModified' | 'onBeforeWindowLoad'
> { }

export class $Cy extends EventEmitter2 implements ITimeouts, IStability, IAssertions, IRetries, IJQuery, ILocation, ITimer, IChai, IXhr, IAliases, ICySnapshots, ICyFocused {
  id: string
  specWindow: any
  state: StateFunc
  config: any
  Cypress: ICypress
  Cookies: ICookies

  devices: {
    keyboard: Keyboard
    mouse: Mouse
  }
  queue: CommandQueue

  timeout: ITimeouts['timeout']
  clearTimeout: ITimeouts['clearTimeout']

  isStable: IStability['isStable']
  whenStable: IStability['whenStable']

  assert: IAssertions['assert']
  verifyUpcomingAssertions: IAssertions['verifyUpcomingAssertions']

  retry: IRetries['retry']
  retryIfCommandAUTOriginMismatch: IRetries['retryIfCommandAUTOriginMismatch']

  $$: IJQuery['$$']
  getRemotejQueryInstance: IJQuery['getRemotejQueryInstance']

  getRemoteLocation: ILocation['getRemoteLocation']
  getCrossOriginRemoteLocation: ILocation['getCrossOriginRemoteLocation']

  fireBlur: IFocused['fireBlur']
  fireFocus: IFocused['fireFocus']
  needsFocus: IFocused['needsFocus']
  getFocused: IFocused['getFocused']

  pauseTimers: ITimer['pauseTimers']

  expect: IChai['expect']

  getIndexedXhrByAlias: IXhr['getIndexedXhrByAlias']

  addAlias: IAliases['addAlias']
  getAlias: IAliases['getAlias']
  getNextAlias: IAliases['getNextAlias']
  validateAlias: IAliases['validateAlias']
  aliasNotFoundFor: IAliases['aliasNotFoundFor']
  getXhrTypeByAlias: IAliases['getXhrTypeByAlias']

  createSnapshot: ISnapshots['createSnapshot']
  detachDom: ISnapshots['detachDom']
  getStyles: ISnapshots['getStyles']

  resetTimer: ReturnType<typeof createTimer>['reset']
  overrides: IOverrides

  // Private methods
  onBeforeWindowLoad: ReturnType<typeof createSnapshots>['onBeforeWindowLoad']

  documentHasFocus: ReturnType<typeof createFocused>['documentHasFocus']
  interceptFocus: ReturnType<typeof createFocused>['interceptFocus']
  interceptBlur: ReturnType<typeof createFocused>['interceptBlur']

  private testConfigOverride: TestConfigOverride
  private commandFns: Record<string, Function> = {}
  private queryFns: Record<string, Function> = {}

  constructor (specWindow: SpecWindow, Cypress: ICypress, Cookies: ICookies, state: StateFunc, config: ICypress['config']) {
    super()

    state('specWindow', specWindow)

    this.specWindow = specWindow
    this.id = _.uniqueId('cy')
    this.state = state
    this.config = config
    this.Cypress = Cypress
    this.Cookies = Cookies
    initVideoRecorder(Cypress)

    this.testConfigOverride = new TestConfigOverride()

    // bind methods
    this.isCy = this.isCy.bind(this)
    this.fail = this.fail.bind(this)
    this.isStopped = this.isStopped.bind(this)
    this.stop = this.stop.bind(this)
    this.reset = this.reset.bind(this)
    this.addCommandSync = this.addCommandSync.bind(this)
    this.addCommand = this.addCommand.bind(this)
    this.addQuery = this.addQuery.bind(this)
    this.now = this.now.bind(this)
    this.onBeforeAppWindowLoad = this.onBeforeAppWindowLoad.bind(this)
    this.onUncaughtException = this.onUncaughtException.bind(this)
    this.setRunnable = this.setRunnable.bind(this)
    this.getSubjectFromChain = this.getSubjectFromChain.bind(this)
    this.setSubjectForChainer = this.setSubjectForChainer.bind(this)
    this.subject = this.subject.bind(this)
    this.subjectChain = this.subjectChain.bind(this)

    // init traits

    const timeouts = createTimeouts(state)

    this.timeout = timeouts.timeout
    this.clearTimeout = timeouts.clearTimeout

    const stability = createStability(Cypress, state)

    this.isStable = stability.isStable
    this.whenStable = stability.whenStable

    const assertions = createAssertions(Cypress, this)

    this.assert = assertions.assert
    this.verifyUpcomingAssertions = assertions.verifyUpcomingAssertions

    const onFinishAssertions = function () {
      return assertions.finishAssertions.apply(window, arguments as any)
    }

    const retries = createRetries(Cypress, state, this.timeout, this.clearTimeout, this.whenStable, onFinishAssertions)

    this.retry = retries.retry
    this.retryIfCommandAUTOriginMismatch = retries.retryIfCommandAUTOriginMismatch

    const jquery = createJQuery(state)

    this.$$ = jquery.$$
    this.getRemotejQueryInstance = jquery.getRemotejQueryInstance

    const location = createLocation(state)

    this.getRemoteLocation = location.getRemoteLocation
    this.getCrossOriginRemoteLocation = location.getCrossOriginRemoteLocation

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

    const aliases = createAliases(this)

    this.addAlias = aliases.addAlias
    this.getAlias = aliases.getAlias
    this.getNextAlias = aliases.getNextAlias
    this.validateAlias = aliases.validateAlias
    this.aliasNotFoundFor = aliases.aliasNotFoundFor
    this.getXhrTypeByAlias = aliases.getXhrTypeByAlias

    const snapshots = createSnapshots(this.$$, state)

    this.createSnapshot = snapshots.createSnapshot
    this.detachDom = snapshots.detachDom
    this.getStyles = snapshots.getStyles

    this.onBeforeWindowLoad = snapshots.onBeforeWindowLoad

    this.overrides = createOverrides(state, config, focused, snapshots)

    this.queue = new CommandQueue(state, stability, this)

    setTopOnError(Cypress, this)

    // make cy global in the specWindow
    specWindow.cy = this

    extendEvents(this)

    Cypress.on('enqueue:command', (attrs: Cypress.EnqueuedCommandAttributes) => {
      this.enqueue($Command.create(attrs))
    })

    // clears out any extra tabs/windows between tests
    Cypress.on('test:before:run:async', () => {
      return Cypress.backend('close:extra:targets')
    })

    handleTabActivation(Cypress)
    handleCrossOriginCookies(Cypress)
  }

  isCy (val) {
    return (val === this) || $utils.isInstanceOf(val, $Chainer)
  }

  isStopped () {
    return this.queue.stopped
  }

  fail (err, options: { async?: boolean } = {}) {
    // if an onFail handler is provided, call this in its place (currently used for cross-origin support)
    if (this.state('onFail')) {
      return this.state('onFail')(err)
    }

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

    this.queue.stop()

    if (typeof err === 'string') {
      err = new Error(err)
    }

    err.stack = $stackUtils.normalizedStack(err)

    err = $errUtils.enhanceStack({
      err,
      userInvocationStack: $errUtils.getUserInvocationStack(err, this.state),
      projectRoot: this.config('projectRoot'),
    })

    err = $errUtils.processErr(err, this.config)

    err.hasFailed = true

    // store the error on state now
    this.state('error', err)

    const cy = this

    const finish = function (err) {
      // if the test has a (done) callback, we fail the test with that
      const d = cy.state('done')

      if (d) {
        return d(err)
      }

      // if this failure was asynchronously called (outside the promise chain)
      // but the promise chain is still active, reject it. if we're inside
      // the promise chain, this isn't necessary and will actually mess it up
      const r = cy.state('reject')

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

    // if we don't have a "fail" handler
    // 1. callback with state("done") when async
    // 2. throw the error for the promise chain
    try {
      this.Cypress.state('logGroupIds', []) // reset log groups so assertions are at the top level

      // collect all of the callbacks for 'fail'
      rets = this.Cypress.action('cy:fail', err, this.state('runnable'))
    } catch (cyFailErr: any) {
      // and if any of these throw synchronously immediately error
      cyFailErr.isCyFailErr = true

      return this.fail(cyFailErr)
    }

    // bail if we had callbacks attached
    if (rets && rets.length) {
      return
    }

    // else figure out how to finish this failure
    return finish(err)
  }

  initialize ($autIframe) {
    this.state('$autIframe', $autIframe)

    // don't need to worry about a try/catch here
    // because this is during initialize and its
    // impossible something is wrong here
    setWindowDocumentProps(getContentWindow($autIframe), this.state)

    // initially set the content window listeners too
    // so we can tap into all the normal flow of events
    // like before:unload, navigation events, etc
    this.contentWindowListeners(getContentWindow($autIframe))

    // the load event comes from the autIframe anytime any window
    // inside of it loads.
    // when this happens we need to check for cross origin errors
    // by trying to talk to the contentWindow document to see if
    // its accessible.
    // when we find ourselves in a cross origin situation, then our
    // proxy has not injected Cypress.action('window:before:load')
    // so Cypress.onBeforeAppWindowLoad() was never called
    return $autIframe.on('load', async () => {
      if (historyNavigationTriggeredHashChange(this.state)) {
        // Skip load event.
        // Chromium 97+ triggers fires iframe onload for cross-origin-initiated same-document
        // navigations to make it appear to be a cross-document navigation, even when it wasn't
        // to alleviate security risk where a cross-origin initiator can check whether
        // or not onload fired to guess the url of a target frame.
        // When the onload is fired, neither the before:unload or unload event is fired to remove
        // the attached listeners or to clean up the current page state.
        // https://github.com/cypress-io/cypress/issues/19230
        return
      }

      // if setting these props failed then we know we're in a cross origin failure
      try {
        const autWindow = getContentWindow($autIframe)

        let isRunnerAbleToCommunicateWithAUT: boolean

        try {
          // Test to see if we can communicate with the AUT.
          autWindow.location.href
          isRunnerAbleToCommunicateWithAUT = true
        } catch (err: any) {
          isRunnerAbleToCommunicateWithAUT = false
        }

        // If the runner can communicate, we should setup all events, otherwise just setup the window and fire the load event.
        if (isRunnerAbleToCommunicateWithAUT) {
          if (this.Cypress.isBrowser('webkit')) {
            // WebKit's unhandledrejection event will sometimes not fire within the AUT
            // due to a documented bug: https://bugs.webkit.org/show_bug.cgi?id=187822
            // To ensure that the event will always fire (and always report these
            // unhandled rejections to the user), we patch the AUT's Error constructor
            // to enqueue a no-op microtask when executed, which ensures that the unhandledrejection
            // event handler will be executed if this Error is uncaught.
            const originalError = autWindow.Error

            autWindow.Error = function __CyWebKitError (...args) {
              autWindow.queueMicrotask(() => { })

              return originalError.apply(this, args)
            }
          }

          setWindowDocumentProps(autWindow, this.state)

          // we may need to update the url now
          this.urlNavigationEvent('load')

          // we normally DON'T need to reapply contentWindow listeners
          // because they would have been automatically applied during
          // onBeforeAppWindowLoad, but in the case where we visited
          // about:blank in a visit, we do need these
          this.contentWindowListeners(autWindow)
        } else {
          this.state('window', autWindow)
          this.state('document', undefined)
          // we may need to update the url now
          this.urlNavigationEvent('load')
        }

        // stability is signalled after the window:load event to give event
        // listeners time to be invoked prior to moving on, but not if
        // there is a cross-origin error and the cy.origin API is
        // not utilized
        try {
          // Get the location even if we're cross origin.
          const remoteLocation = await this.getCrossOriginRemoteLocation()

          cy.state('autLocation', remoteLocation)
          this.Cypress.action('app:window:load', this.state('window'), remoteLocation.href)

          this.Cypress.primaryOriginCommunicator.toAllSpecBridges('window:load', { url: remoteLocation.href })
        } catch (err: any) {
          // this catches errors thrown by user-registered event handlers
          // for `window:load`. this is used in the `catch` below so they
          // aren't mistaken as cross-origin errors
          // If this is a cypress error, pass it on through.
          if (!$errUtils.isCypressErr(err)) {
            err.isFromWindowLoadEvent = true
          }

          throw err
        } finally {
          this.isStable(true, 'load')
        }
      } catch (err: any) {
        if (err.isFromWindowLoadEvent) {
          delete err.isFromWindowLoadEvent

          // the user's window:load handler threw an error, so propagate that
          // and fail the test
          const r = this.state('reject')

          if (r) {
            return r(err)
          }
        }

        // we failed setting the remote window props which
        // means the page navigated to a different origin

        let e = err

        // we failed setting the remote window props
        // which means we're in a cross origin failure
        // check first to see if you have a callback function
        // defined and let the page load change the error
        const onpl = this.state('onPageLoadErr')

        if (onpl) {
          e = onpl(e)
        }

        this.Cypress.emit('internal:window:load', {
          type: 'cross:origin:failure',
          error: e,
        })

        // need async:true since this is outside the command queue promise
        // chain and cy.fail needs to know to use the reference to the
        // last command to reject it
        this.fail(e, { async: true })
      }
    })
  }

  stop () {
    // don't do anything if we've already stopped
    if (this.queue.stopped) {
      return
    }

    return this.doneEarly()
  }

  // reset is called before each test
  reset (test) {
    try {
      const s = this.state()

      const backup = {
        test,
        window: s.window,
        document: s.document,
        $autIframe: s.$autIframe,
        specWindow: s.specWindow,
        activeSessions: s.activeSessions,
      }

      // reset state back to empty object
      this.state.reset()

      // and then restore these backed up props
      this.state(backup)

      this.queue.reset()
      this.queue.clear()
      this.resetTimer()
      this.removeAllListeners()
      this.testConfigOverride.restoreAndSetTestConfigOverrides(test, this.Cypress.config, this.Cypress.env)
    } catch (err) {
      this.fail(err)
    }
  }

  addCommandSync (name, fn) {
    const cy = this

    cy[name] = function () {
      return fn.apply(cy.runnableCtx(name), arguments)
    }
  }

  runQueue () {
    cy.queue.run()
  }

  addCommand ({ name, fn, type, prevSubject }) {
    const cy = this

    this.commandFns[name] = fn

    const wrap = function (firstCall) {
      if (type === 'parent') {
        return (chainerId, ...args) => fn.apply(cy.runnableCtx(name), args)
      }

      const wrapped = function (chainerId, ...args) {
        // push the subject into the args
        if (firstCall) {
          cy.validateFirstCall(name, args, prevSubject)
        }

        args = cy.pushSubject(name, args, prevSubject, chainerId)

        return fn.apply(cy.runnableCtx(name), args)
      }

      wrapped.originalFn = fn

      return wrapped
    }

    const cyFn = wrap(true)
    const chainerFn = wrap(false)

    const callback = (chainer, userInvocationStack, args, privilegeVerification, firstCall = false) => {
      // dont enqueue / inject any new commands if
      // onInjectCommand returns false
      const onInjectCommand = cy.state('onInjectCommand')

      if (_.isFunction(onInjectCommand) && onInjectCommand.call(cy, name, ...args) === false) {
        return
      }

      cy.enqueue($Command.create({
        name,
        args,
        type,
        chainerId: chainer.chainerId,
        userInvocationStack,
        fn: firstCall ? cyFn : chainerFn,
        privilegeVerification,
      }))
    }

    $Chainer.add(name, callback)

    cy[name] = function (...args) {
      ensureRunnable(cy, name)

      // for privileged commands, we send a message to the server that verifies
      // them as coming from the spec. the fulfillment of this promise means
      // the message was received. the implementation for those commands
      // checks to make sure this promise is fulfilled before sending its
      // websocket message for running the command to ensure prevent a race
      // condition where running the command happens before the command is
      // verified
      const privilegeVerification = Cypress.emitMap('command:invocation', { name, args })

      // this is the first call on cypress
      // so create a new chainer instance
      const chainer = new $Chainer(cy.specWindow)

      if (cy.state('chainerId')) {
        cy.linkSubject(chainer.chainerId, cy.state('chainerId'))
      }

      const userInvocationStack = $stackUtils.captureUserInvocationStack(cy.specWindow.Error)

      callback(chainer, userInvocationStack, args, privilegeVerification, true)

      // if we are in the middle of a command
      // and its return value is a promise
      // that means we are attempting to invoke
      // a cypress command within another cypress
      // command and we should error
      const ret = cy.state('commandIntermediateValue')

      if (ret) {
        const current = cy.state('current')

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
      if (!cy.state('promise')) {
        if (cy.state('returnedCustomPromise')) {
          cy.warnMixingPromisesAndCommands()
        }

        cy.runQueue()
      }

      return chainer
    }
  }

  addQuery ({ name, fn }) {
    const cy = this

    this.queryFns[name] = fn

    const callback = (chainer, userInvocationStack, args, privilegeVerification) => {
      // dont enqueue / inject any new commands if
      // onInjectCommand returns false
      const onInjectCommand = cy.state('onInjectCommand')

      if (_.isFunction(onInjectCommand) && onInjectCommand.call(cy, name, ...args) === false) {
        return
      }

      // Queries are functions that accept args (which is called once each time the command is used in the spec
      // file), which return a function that accepts the subject (which is potentially called any number of times).
      // The outer function is used to store any needed state needed by a particular instance of the command, such as
      // a Cypress.log() instance, while the inner one (queryFn here) is the one that determines the next subject.

      // We enqueue the outer function as the "cypress command". See command_queue.ts for details on how this is
      // invoked and the inner function retried.
      const command = $Command.create({
        name,
        args,
        chainerId: chainer.chainerId,
        userInvocationStack,
        query: true,
      })

      const cyFn = function (chainerId, ...args) {
        return fn.apply(command, args)
      }

      cyFn.originalFn = fn
      command.set('fn', cyFn)
      command.set('privilegeVerification', privilegeVerification)

      cy.enqueue(command)
    }

    $Chainer.add(name, callback)

    cy[name] = function (...args) {
      ensureRunnable(cy, name)

      // for privileged commands, we send a message to the server that verifies
      // them as coming from the spec. the fulfillment of this promise means
      // the message was received. the implementation for those commands
      // checks to make sure this promise is fulfilled before sending its
      // websocket message for running the command to ensure prevent a race
      // condition where running the command happens before the command is
      // verified
      const privilegeVerification = Cypress.emitMap('command:invocation', { name, args })

      // this is the first call on cypress
      // so create a new chainer instance
      const chainer = new $Chainer(cy.specWindow)

      if (cy.state('chainerId')) {
        cy.linkSubject(chainer.chainerId, cy.state('chainerId'))
      }

      const userInvocationStack = $stackUtils.captureUserInvocationStack(cy.specWindow.Error)

      callback(chainer, userInvocationStack, args, privilegeVerification)

      // if we're the first call onto a cy
      // command, then kick off the run
      if (!cy.state('promise')) {
        cy.runQueue()
      }

      return chainer
    }
  }

  now (name: string, ...args: any[]): Promise<any> | QueryFunction {
    if (this.queryFns[name]) {
      return this.queryFns[name].apply(this.state('current'), args)
    }

    return Promise.resolve(
      this.commandFns[name].apply(this, args),
    )
  }

  onBeforeAppWindowLoad (contentWindow) {
    // we set window / document props before the window load event
    // so that we properly handle events coming from the application
    // from the time that happens BEFORE the load event occurs
    setWindowDocumentProps(contentWindow, this.state)

    this.urlNavigationEvent('before:load')

    this.contentWindowListeners(contentWindow)

    this.overrides.wrapNativeMethods(contentWindow)

    this.onBeforeWindowLoad()
  }

  onUncaughtException ({ handlerType, frameType, err, promise }) {
    err = $errUtils.createUncaughtException({
      handlerType,
      frameType,
      state: this.state,
      err,
    })

    const runnable = this.state('runnable')

    // don't do anything if we don't have a current runnable
    if (!runnable) return

    // uncaught exceptions should be only be catchable in the AUT (app)
    // or if in component testing mode, since then the spec frame and
    // AUT frame are the same
    if (frameType === 'app' || this.config('componentTesting')) {
      try {
        const results = this.Cypress.action('app:uncaught:exception', err, runnable, promise)

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
          state: this.state,
        })
      }
    }

    try {
      this.fail(err)
    } catch (failErr) {
      const r = this.state('reject')

      if (r) {
        r(err)
      }
    }

    return
  }

  setRunnable (runnable, hookId) {
    // when we're setting a new runnable
    // prepare to run again!
    this.queue.reset()

    // reset the promise again
    this.state('promise', undefined)
    this.state('hookId', hookId)
    this.state('runnable', runnable)
    this.state('ctx', runnable.ctx)

    const { fn } = runnable

    const restore = () => {
      return runnable.fn = fn
    }

    const cy = this

    runnable.fn = function () {
      restore()

      const timeout = cy.config('defaultCommandTimeout')

      // control timeouts on runnables ourselves
      if (_.isFinite(timeout)) {
        cy.timeout(timeout)
      }

      // store the current length of our queue
      // before we invoke the runnable.fn
      const currentLength = cy.queue.length

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
            cy.doneEarly()

            originalDone(err)

            // return null else we there are situations
            // where returning a regular bluebird promise
            // results in a warning about promise being created
            // in a handler but not returned
            return null
          })

          // store this done property
          // for async tests
          cy.state('done', done)
        }

        let ret = __stackReplacementMarker(fn, this, arguments)

        // if we returned a value from fn
        // and enqueued some new commands
        // and the value isn't currently cy
        // or a promise
        if (ret &&
          cy.queue.length > currentLength &&
          !cy.isCy(ret) &&
          !$utils.isPromiseLike(ret)) {
          // TODO: clean this up in the utility function
          // to conditionally stringify functions
          ret = _.isFunction(ret)
            ? ret.toString()
            : $utils.stringify(ret)

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
        if (!cy.isCy(ret) && $utils.isPromiseLike(ret)) {
          // indicate we've returned a custom promise
          cy.state('returnedCustomPromise', true)

          // this means we instantiated a promise
          // and we've already invoked multiple
          // commands and should warn
          if (cy.queue.length > currentLength) {
            cy.warnMixingPromisesAndCommands()
          }

          return ret
        }

        // if we're cy or we've enqueued commands
        if (cy.isCy(ret) || cy.queue.length > currentLength) {
          if (fn.length) {
            // if user has passed done callback don't return anything
            // so we don't get an 'overspecified' error from mocha
            return
          }

          // otherwise, return the 'queue promise', so mocha awaits it
          return cy.state('promise')
        }

        // else just return ret
        return ret
      } catch (err) {
        // If the runnable was marked as pending, this test was skipped
        // go ahead and just return
        if (runnable.isPending()) {
          return
        }

        // if runnable.fn threw synchronously, then it didnt fail from
        // a cypress command, but we should still teardown and handle
        // the error
        return cy.fail(err)
      }
    }
  }

  private warnMixingPromisesAndCommands () {
    const title = this.state('runnable').fullTitle()

    $errUtils.warnByPath('miscellaneous.mixing_promises_and_commands', {
      args: { title },
    })
  }

  private runnableCtx (name) {
    ensureRunnable(this, name)

    return this.state('runnable').ctx
  }

  private urlNavigationEvent (event) {
    return this.Cypress.action('app:navigation:changed', `page navigation event (${event})`)
  }

  private contentWindowListeners (contentWindow) {
    const cy = this

    bindToListeners(contentWindow, {
      // eslint-disable-next-line @cypress/dev/arrow-body-multiline-braces
      onError: (handlerType) => (event) => {
        const { originalErr, err, promise } = $errUtils.errorFromUncaughtEvent(handlerType, event) as ErrorFromProjectRejectionEvent

        const handled = cy.onUncaughtException({
          err,
          promise,
          handlerType,
          frameType: 'app',
        })

        debugErrors('uncaught AUT error: %o', originalErr)

        $errUtils.logError(cy.Cypress, handlerType, originalErr, handled)

        // return undefined so the browser does its default
        // uncaught exception behavior (logging to console)
        return undefined
      },
      onHistoryNav (delta) {
        cy.state('navHistoryDelta', delta)
      },
      onSubmit (e) {
        return cy.Cypress.action('app:form:submitted', e)
      },
      onLoad () { },
      onBeforeUnload (e) {
        cy.isStable(false, 'beforeunload')

        cy.Cookies.setInitial()

        cy.resetTimer()

        cy.Cypress.action('app:window:before:unload', e)

        // return undefined so our beforeunload handler
        // doesn't trigger a confirmation dialog
        return undefined
      },
      onUnload (e) {
        return cy.Cypress.action('app:window:unload', e)
      },
      onNavigation (...args) {
        return cy.Cypress.action('app:navigation:changed', ...args)
      },
      onAlert (str) {
        return cy.Cypress.action('app:window:alert', str)
      },
      onConfirm (str) {
        const results = cy.Cypress.action('app:window:confirm', str)

        // return false if ANY results are false
        // else true
        const ret = !_.some(results, returnedFalse)

        cy.Cypress.action('app:window:confirmed', str, ret)

        return ret
      },
    })
  }

  private enqueue (command: $Command) {
    this.queue.enqueue(command)

    return this.Cypress.action('cy:command:enqueued', command.attributes)
  }

  private validateFirstCall (name, args, prevSubject: string[]) {
    // if we have a prevSubject then error
    // since we're invoking this improperly
    if (prevSubject && !([] as string[]).concat(prevSubject).includes('optional')) {
      const stringifiedArg = $utils.stringifyActual(args[0])

      $errUtils.throwErrByPath('miscellaneous.invoking_child_without_parent', {
        args: {
          cmd: name,
          args: _.isString(args[0]) ? `\"${stringifiedArg}\"` : stringifiedArg,
        },
      })
    }
  }

  // TODO: make string[] more
  private pushSubject (name, args, prevSubject: string[], chainerId) {
    const subject = this.subject(chainerId)

    if (prevSubject !== undefined) {
      // make sure our current subject is valid for
      // what we expect in this command

      // @ts-ignore
      Cypress.ensure.isType(subject, prevSubject as any, this.state('current').get('name'), this)
    }

    args.unshift(subject)

    return args
  }

  /*
   * Use `subject()` to get the current subject. It reads from cy.state('subjects'), but the format and details of
   * determining this should be considered an internal implementation detail of Cypress, subject to change at any time.
   *
   * See subjectChain() for more details on state('subjects').
   */
  subject (chainerId?: string) {
    const subjectChain: SubjectChain | undefined = this.subjectChain(chainerId)

    return this.getSubjectFromChain(subjectChain)
  }

  /*
   * Use subjectChain() to get a subjectChain, which you can later pass into getSubjectFromChain() to resolve
   * the array into a specific DOM element or other value. It reads from cy.state('subjects'), but the format and
   * details of determining this should be considered an internal implementation detail of Cypress, subject to change
   * at any time.
   *
   * Currently, state('subjects') is an object, mapping chainerIds to the current subject and queries for that
   * chainer. For example, it might look like:
   *
   * {
   *   'ch-http://localhost:3500-2': ['foobar'],
   *   'ch-http://localhost:3500-4': [<input>],
   *   'ch-http://localhost:3500-4': [undefined, f(), f()],
   * }
   *
   * A subject chain - the return value of this function - is one of these entries: a primitive value, followed by
   * 0 or more functions operating on this value.
   *
   * Do not read cy.state('subjects') directly; This is what subject() or subjectChain() are for, turning this
   * structure into a usable subject.
   */
  subjectChain (chainerId: string = this.state('chainerId')) {
    return (this.state('subjects') || {} as Record<string, SubjectChain>)[chainerId]
  }

  /* Given a chain of functions, return the actual subject. `subjectChain` might look like any of:
   * []
   * [<input>]
   * ['foobar', f()]
   * [undefined, f(), f()]
   */
  getSubjectFromChain (subjectChain: SubjectChain | null | undefined) {
    if (!subjectChain) {
      return
    }

    // If we're getting the subject of a previous command, then any log messages have already
    // been added to the command log; We don't want to re-add them every time we query
    // the current subject.
    cy.state('onBeforeLog', () => false)

    let subject = subjectChain[0]

    try {
      for (let i = 1; i < subjectChain.length; i++) {
        subject = subjectChain[i](subject)
      }
    } finally {
      cy.state('onBeforeLog', null)
    }

    return subject
  }

  /*
   * Cypress executes commands asynchronously, and those commands can contain other commands - this means that there
   * are times when an outer chainer might have as its subject the (as of yet unresolved) return value of the inner
   * chain of commands.
   *
   * cy.state('subjectLinks') is where we store that connection. The exact contents should be considered an internal
   * implementation detail - do not read or alter it directly, but prefer the public interface (linkSubject and
   * breakSubjectLinksToCurrentChainer).
   *
   * In the current implementation, subjectLinks might look like:
   * {
   *   'ch-http://localhost:3500-4': 'ch-http://localhost:3500-2',
   * }
   *
   * indicating that when we eventually resolve the subject of ch--4, it should *also* be used as the subject for
   * ch--2 - for example, `cy.then(() => { return cy.get('foo') }).log()`. The inner chainer (ch--4,
   * `cy.get('foo')`) is linked to the outer chainer (ch--2) - when we eventually .get('foo'), the resolved value
   * becomes the new subject for the outer chainer.
   *
   * Whenever we are in the middle of resolving one chainer and a new one is created, Cypress links the inner chainer
   * to the outer one. This is *usually* desireable, allowing simple constructs like
   * `cy.then(() => { return cy.get('foo') }).log()` to function intuitively.
   *
   * But you don't always want to use the inner chainer's subject for the outer chainer. Consider:
   * `cy.then(() => { cy.get('foo').click(); return 'success' }).log()`
   *
   * In this case, we want to break the connection between the inner chainer and the outer one, so that we can
   * instead use the return value as the new subject. Is this case, you'll want cy.breakSubjectLinksToCurrentChainer().
   */
  linkSubject (childChainerId: string, parentChainerId: string) {
    const links = this.state('subjectLinks') || {} as Record<string, string>

    links[childChainerId] = parentChainerId
    this.state('subjectLinks', links)
  }

  /*
   * You should call breakSubjectLinksToCurrentChainer() when the following are *both* true:
   *   1. A command callback may contain cypress commands.
   *   2. You do not want to use the subject of those commands as the new subject of the parent command chain.
   *
   * In this case, call the function directly before returning the new subject, after any new cypress commands have
   * been added to the queue. See `cy.linkSubject()` for more details about how links are created.
   */
  breakSubjectLinksToCurrentChainer () {
    const chainerId = this.state('chainerId')
    const links = this.state('subjectLinks') || {} as Record<string, string>

    this.state('subjectLinks', _.omitBy(links, (l) => l === chainerId))
  }

  /*
   * setSubjectForChainer should be considered an internal implementation detail of Cypress. Do not use it directly
   * outside of the Cypress codebase. It is currently used only by the command_queue, and if you think it's needed
   * elsewhere, consider if there's a way you can use existing functionality to achieve it instead.
   *
   * The command_queue calls setSubjectForChainer after a command has finished resolving, when we have the
   * final (non-$Chainer, non-promise) return value. This value becomes the current $Chainer's new subjectChain - and
   * the new subjectChain for any chainers it's linked to (see cy.linkSubject for details on that process).
   */
  setSubjectForChainer (chainerId: string, subjectChain: SubjectChain) {
    const cySubjects = this.state('subjects') || {} as Record<string, SubjectChain>

    cySubjects[chainerId] = subjectChain
    this.state('subjects', cySubjects)

    const links = this.state('subjectLinks') || {} as Record<string, string>

    if (links[chainerId]) {
      this.setSubjectForChainer(links[chainerId], subjectChain)
    }
  }

  /*
   * addQueryToChainer should be considered an internal implementation detail of Cypress. Do not use it directly
   * outside of the Cypress codebase. It is currently used only by the command_queue, and if you think it's needed
   * elsewhere, consider if there's a way you can use existing functionality to achieve it instead.
   *
   * The command_queue calls addQueryToChainer after a query returns a function. This function is
   * is appended to the subject chain (which begins with 'undefined' if no previous subject exists), and used
   * to resolve cy.subject() as needed.
   */
  addQueryToChainer (chainerId: string, queryFn: (subject: any) => any) {
    const cySubjects = this.state('subjects') || {} as Record<string, SubjectChain>

    const subject = (cySubjects[chainerId] || [undefined]) as SubjectChain

    subject.push(queryFn)
    cySubjects[chainerId] = subject
    this.state('subjects', cySubjects)

    const links = this.state('subjectLinks') || {} as Record<string, string>

    if (links[chainerId]) {
      this.setSubjectForChainer(links[chainerId], cySubjects[chainerId])
    }
  }

  private doneEarly () {
    this.queue.cleanup()

    // we only need to worry about doneEarly when
    // it comes from a manual event such as stopping
    // Cypress or when we yield a (done) callback
    // and could arbitrarily call it whenever we want
    const p = this.state('promise')

    // if our outer promise is pending
    // then cancel outer and inner
    // and set canceled to be true
    if (p && p.isPending()) {
      this.state('canceled', true)
      this.state('cancel')()
    }
  }
}
