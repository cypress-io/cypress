import _ from 'lodash'
import $ from 'jquery'
import Bluebird from 'bluebird'
import Debug from 'debug'

import { create as createQueue } from '../util/queue'
import $dom from '../dom'
import $utils from './utils'
import $errUtils from './error_utils'

const debugErrors = Debug('cypress:driver:errors')

// TODO: can this be abstracted along with the one in cy.js
// or does it need to be in this file?
const __stackReplacementMarker = (fn, ctx, args) => {
  return fn.apply(ctx, args)
}

const commandRunningFailed = (Cypress, state, err) => {
  // allow for our own custom onFail function
  if (err.onFail) {
    err.onFail(err)

    // clean up this onFail callback after it's been called
    delete err.onFail

    return
  }

  const current = state('current')

  return Cypress.log({
    end: true,
    snapshot: true,
    error: err,
    consoleProps () {
      if (!current) return

      const obj = {}
      const prev = current.get('prev')

      // if type isnt parent then we know its dual or child
      // and we can add Applied To if there is a prev command
      // and it is a parent
      if (current.get('type') !== 'parent' && prev) {
        const ret = $dom.isElement(prev.get('subject')) ?
          $dom.getElements(prev.get('subject'))
          :
          prev.get('subject')

        obj['Applied To'] = ret

        return obj
      }
    },
  })
}

export const create = (state, timeouts, stability, cleanup, fail, isCy) => {
  const queue = createQueue()
  let stopped = false

  const get = () => {
    return queue.get()
  }

  const logs = (filter) => {
    let logs = _.flatten(_.invokeMap(queue.get(), 'get', 'logs'))

    if (filter) {
      const matchesFilter = _.matches(filter)

      logs = _.filter(logs, (log) => {
        return matchesFilter(log.get())
      })
    }

    return logs
  }

  const names = () => {
    return _.invokeMap(queue.get(), 'get', 'name')
  }

  const add = (command) => {
    queue.add({
      data: command,
      run () {},
    })
  }

  const insert = (index: number, command) => {
    queue.insert(index, {
      data: command,
      run () {},
    })

    const prev = at(index - 1)
    const next = at(index + 1)

    if (prev) {
      prev.set('next', command)
      command.set('prev', prev)
    }

    if (next) {
      next.set('prev', command)
      command.set('next', next)
    }

    return command
  }

  const slice = (index: number) => {
    return queue.slice(index)
  }

  const at = (index: number) => {
    return queue.at(index)
  }

  const find = (attrs) => {
    const matchesAttrs = _.matches(attrs)

    return _.find(queue.get(), (command) => {
      return matchesAttrs(command.attributes)
    })
  }

  const reset = () => {
    queue.reset()
  }

  const clear = () => {
    queue.clear()
  }

  const stop = () => {
    queue.stop()
  }

  const runCommand = function (command) {
    // bail here prior to creating a new promise
    // because we could have stopped / canceled
    // prior to ever making it through our first
    // command
    if (queue.stopped) {
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
      let enqueuedCmd

      const commandEnqueued = (obj) => {
        return enqueuedCmd = obj
      }

      // only check for command enqueing when none
      // of our args are functions else commands
      // like cy.then or cy.each would always fail
      // since they return promises and queue more
      // new commands
      if ($utils.noArgsAreAFunction(args)) {
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

      if (!(!enqueuedCmd || !$utils.isPromiseLike(ret))) {
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

  const run = () => {
    const next = () => {
      // bail if we've been told to abort in case
      // an old command continues to run after
      if (stopped) {
        return
      }

      // start at 0 index if we dont have one
      let index = state('index') || state('index', 0)

      const command = at(index)

      // if the command should be skipped
      // just bail and increment index
      // and set the subject
      // TODO DRY THIS LOGIC UP
      if (command && command.get('skip')) {
        // must set prev + next since other
        // operations depend on this state being correct
        command.set({ prev: at(index - 1), next: at(index + 1) })
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
          return new Bluebird((resolve) => {
            return fn(resolve)
          }).then(next)
        }

        return next()
      })
    }

    let inner

    // this ends up being the parent promise wrapper
    const promise = new Bluebird((resolve, reject) => {
      // bubble out the inner promise
      // we must use a resolve(null) here
      // so the outer promise is first defined
      // else this will kick off the 'next' call
      // too soon and end up running commands prior
      // to promise being defined
      inner = Bluebird
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
      debugErrors('caught error in promise chain: %o', err)

      // since this failed this means that a
      // specific command failed and we should
      // highlight it in red or insert a new command
      err.name = err.name || 'CypressError'
      commandRunningFailed(Cypress, state, err)

      return fail(err)
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

  return {
    get,
    logs,
    names,
    add,
    insert,
    slice,
    at,
    find,
    run,
    reset,
    clear,
    stop,

    get length () {
      return queue.get().length
    },

    get stopped () {
      return queue.stopped
    },
  }
}
