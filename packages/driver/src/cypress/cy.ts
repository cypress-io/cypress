/* eslint-disable prefer-rest-params */
import _ from 'lodash'
import Promise from 'bluebird'
import debugFn from 'debug'

import $dom from '../dom'
import $utils from './utils'
import $errUtils, { ErrorFromProjectRejectionEvent } from './error_utils'
import $stackUtils from './stack_utils'

import { create as createChai, IChai } from '../cy/chai'
import { create as createXhr, IXhr } from '../cy/xhrs'
import { create as createJQuery, IJQuery } from '../cy/jquery'
import { create as createAliases, IAliases } from '../cy/aliases'
import { extend as extendEvents } from './events'
import { create as createEnsures, IEnsures } from '../cy/ensures'
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

import type { ICypress } from '../cypress'
import type { ICookies } from './cookies'
import type { StateFunc } from './state'
import type { AutomationCookie } from '@packages/server/lib/automation/cookies'

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
    set () {},
    get () {},
    configurable: false,
    enumerable: true,
  })

  top.addEventListener('unhandledrejection', onTopError('unhandledrejection'))

  top.__alreadySetErrorHandlers__ = true
}

interface ICyFocused extends Omit<
  IFocused,
  'documentHasFocus' | 'interceptFocus' | 'interceptBlur'
> {}

interface ICySnapshots extends Omit<
  ISnapshots,
  'onCssModified' | 'onBeforeWindowLoad'
> {}

export class $Cy extends EventEmitter2 implements ITimeouts, IStability, IAssertions, IRetries, IJQuery, ILocation, ITimer, IChai, IXhr, IAliases, IEnsures, ICySnapshots, ICyFocused {
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
  isAnticipatingCrossOriginResponseFor: IStability['isAnticipatingCrossOriginResponseFor']
  whenStableOrAnticipatingCrossOriginResponse: IStability['whenStableOrAnticipatingCrossOriginResponse']

  assert: IAssertions['assert']
  verifyUpcomingAssertions: IAssertions['verifyUpcomingAssertions']

  retry: IRetries['retry']

  $$: IJQuery['$$']
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

  resetTimer: ReturnType<typeof createTimer>['reset']
  overrides: IOverrides

  // Private methods

  ensureSubjectByType: ReturnType<typeof createEnsures>['ensureSubjectByType']
  ensureRunnable: ReturnType<typeof createEnsures>['ensureRunnable']

  onBeforeWindowLoad: ReturnType<typeof createSnapshots>['onBeforeWindowLoad']

  documentHasFocus: ReturnType<typeof createFocused>['documentHasFocus']
  interceptFocus: ReturnType<typeof createFocused>['interceptFocus']
  interceptBlur: ReturnType<typeof createFocused>['interceptBlur']

  private testConfigOverride: TestConfigOverride
  private commandFns: Record<string, Function> = {}
  private selectorFns: Record<string, Function> = {}

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
    this.now = this.now.bind(this)
    this.replayCommandsFrom = this.replayCommandsFrom.bind(this)
    this.onBeforeAppWindowLoad = this.onBeforeAppWindowLoad.bind(this)
    this.onUncaughtException = this.onUncaughtException.bind(this)
    this.setRunnable = this.setRunnable.bind(this)
    this.cleanup = this.cleanup.bind(this)

    // init traits

    const timeouts = createTimeouts(state)

    this.timeout = timeouts.timeout
    this.clearTimeout = timeouts.clearTimeout

    const stability = createStability(Cypress, state)

    this.isStable = stability.isStable
    this.whenStable = stability.whenStable
    this.isAnticipatingCrossOriginResponseFor = stability.isAnticipatingCrossOriginResponseFor
    this.whenStableOrAnticipatingCrossOriginResponse = stability.whenStableOrAnticipatingCrossOriginResponse

    const assertions = createAssertions(Cypress, this)

    this.assert = assertions.assert
    this.verifyUpcomingAssertions = assertions.verifyUpcomingAssertions

    const onFinishAssertions = function () {
      return assertions.finishAssertions.apply(window, arguments as any)
    }

    const retries = createRetries(Cypress, state, this.timeout, this.clearTimeout, this.whenStable, onFinishAssertions)

    this.retry = retries.retry

    const jquery = createJQuery(state)

    this.$$ = jquery.$$
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

    this.onBeforeWindowLoad = snapshots.onBeforeWindowLoad

    this.overrides = createOverrides(state, config, focused, snapshots)

    this.queue = new CommandQueue(state, this.timeout, stability, this.cleanup, this.fail, this.isCy, this.clearTimeout)

    setTopOnError(Cypress, this)

    // make cy global in the specWindow
    specWindow.cy = this

    extendEvents(this)

    Cypress.on('enqueue:command', (attrs: Cypress.EnqueuedCommand) => {
      this.enqueue(attrs)
    })

    Cypress.on('cross:origin:automation:cookies', (cookies: AutomationCookie[]) => {
      const existingCookies: AutomationCookie[] = state('cross:origin:automation:cookies') || []

      this.state('cross:origin:automation:cookies', existingCookies.concat(cookies))

      Cypress.backend('cross:origin:automation:cookies:received')
    })

    Cypress.on('before:stability:release', (stable: boolean) => {
      const cookies: AutomationCookie[] = state('cross:origin:automation:cookies') || []

      if (!stable || !cookies.length) return

      // reset the state cookies before setting them via automation in case
      // any more get set in the interim
      state('cross:origin:automation:cookies', [])

      // this will be awaited before any stability-reliant actions
      return Cypress.automation('add:cookies', cookies)
      .catch(() => {
        // errors here can be ignored as they're not user-actionable
      })
    })
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

    // if we dont have a "fail" handler
    // 1. callback with state("done") when async
    // 2. throw the error for the promise chain
    try {
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

    // dont need to worry about a try/catch here
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
    return $autIframe.on('load', () => {
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

        setWindowDocumentProps(autWindow, this.state)

        // we may need to update the url now
        this.urlNavigationEvent('load')

        // we normally DONT need to reapply contentWindow listeners
        // because they would have been automatically applied during
        // onBeforeAppWindowLoad, but in the case where we visited
        // about:blank in a visit, we do need these
        this.contentWindowListeners(autWindow)

        // stability is signalled after the window:load event to give event
        // listeners time to be invoked prior to moving on, but not if
        // there is a cross-origin error and the cy.origin API is
        // not utilized
        try {
          this.Cypress.action('app:window:load', this.state('window'))
          const remoteLocation = this.getRemoteLocation()

          cy.state('autOrigin', remoteLocation.originPolicy)
          this.Cypress.primaryOriginCommunicator.toAllSpecBridges('window:load', { url: remoteLocation.href })
        } catch (err: any) {
          // this catches errors thrown by user-registered event handlers
          // for `window:load`. this is used in the `catch` below so they
          // aren't mistaken as cross-origin errors
          err.isFromWindowLoadEvent = true

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

        // With cross-origin support, this is an expected error that may or may
        // not be bad, we will rely on the page load timeout to throw if we
        // don't end up where we expect to be.
        if (this.config('experimentalSessionAndOrigin') && err.name === 'SecurityError') {
          return
        }

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
      this.testConfigOverride.restoreAndSetTestConfigOverrides(test, this.Cypress.config, this.Cypress.env)

      this.removeAllListeners()
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
    .then(() => {
      const onQueueEnd = cy.state('onQueueEnd')

      if (onQueueEnd) {
        onQueueEnd()
      }
    })
    .catch(() => {
      // errors from the queue are propagated to cy.fail by the queue itself
      // and can be safely ignored here. omitting this catch causes
      // unhandled rejections to be logged because Bluebird sees a promise
      // chain with no catch handler
    })
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

    const callback = (chainer, userInvocationStack, args, firstCall = false) => {
      // dont enqueue / inject any new commands if
      // onInjectCommand returns false
      const onInjectCommand = cy.state('onInjectCommand')
      const injected = _.isFunction(onInjectCommand)

      if (injected) {
        if (onInjectCommand.call(cy, name, ...args) === false) {
          return
        }
      }

      cy.enqueue({
        name,
        args,
        type,
        chainerId: chainer.chainerId,
        userInvocationStack,
        injected,
        fn: firstCall ? cyFn : chainerFn,
      })
    }

    $Chainer.add(name, callback)

    cy[name] = function (...args) {
      cy.ensureRunnable(name)

      // this is the first call on cypress
      // so create a new chainer instance
      const chainer = new $Chainer(cy.specWindow)

      if (cy.state('chainerId')) {
        cy.linkSubject(chainer.chainerId, cy.state('chainerId'))
      }

      const userInvocationStack = $stackUtils.captureUserInvocationStack(cy.specWindow.Error)

      callback(chainer, userInvocationStack, args, true)

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

  now (name, ...args) {
    return Promise.resolve(
      this.commandFns[name].apply(this, args),
    )
  }

  replayCommandsFrom (current) {
    const cy = this

    // reset each chainerId to the
    // current value
    const chainerId = this.state('chainerId')

    const insert = function (command) {
      command.set('chainerId', chainerId)

      // clone the command to prevent
      // mutating its properties
      return cy.enqueue(command.clone())
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

    const commands = cy.getCommandsUntilFirstParentOrValidSubject(current)

    if (commands) {
      let initialCommand = commands.shift()

      const commandsToInsert = _.reduce(commands, (memo, command, index) => {
        const push = () => {
          return memo.push(command)
        }

        if (!(command.get('type') !== 'assertion')) {
          // if we're an assertion and the prev command
          // is in the memo, then push this one
          if (memo.includes(command.get('prev'))) {
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
      }, [initialCommand])

      for (let c of commandsToInsert) {
        insert(c)
      }
    }

    // prevent loop comprehension
    return null
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
    this.state('test', $utils.getTestFromRunnable(runnable))
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
    this.ensureRunnable(name)

    return this.state('runnable').ctx
  }

  private urlNavigationEvent (event) {
    return this.Cypress.action('app:navigation:changed', `page navigation event (${event})`)
  }

  private cleanup () {
    // cleanup could be called during a 'stop' event which
    // could happen in between a runnable because they are async
    if (this.state('runnable')) {
      // make sure we reset the runnable's timeout now
      this.state('runnable').resetTimeout()
    }

    // if a command fails then after each commands
    // could also fail unless we clear this out
    this.state('commandIntermediateValue', undefined)

    // reset the nestedIndex back to null
    this.state('nestedIndex', null)

    // and forcibly move the index needle to the
    // end in case we have after / afterEach hooks
    // which need to run
    return this.state('index', this.queue.length)
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
      onLoad () {},
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

  private enqueue (obj: PartialBy<Cypress.EnqueuedCommand, 'id'>) {
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
    let nestedIndex = this.state('nestedIndex')

    // if this is a number, then we know we're about to insert this
    // into our commands and need to reset next + increment the index
    if (_.isNumber(nestedIndex)) {
      this.state('nestedIndex', (nestedIndex += 1))
    }

    // we look at whether or not nestedIndex is a number, because if it
    // is then we need to insert inside of our commands, else just push
    // it onto the end of the queue
    const index = _.isNumber(nestedIndex) ? nestedIndex : this.queue.length

    this.queue.insert(index, $Command.create(obj))

    return this.Cypress.action('cy:command:enqueued', obj)
  }

  // TODO: Replace any with Command type.
  private getCommandsUntilFirstParentOrValidSubject (command, memo: any[] = []) {
    if (!command) {
      return null
    }

    // push these onto the beginning of the commands array
    memo.unshift(command)

    // break and return the memo
    if ((command.get('type') === 'parent') || $dom.isAttached(command.get('subject'))) {
      return memo
    }

    // A workaround to ensure that when looking back, aliases don't extend beyond the current
    // chainer. This whole area (`replayCommandsFrom` for aliases) will be replaced with subject chains as
    // part of the detached DOM work.
    const prev = command.get('prev')

    if (prev.get('chainerId') !== command.get('chainerId')) {
      return memo
    }

    return this.getCommandsUntilFirstParentOrValidSubject(prev, memo)
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
    const subject = this.currentSubject(chainerId)

    if (prevSubject) {
      // make sure our current subject is valid for
      // what we expect in this command
      this.ensureSubjectByType(subject, prevSubject)
    }

    args.unshift(subject)

    return args
  }

  /*
   * Use `currentSubject()` to get the subject. It reads from cy.state('subjects'), but the format and details of
   * determining this should be considered an internal implementation detail of Cypress, subject to change at any time.
   *
   * Currently, state('subjects') is an object, mapping chainerIds to the current subject for that chainer. For
   * example, it might look like:
   *
   * {
   *   'chainer2': 'foobar',
   *   'chainer4': <input>,
   * }
   *
   * Do not read this directly; Prefer currentSubject() instead.
   */
  currentSubject (chainerId = this.state('chainerId')) {
    return (this.state('subjects') || {})[chainerId]
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
   *   'chainer4': 'chainer2',
   * }
   *
   * indicating that when we eventually resolve the subject of chainer4, it should *also* be used as the subject for
   * chainer2 - for example, `cy.then(() => { return cy.get('foo') }).log()`. The inner chainer (chainer4,
   * `cy.get('foo')`) is linked to the outer chainer (chainer2) - when we eventually .get('foo'), the resolved value
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
  linkSubject (fromChainerId, toChainerId) {
    const links = this.state('subjectLinks') || {}

    links[fromChainerId] = toChainerId
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
    const links = this.state('subjectLinks') || {}

    this.state('subjectLinks', _.omitBy(links, (l) => l === chainerId))
  }

  /*
   * setSubjectForChainer should be considered an internal implementation detail of Cypress. Do not use it directly
   * outside of the Cypress codebase. It is currently used only by the command_queue, and if you think it's needed
   * elsewhere, consider carefully before adding additional uses.
   *
   * The command_queue calls setSubjectForChainer after a command has finished resolving, when we have the final
   * (non-$Chainer, non-promise) return value. This value becomes the current $Chainer's new subject - and the new
   * subject for any chainers it's linked to (see cy.linkSubject for details on that process).
   */
  setSubjectForChainer (chainerId: string, subject: any) {
    const cySubject = this.state('subjects') || {}

    cySubject[chainerId] = subject
    this.state('subjects', cySubject)

    const links = this.state('subjectLinks') || {}

    if (links[chainerId]) {
      this.setSubjectForChainer(links[chainerId], subject)
    }
  }

  private doneEarly () {
    this.queue.stop()

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

    return this.cleanup()
  }
}
