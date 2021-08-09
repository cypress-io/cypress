/* eslint-disable prefer-rest-params */
const _ = require('lodash')
const Promise = require('bluebird')
const debugErrors = require('debug')('cypress:driver:errors')

const $dom = require('../dom')
const $utils = require('./utils')
const $errUtils = require('./error_utils')
const $stackUtils = require('./stack_utils')
const $Chai = require('../cy/chai')
const $Xhrs = require('../cy/xhrs')
const $jQuery = require('../cy/jquery')
const $Aliases = require('../cy/aliases')
const $Events = require('./events')
const $Ensures = require('../cy/ensures')
const $Focused = require('../cy/focused')
const $Mouse = require('../cy/mouse')
const $Keyboard = require('../cy/keyboard')
const $Location = require('../cy/location')
const $Assertions = require('../cy/assertions')
const $Listeners = require('../cy/listeners')
const $Chainer = require('./chainer')
const $Timers = require('../cy/timers')
const $Timeouts = require('../cy/timeouts')
const $Retries = require('../cy/retries')
const $Stability = require('../cy/stability')
const $Overrides = require('../cy/overrides')
const $Snapshots = require('../cy/snapshots')
const $Command = require('./command')
const $CommandQueue = require('./command_queue')
const $VideoRecorder = require('../cy/video-recorder')
const $TestConfigOverrides = require('../cy/testConfigOverrides')

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

// We only set top.onerror once since we make it configurable:false
// but we update cy instance every run (page reload or rerun button)
let curCy = null
const setTopOnError = function (Cypress, cy) {
  if (curCy) {
    curCy = cy

    return
  }

  curCy = cy

  try {
    // this will throw if AUT is cross-domain and we don't need to worry
    // about top's error handler in that case anyway
    top.__alreadySetErrorHandlers__
  } catch (err) {
    return
  }

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

    const handled = curCy.onUncaughtException({
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
class $Cy {}

const create = function (specWindow, Cypress, Cookies, state, config, log) {
  let cy = new $Cy()
  const commandFns = {}

  state('specWindow', specWindow)

  const onFinishAssertions = function () {
    return assertions.finishAssertions.apply(window, arguments)
  }

  const warnMixingPromisesAndCommands = function () {
    const title = state('runnable').fullTitle()

    $errUtils.warnByPath('miscellaneous.mixing_promises_and_commands', {
      args: { title },
    })
  }

  $VideoRecorder.create(Cypress)
  const timeouts = $Timeouts.create(state)
  const stability = $Stability.create(Cypress, state)

  const retries = $Retries.create(Cypress, state, timeouts.timeout, timeouts.clearTimeout, stability.whenStable, onFinishAssertions)
  const assertions = $Assertions.create(Cypress, cy)

  const jquery = $jQuery.create(state)
  const location = $Location.create(state)
  const focused = $Focused.create(state)
  const keyboard = $Keyboard.create(Cypress, state)
  const mouse = $Mouse.create(state, keyboard, focused, Cypress)
  const timers = $Timers.create(Cypress)

  const { expect } = $Chai.create(specWindow, state, assertions.assert)

  const xhrs = $Xhrs.create(state)
  const aliases = $Aliases.create(cy)

  const ensures = $Ensures.create(state, expect)

  const snapshots = $Snapshots.create(jquery.$$, state)
  const testConfigOverrides = $TestConfigOverrides.create()
  const overrides = $Overrides.create(state, config, focused, snapshots)

  const isStopped = () => {
    return queue.stopped
  }

  const isCy = (val) => {
    return (val === cy) || $utils.isInstanceOf(val, $Chainer)
  }

  const runnableCtx = function (name) {
    ensures.ensureRunnable(name)

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
        stability.isStable(false, 'beforeunload')

        Cookies.setInitial()

        timers.reset()

        Cypress.action('app:window:before:unload', e)

        // return undefined so our beforeunload handler
        // doesnt trigger a confirmation dialog
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
    // it onto the end of the queu
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
      ensures.ensureSubjectByType(subject, prevSubject, name)
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
      userInvocationStack: $stackUtils.getUserInvocationStack(err, state),
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

  const queue = $CommandQueue.create(state, timeouts, stability, cleanup, fail, isCy)

  _.extend(cy, {
    id: _.uniqueId('cy'),

    // synchrounous querying
    $$: jquery.$$,

    state,

    // command queue instance
    queue,

    // errors sync methods
    fail,

    // chai expect sync methods
    expect,

    // is cy
    isCy,

    isStopped,

    // timeout sync methods
    timeout: timeouts.timeout,
    clearTimeout: timeouts.clearTimeout,

    // stability sync methods
    isStable: stability.isStable,
    whenStable: stability.whenStable,

    // xhr sync methods
    getRequestsByAlias: xhrs.getRequestsByAlias,
    getIndexedXhrByAlias: xhrs.getIndexedXhrByAlias,

    // alias sync methods
    getAlias: aliases.getAlias,
    addAlias: aliases.addAlias,
    validateAlias: aliases.validateAlias,
    getNextAlias: aliases.getNextAlias,
    aliasNotFoundFor: aliases.aliasNotFoundFor,
    getXhrTypeByAlias: aliases.getXhrTypeByAlias,

    // location sync methods
    getRemoteLocation: location.getRemoteLocation,

    // jquery sync methods
    getRemotejQueryInstance: jquery.getRemotejQueryInstance,

    // focused sync methods
    getFocused: focused.getFocused,
    needsFocus: focused.needsFocus,
    fireFocus: focused.fireFocus,
    fireBlur: focused.fireBlur,

    devices: {
      mouse,
      keyboard,
    },

    // timer sync methods
    pauseTimers: timers.pauseTimers,

    // snapshots sync methods
    createSnapshot: snapshots.createSnapshot,

    // retry sync methods
    retry: retries.retry,

    // assertions sync methods
    assert: assertions.assert,
    verifyUpcomingAssertions: assertions.verifyUpcomingAssertions,

    // ensure sync methods
    ensureWindow: ensures.ensureWindow,
    ensureElement: ensures.ensureElement,
    ensureDocument: ensures.ensureDocument,
    ensureAttached: ensures.ensureAttached,
    ensureExistence: ensures.ensureExistence,
    ensureElExistence: ensures.ensureElExistence,
    ensureElDoesNotHaveCSS: ensures.ensureElDoesNotHaveCSS,
    ensureVisibility: ensures.ensureVisibility,
    ensureDescendents: ensures.ensureDescendents,
    ensureNotReadonly: ensures.ensureNotReadonly,
    ensureNotDisabled: ensures.ensureNotDisabled,
    ensureValidPosition: ensures.ensureValidPosition,
    ensureScrollability: ensures.ensureScrollability,
    ensureElementIsNotAnimating: ensures.ensureElementIsNotAnimating,

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
          const autWindow = getContentWindow($autIframe)

          setWindowDocumentProps(autWindow, state)

          // we may need to update the url now
          urlNavigationEvent('load')

          // we normally DONT need to reapply contentWindow listeners
          // because they would have been automatically applied during
          // onBeforeAppWindowLoad, but in the case where we visited
          // about:blank in a visit, we do need these
          contentWindowListeners(autWindow)

          Cypress.action('app:window:load', state('window'))

          // we are now stable again which is purposefully
          // the last event we call here, to give our event
          // listeners time to be invoked prior to moving on
          return stability.isStable(true, 'load')
        } catch (err) {
          // we failed setting the remote window props which
          // means the page navigated to a different domain

          // temporary hack so that other tests expecting cross-origin
          // failures still fail as expected
          if (state('anticipateMultidomain')) {
            return stability.isStable(true, 'load')
          }

          let e = err

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

    reset (attrs, test) {
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
      timers.reset()
      testConfigOverrides.restoreAndSetTestConfigOverrides(test, Cypress.config, Cypress.env)

      return cy.removeAllListeners()
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

        ensures.ensureRunnable(name)

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

      overrides.wrapNativeMethods(contentWindow)

      snapshots.onBeforeWindowLoad()
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
      if (frameType === 'app' || config('componentTesting')) {
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

    detachDom (...args) {
      return snapshots.detachDom(...args)
    },

    getStyles (...args) {
      return snapshots.getStyles(...args)
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
          timeouts.timeout(timeout)
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
              // TODO: handle no longer error
              // when ended early
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
          // and the value isnt currently cy
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
}

module.exports = {
  create,
}
