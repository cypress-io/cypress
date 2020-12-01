/* eslint-disable prefer-rest-params */
const _ = require('lodash')
const $ = require('jquery')
const Promise = require('bluebird')

const $dom = require('../dom')
const $utils = require('./utils')
const $errUtils = require('./error_utils')
const $stackUtils = require('./stack_utils')
const $Chai = require('../cy/chai')
const $Xhrs = require('../cy/xhrs')
const $jQuery = require('../cy/jquery')
const $Aliases = require('../cy/aliases')
const $Events = require('./events')
const $Errors = require('../cy/errors')
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
const $selection = require('../dom/selection')
const $Snapshots = require('../cy/snapshots')
const $CommandQueue = require('./command_queue')
const $VideoRecorder = require('../cy/video-recorder')
const $TestConfigOverrides = require('../cy/testConfigOverrides')

const { registerFetch } = require('unfetch')

const noArgsAreAFunction = (args) => {
  return !_.some(args, _.isFunction)
}

const isPromiseLike = (ret) => {
  return ret && _.isFunction(ret.then)
}

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
const setTopOnError = function (cy) {
  if (curCy) {
    curCy = cy

    return
  }

  curCy = cy

  // prevent overriding top.onerror twice when loading more than one
  // instance of test runner.
  if (top.onerror && top.onerror.isCypressHandler) {
    return
  }

  const onTopError = function () {
    return curCy.onUncaughtException.apply(curCy, arguments)
  }

  onTopError.isCypressHandler = true

  top.onerror = onTopError

  // Prevent Mocha from setting top.onerror which would override our handler
  // Since the setter will change which event handler gets invoked, we make it a noop
  return Object.defineProperty(top, 'onerror', {
    set () {},
    get () {
      return onTopError
    },
    configurable: false,
    enumerable: true,
  })
}

// NOTE: this makes the cy object an instance
// TODO: refactor the 'create' method below into this class
class $Cy {}

const create = function (specWindow, Cypress, Cookies, state, config, log) {
  let cy = new $Cy()
  let stopped = false
  const commandFns = {}

  const isStopped = () => {
    return stopped
  }

  const onFinishAssertions = function () {
    return assertions.finishAssertions.apply(window, arguments)
  }

  const warnMixingPromisesAndCommands = function () {
    const title = state('runnable').fullTitle()

    $errUtils.warnByPath('miscellaneous.mixing_promises_and_commands', {
      args: { title },
    })
  }

  const $$ = function (selector, context) {
    if (context == null) {
      context = state('document')
    }

    return $dom.query(selector, context)
  }

  const queue = $CommandQueue.create()

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
  const timers = $Timers.create()

  const { expect } = $Chai.create(specWindow, state, assertions.assert)

  const xhrs = $Xhrs.create(state)
  const aliases = $Aliases.create(cy)

  const errors = $Errors.create(state, config, log)
  const ensures = $Ensures.create(state, expect)

  const snapshots = $Snapshots.create($$, state)
  const testConfigOverrides = $TestConfigOverrides.create()

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
    return $Listeners.bindTo(contentWindow, {
      onError () {
        // use a function callback here instead of direct
        // reference so our users can override this function
        // if need be
        return cy.onUncaughtException.apply(cy, arguments)
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

  const wrapNativeMethods = function (contentWindow) {
    try {
      // return null to trick contentWindow into thinking
      // its not been iframed if modifyObstructiveCode is true
      if (config('modifyObstructiveCode')) {
        Object.defineProperty(contentWindow, 'frameElement', {
          get () {
            return null
          },
        })
      }

      contentWindow.HTMLElement.prototype.focus = function (focusOption) {
        return focused.interceptFocus(this, contentWindow, focusOption)
      }

      contentWindow.HTMLElement.prototype.blur = function () {
        return focused.interceptBlur(this)
      }

      contentWindow.SVGElement.prototype.focus = function (focusOption) {
        return focused.interceptFocus(this, contentWindow, focusOption)
      }

      contentWindow.SVGElement.prototype.blur = function () {
        return focused.interceptBlur(this)
      }

      contentWindow.HTMLInputElement.prototype.select = function () {
        return $selection.interceptSelect.call(this)
      }

      contentWindow.document.hasFocus = function () {
        return focused.documentHasFocus.call(this)
      }

      const cssModificationSpy = function (original, ...args) {
        snapshots.onCssModified(this.href)

        return original.apply(this, args)
      }

      const { insertRule } = contentWindow.CSSStyleSheet.prototype
      const { deleteRule } = contentWindow.CSSStyleSheet.prototype

      contentWindow.CSSStyleSheet.prototype.insertRule = _.wrap(insertRule, cssModificationSpy)
      contentWindow.CSSStyleSheet.prototype.deleteRule = _.wrap(deleteRule, cssModificationSpy)

      if (config('experimentalFetchPolyfill')) {
        // drop "fetch" polyfill that replaces it with XMLHttpRequest
        // from the app iframe that we wrap for network stubbing
        contentWindow.fetch = registerFetch(contentWindow)
        // flag the polyfill to test this experimental feature easier
        state('fetchPolyfilled', true)
      }
    } catch (error) {} // eslint-disable-line no-empty
  }

  const enqueue = function (obj) {
    // if we have a nestedIndex it means we're processing
    // nested commands and need to splice them into the
    // index past the current index as opposed to
    // pushing them to the end we also dont want to
    // reset the run defer because splicing means we're
    // already in a run loop and dont want to create another!
    // we also reset the .next property to properly reference
    // our new obj

    // we had a bug that would bomb on custom commands when it was the
    // first command. this was due to nestedIndex being undefined at that
    // time. so we have to ensure to check that its any kind of number (even 0)
    // in order to know to splice into the existing array.
    let nestedIndex = state('nestedIndex')

    // if this is a number then we know
    // we're about to splice this into our commands
    // and need to reset next + increment the index
    if (_.isNumber(nestedIndex)) {
      state('nestedIndex', (nestedIndex += 1))
    }

    // we look at whether or not nestedIndex is a number, because if it
    // is then we need to splice inside of our commands, else just push
    // it onto the end of the queu
    const index = _.isNumber(nestedIndex) ? nestedIndex : queue.length

    queue.splice(index, 0, obj)

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

  const runCommand = function (command) {
    // bail here prior to creating a new promise
    // because we could have stopped / canceled
    // prior to ever making it through our first
    // command
    if (stopped) {
      return
    }

    state('current', command)
    state('chainerId', command.get('chainerId'))

    return stability.whenStable(() => {
      // TODO: handle this event
      // @trigger "invoke:start", command

      state('nestedIndex', state('index'))

      return command.get('args')
    })

    .then((args) => {
      // store this if we enqueue new commands
      // to check for promise violations
      let ret
      let enqueuedCmd = null

      const commandEnqueued = (obj) => {
        return enqueuedCmd = obj
      }

      // only check for command enqueing when none
      // of our args are functions else commands
      // like cy.then or cy.each would always fail
      // since they return promises and queue more
      // new commands
      if (noArgsAreAFunction(args)) {
        Cypress.once('command:enqueued', commandEnqueued)
      }

      // run the command's fn with runnable's context
      try {
        ret = __stackReplacementMarker(command.get('fn'), state('ctx'), args)
      } catch (err) {
        throw err
      } finally {
        // always remove this listener
        Cypress.removeListener('command:enqueued', commandEnqueued)
      }

      state('commandIntermediateValue', ret)

      // we cannot pass our cypress instance or our chainer
      // back into bluebird else it will create a thenable
      // which is never resolved
      if (isCy(ret)) {
        return null
      }

      if (!(!enqueuedCmd || !isPromiseLike(ret))) {
        return $errUtils.throwErrByPath(
          'miscellaneous.command_returned_promise_and_commands', {
            args: {
              current: command.get('name'),
              called: enqueuedCmd.name,
            },
          },
        )
      }

      if (!(!enqueuedCmd || !!_.isUndefined(ret))) {
        // TODO: clean this up in the utility function
        // to conditionally stringify functions
        ret = _.isFunction(ret) ?
          ret.toString()
          :
          $utils.stringify(ret)

        // if we got a return value and we enqueued
        // a new command and we didn't return cy
        // or an undefined value then throw
        return $errUtils.throwErrByPath(
          'miscellaneous.returned_value_and_commands_from_custom_command', {
            args: {
              current: command.get('name'),
              returned: ret,
            },
          },
        )
      }

      return ret
    }).then((subject) => {
      state('commandIntermediateValue', undefined)

      // we may be given a regular array here so
      // we need to re-wrap the array in jquery
      // if that's the case if the first item
      // in this subject is a jquery element.
      // we want to do this because in 3.1.2 there
      // was a regression when wrapping an array of elements
      const firstSubject = $utils.unwrapFirst(subject)

      // if ret is a DOM element and its not an instance of our own jQuery
      if (subject && $dom.isElement(firstSubject) && !$utils.isInstanceOf(subject, $)) {
        // set it back to our own jquery object
        // to prevent it from being passed downstream
        // TODO: enable turning this off
        // wrapSubjectsInJquery: false
        // which will just pass subjects downstream
        // without modifying them
        subject = $dom.wrap(subject)
      }

      command.set({ subject })

      // end / snapshot our logs
      // if they need it
      command.finishLogs()

      // reset the nestedIndex back to null
      state('nestedIndex', null)

      // also reset recentlyReady back to null
      state('recentlyReady', null)

      // we're finished with the current command
      // so set it back to null
      state('current', null)

      state('subject', subject)

      return subject
    })
  }

  const run = function () {
    const next = function () {
      // bail if we've been told to abort in case
      // an old command continues to run after
      if (stopped) {
        return
      }

      // start at 0 index if we dont have one
      let index = state('index') || state('index', 0)

      const command = queue.at(index)

      // if the command should be skipped
      // just bail and increment index
      // and set the subject
      // TODO DRY THIS LOGIC UP
      if (command && command.get('skip')) {
        // must set prev + next since other
        // operations depend on this state being correct
        command.set({ prev: queue.at(index - 1), next: queue.at(index + 1) })
        state('index', index + 1)
        state('subject', command.get('subject'))

        return next()
      }

      // if we're at the very end
      if (!command) {
        // trigger queue is almost finished
        Cypress.action('cy:command:queue:before:end')

        // we need to wait after all commands have
        // finished running if the application under
        // test is no longer stable because we cannot
        // move onto the next test until its finished
        return stability.whenStable(() => {
          Cypress.action('cy:command:queue:end')

          return null
        })
      }

      // store the previous timeout
      const prevTimeout = timeouts.timeout()

      // store the current runnable
      const runnable = state('runnable')

      Cypress.action('cy:command:start', command)

      return runCommand(command)
      .then(() => {
        // each successful command invocation should
        // always reset the timeout for the current runnable
        // unless it already has a state.  if it has a state
        // and we reset the timeout again, it will always
        // cause a timeout later no matter what.  by this time
        // mocha expects the test to be done
        let fn

        if (!runnable.state) {
          timeouts.timeout(prevTimeout)
        }

        // mutate index by incrementing it
        // this allows us to keep the proper index
        // in between different hooks like before + beforeEach
        // else run will be called again and index would start
        // over at 0
        state('index', (index += 1))

        Cypress.action('cy:command:end', command)

        fn = state('onPaused')

        if (fn) {
          return new Promise((resolve) => {
            return fn(resolve)
          }).then(next)
        }

        return next()
      })
    }

    let inner = null

    // this ends up being the parent promise wrapper
    const promise = new Promise((resolve, reject) => {
      // bubble out the inner promise
      // we must use a resolve(null) here
      // so the outer promise is first defined
      // else this will kick off the 'next' call
      // too soon and end up running commands prior
      // to promise being defined
      inner = Promise
      .resolve(null)
      .then(next)
      .then(resolve)
      .catch(reject)

      // can't use onCancel argument here because
      // its called asynchronously

      // when we manually reject our outer promise we
      // have to immediately cancel the inner one else
      // it won't be notified and its callbacks will
      // continue to be invoked
      // normally we don't have to do this because rejections
      // come from the inner promise and bubble out to our outer
      //
      // but when we manually reject the outer promise we
      // have to go in the opposite direction from outer -> inner
      const rejectOuterAndCancelInner = function (err) {
        inner.cancel()

        return reject(err)
      }

      state('resolve', resolve)
      state('reject', rejectOuterAndCancelInner)
    })
    .catch((err) => {
      // since this failed this means that a
      // specific command failed and we should
      // highlight it in red or insert a new command
      err.name = err.name || 'CypressError'
      errors.commandRunningFailed(err)

      return fail(err, state('runnable'))
    })
    .finally(cleanup)

    // cancel both promises
    const cancel = function () {
      promise.cancel()
      inner.cancel()

      // notify the world
      return Cypress.action('cy:canceled')
    }

    state('cancel', cancel)
    state('promise', promise)

    // return this outer bluebird promise
    return promise
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
    stopped = true

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

  const getUserInvocationStack = (err) => {
    const current = state('current')
    const currentAssertionCommand = current?.get('currentAssertionCommand')
    const withInvocationStack = currentAssertionCommand || current
    // user assertion errors (expect().to, etc) get their invocation stack
    // attached to the error thrown from chai
    // command errors and command assertion errors (default assertion or cy.should)
    // have the invocation stack attached to the current command
    // prefer err.userInvocation stack if it's been set
    let userInvocationStack = $errUtils.getUserInvocationStack(err) || state('currentAssertionUserInvocationStack')

    // if there is no user invocation stack from an assertion or it is the default
    // assertion, meaning it came from a command (e.g. cy.get), prefer the
    // command's user invocation stack so the code frame points to the command.
    // `should` callbacks are tricky because the `currentAssertionUserInvocationStack`
    // points to the `cy.should`, but the error came from inside the callback,
    // so we need to prefer that.
    if (
      !userInvocationStack
      || err.isDefaultAssertionErr
      || (currentAssertionCommand && !current?.get('followedByShouldCallback'))
    ) {
      userInvocationStack = withInvocationStack?.get('userInvocationStack')
    }

    if (!userInvocationStack) return

    if (
      $errUtils.isCypressErr(err)
      || $errUtils.isAssertionErr(err)
      || $errUtils.isChaiValidationErr(err)
    ) {
      return userInvocationStack
    }
  }

  const fail = (err) => {
    let rets

    stopped = true

    if (typeof err === 'string') {
      err = new Error(err)
    }

    err.stack = $stackUtils.normalizedStack(err)

    err = $errUtils.enhanceStack({
      err,
      userInvocationStack: getUserInvocationStack(err),
      projectRoot: config('projectRoot'),
    })

    err = $errUtils.processErr(err, config)

    // store the error on state now
    state('error', err)

    const finish = function (err) {
      // if we have an async done callback
      // we have an explicit (done) callback and
      // we aren't attached to the cypress command queue
      // promise chain and throwing the error would only
      // result in an unhandled rejection
      let d

      d = state('done')

      if (d) {
        // invoke it with err
        return d(err)
      }

      // else we're connected to the promise chain
      // and need to throw so this bubbles up
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

    // else figure out how to finisht this failure
    return finish(err)
  }

  _.extend(cy, {
    id: _.uniqueId('cy'),

    // synchrounous querying
    $$,

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
          return stability.isStable(true, 'load')
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
      if (stopped) {
        return
      }

      return doneEarly()
    },

    reset (attrs, test) {
      stopped = false

      const s = state()

      const backup = {
        window: s.window,
        document: s.document,
        $autIframe: s.$autIframe,
      }

      // reset state back to empty object
      state.reset()

      // and then restore these backed up props
      state(backup)

      queue.reset()
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
          if (isPromiseLike(ret) && noArgsAreAFunction(current.get('args'))) {
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

          run()
        }

        return chain
      }

      return cy.addChainer(name, (chainer, userInvocationStack, args) => {
        const { firstCall, chainerId } = chainer

        // dont enqueue / inject any new commands if
        // onInjectCommand returns false
        const onInjectCommand = state('onInjectCommand')

        if (_.isFunction(onInjectCommand)) {
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

      wrapNativeMethods(contentWindow)

      snapshots.onBeforeWindowLoad()

      return timers.wrap(contentWindow)
    },

    onSpecWindowUncaughtException () {
      // create the special uncaught exception err
      const err = errors.createUncaughtException('spec', arguments)
      const runnable = state('runnable')

      if (!runnable) return err

      try {
        fail(err)
      } catch (failErr) {
        const r = state('reject')

        if (r) {
          return r(err)
        }

        return failErr
      }
    },

    onUncaughtException () {
      let r
      const runnable = state('runnable')

      // don't do anything if we don't have a current runnable
      if (!runnable) {
        return
      }

      // create the special uncaught exception err
      const err = errors.createUncaughtException('app', arguments)

      const results = Cypress.action('app:uncaught:exception', err, runnable)

      // dont do anything if any of our uncaught:exception
      // listeners returned false
      if (_.some(results, returnedFalse)) {
        return
      }

      // do all the normal fail stuff and promise cancelation
      // but dont re-throw the error
      r = state('reject')

      if (r) {
        r(err)
      }

      // per the onerror docs we need to return true here
      // https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onerror
      // When the function returns true, this prevents the firing of the default event handler.
      return true
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
      stopped = false

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
                (!isPromiseLike(ret))) {
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
          if ((!isCy(ret)) && isPromiseLike(ret)) {
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
          return fail(err, runnable)
        }
      }
    },
  })

  setTopOnError(cy)

  // make cy global in the specWindow
  specWindow.cy = cy

  $Events.extend(cy)

  return cy
}

module.exports = {
  create,
}
