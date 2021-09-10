import _ from 'lodash'
import $ from 'jquery'
import Bluebird from 'bluebird'
import Debug from 'debug'

import $queue from '../util/queue'
import $dom from '../dom'
import $utils from './utils'
import $errUtils from './error_utils'

const debugErrors = Debug('cypress:driver:errors')

interface Command {
  get(key: string): any
  get(): any
  set(key: string, value: any): any
  set(options: any): any
  attributes: object
  finishLogs(): void
}

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

      const consoleProps = {}
      const prev = current.get('prev')

      if (current.get('type') === 'parent' || !prev) return

      // if type isn't parent then we know its dual or child
      // and we can add Applied To if there is a prev command
      // and it is a parent
      consoleProps['Applied To'] = $dom.isElement(prev.get('subject')) ?
        $dom.getElements(prev.get('subject')) :
        prev.get('subject')

      return consoleProps
    },
  })
}

export default {
  create: (state, timeouts, stability, cleanup, fail, isCy) => {
    const queue = $queue.create()

    const { add, get, slice, at, reset, clear, stop } = queue

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

    const insert = (index: number, command: Command) => {
      queue.insert(index, command)

      const prev = at(index - 1) as Command
      const next = at(index + 1) as Command

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

    const find = (attrs) => {
      const matchesAttrs = _.matches(attrs)

      return _.find(queue.get(), (command: Command) => {
        return matchesAttrs(command.attributes)
      })
    }

    const runCommand = (command: Command) => {
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
          $errUtils.throwErrByPath(
            'miscellaneous.command_returned_promise_and_commands', {
              args: {
                current: command.get('name'),
                called: enqueuedCmd.name,
              },
            },
          )
        }

        if (!(!enqueuedCmd || !!_.isUndefined(ret))) {
          ret = _.isFunction(ret) ?
            ret.toString() :
            $utils.stringify(ret)

          // if we got a return value and we enqueued
          // a new command and we didn't return cy
          // or an undefined value then throw
          $errUtils.throwErrByPath(
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

    const run = (autoRun = true) => {
      let pause = false

      const next = () => {
        // when running in a secondary domain (SD), the primary domain (PD)
        // has proxy commands that represent the real commands run in the SD.
        // for everything to sync up properly, the PD controls the running of
        // the queue by running each proxy command which in turns communicates
        // to its real command, telling it to run. this means in the SD, we
        // need to pause the queue and wait for the signal to run the next
        // command. this is done here by inserting this promise into the queue
        // and resolving once state('next') is called (said signal)
        if (!autoRun && pause) {
          return new Promise((resolve) => {
            state('next', () => {
              state('next', null)
              pause = false
              resolve(next())
            })
          })
        }

        // bail if we've been told to abort in case
        // an old command continues to run after
        if (queue.stopped) {
          return
        }

        // start at 0 index if we dont have one
        let index = state('index') || state('index', 0)

        const command = at(index) as Command

        // if the command should be skipped, just bail and increment index
        if (command && command.get('skip')) {
          // must set prev + next since other
          // operations depend on this state being correct
          command.set({
            prev: at(index - 1) as Command,
            next: at(index + 1) as Command,
          })

          state('index', index + 1)
          state('subject', command.get('subject'))

          Cypress.action('cy:skipped:command:end', command)

          if (!autoRun) {
            pause = true
          }

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
          index += 1
          state('index', index)

          Cypress.action('cy:command:end', command)

          fn = state('onPaused')

          if (!autoRun) {
            pause = true
          }

          if (fn) {
            return new Bluebird((resolve) => {
              return fn(resolve)
            }).then(next)
          }

          return next()
        })
      }

      const onError = (err: Error | string) => {
        if (state('onCommandFailed')) {
          return state('onCommandFailed')(err, queue, next)
        }

        debugErrors('caught error in promise chain: %o', err)

        // since this failed this means that a specific command failed
        // and we should highlight it in red or insert a new command
        if (_.isObject(err)) {
          // @ts-ignore
          err.name = err.name || 'CypressError'
        }

        commandRunningFailed(Cypress, state, err)

        return fail(err)
      }

      const { promise, reject, cancel } = queue.run({
        onRun: next,
        onError,
        onFinish: cleanup,
      })

      state('promise', promise)
      state('reject', reject)
      state('cancel', () => {
        cancel()

        Cypress.action('cy:canceled')
      })

      return promise
    }

    return {
      logs,
      names,
      add,
      insert,
      find,
      run,
      get,
      slice,
      at,
      reset,
      clear,
      stop,

      get length () {
        return queue.length
      },

      get stopped () {
        return queue.stopped
      },
    }
  },
}
