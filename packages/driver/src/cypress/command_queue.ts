import _ from 'lodash'
import $ from 'jquery'
import Bluebird from 'bluebird'
import Debug from 'debug'

import { Queue } from '../util/queue'
import $dom from '../dom'
import $utils from './utils'
import $errUtils from './error_utils'
import type $Command from './command'
import type { StateFunc } from './state'
import type { $Cy } from './cy'
import type { IStability } from '../cy/stability'

const debugErrors = Debug('cypress:driver:errors')

const __stackReplacementMarker = (fn, args) => {
  return fn(...args)
}

const commandRunningFailed = (Cypress, state, err) => {
  const current = state('current')

  // allow for our own custom onFail function
  if (err.onFail) {
    err.onFail(err)

    // clean up this onFail callback after it's been called
    delete err.onFail

    return
  }

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

/*
 * Queries are simple beasts: They take arguments, and return an idempotent function. They contain no retry
 * logic, have no awareness of cy.stop(), and are entirely synchronous.
 *
 * retryQuery is where we intergrate this simplicity with Cypress' retryability. It verifies the return value is
 * a sync function, and retries queries until they pass or time out. Commands invoke cy.verifyUpcomingAssertions
 * directly, but the command_queue is responsible for retrying queries.
 */
function retryQuery (command: $Command, ret: any, cy: $Cy) {
  if ($utils.isPromiseLike(ret) && !cy.isCy(ret)) {
    $errUtils.throwErrByPath(
      'query_command.returned_promise', {
        args: { name: command.get('name') },
      },
    )
  }

  if (!_.isFunction(ret)) {
    $errUtils.throwErrByPath(
      'query_command.returned_non_function', {
        args: { name: command.get('name'), returned: ret },
      },
    )
  }

  const options = {
    timeout: command.get('timeout'),
    error: null,
    _log: command.get('_log'),
  }

  const onRetry = () => {
    return cy.verifyUpcomingAssertions(undefined, options, {
      onRetry,
      onFail: command.get('onFail'),
      subjectFn: () => {
        const subject = cy.currentSubject(command.get('chainerId'))

        cy.ensureSubjectByType(subject, command.get('prevSubject'))

        return ret(subject)
      },
    })
  }

  return onRetry()
}

export class CommandQueue extends Queue<$Command> {
  state: StateFunc
  stability: IStability
  cy: $Cy

  constructor (
    state: StateFunc,
    stability: IStability,
    cy: $Cy,
  ) {
    super()
    this.state = state
    this.stability = stability
    this.cy = cy
  }

  logs (filter) {
    let logs = _.flatten(_.invokeMap(this.get(), 'get', 'logs'))

    if (filter) {
      const matchesFilter = _.matches(filter)

      logs = _.filter(logs, (log) => {
        return matchesFilter(log.get())
      })
    }

    return logs
  }

  names () {
    return _.invokeMap(this.get(), 'get', 'name')
  }

  insert (index: number, command: $Command) {
    super.insert(index, command)

    const prev = this.at(index - 1)
    const next = this.at(index + 1)

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

  find (attrs) {
    const matchesAttrs = _.matches(attrs)

    return _.find(this.get(), (command: $Command) => {
      return matchesAttrs(command.attributes)
    })
  }

  /**
   * Check if the current command index is the last command in the queue
   * @returns boolean
   */
  isOnLastCommand (): boolean {
    return this.state('index') === this.length
  }

  private runCommand (command: $Command) {
    const isQuery = command.get('query')
    const name = command.get('name')

    // bail here prior to creating a new promise
    // because we could have stopped / canceled
    // prior to ever making it through our first
    // command
    if (this.stopped) {
      return
    }

    this.state('current', command)
    this.state('chainerId', command.get('chainerId'))

    return this.stability.whenStable(() => {
      this.state('nestedIndex', this.state('index'))

      return command.get('args')
    })
    .then((args: any) => {
      // store this if we enqueue new commands
      // to check for promise violations
      let ret
      let enqueuedCmd

      // Queries can invoke other queries - they are synchronous, and get added to the subject chain without
      // issue. But they cannot contain commands, which are async.
      // This callback watches to ensure users don't try and invoke any commands while inside a query.
      const commandEnqueued = (obj) => {
        if (isQuery && !obj.query) {
          $errUtils.throwErrByPath(
            'query_command.invoked_action', {
              args: {
                name,
                action: obj.name,
              },
            },
          )
        }

        return enqueuedCmd = obj
      }

      // only check for command enqueuing when none
      // of our args are functions else commands
      // like cy.then or cy.each would always fail
      // since they return promises and queue more
      // new commands
      if ($utils.noArgsAreAFunction(args)) {
        Cypress.once('command:enqueued', commandEnqueued)
      }

      args = [command.get('chainerId'), ...args]

      // run the command's fn with runnable's context
      try {
        ret = __stackReplacementMarker(command.get('fn'), args)

        // Queries return a function which takes the current subject and returns the next subject. We wrap this in
        // retryQuery() - and let it retry until it passes, times out or is cancelled.
        // We save the original return value on the $Command though - it's what gets added to the subject chain later.
        if (isQuery) {
          command.set('queryFn', ret)
          ret = retryQuery(command, ret, this.cy)
        }
      } catch (err) {
        throw err
      } finally {
        // always remove this listener
        Cypress.removeListener('command:enqueued', commandEnqueued)
      }

      this.state('commandIntermediateValue', ret)

      // we cannot pass our cypress instance or our chainer
      // back into bluebird else it will create a thenable
      // which is never resolved
      if (this.cy.isCy(ret)) {
        return null
      }

      if (!(!enqueuedCmd || !$utils.isPromiseLike(ret))) {
        $errUtils.throwErrByPath(
          'miscellaneous.command_returned_promise_and_commands', {
            args: {
              current: name,
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
            args: { current: name, returned: ret },
          },
        )
      }

      return ret
    }).then((subject) => {
      this.state('commandIntermediateValue', undefined)

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

      // When a command - query or normal - first passes, we verify that we have any snapshots needed.
      // The logs may still be pending, but we want to know the state of the DOM now, before any subsequent commands
      // run to alter it.
      command.snapshotLogs()

      if (isQuery) {
        subject = command.get('queryFn')
        // For queries, the "subject" here is the query's return value, which is a function which
        // accepts a subject and returns a subject, and can be re-invoked at any time.

        // We add the command name here only to make debugging easier; It should not be relied on functionally.
        subject.commandName = name

        // Even though we've snapshotted, we only end the logs a query's logs if we're at the end of a query
        // chain - either there is no next command (end of a test), the next command is an action, or the next
        // command belongs to another chainer (end of a chain).

        // This is done so that any query's logs remain in the 'pending' state until the subject chain is finished.
        this.cy.addQueryToChainer(command.get('chainerId'), subject)

        const next = command.get('next')

        if (!next || next.get('chainerId') !== command.get('chainerId') || !next.get('query')) {
          command.finishLogs()
        }
      } else {
        // For commands, the "subject" here is the command's return value, which replaces
        // the current subject chain. We cannot re-invoke commands - the return value here is final.
        this.cy.setSubjectForChainer(command.get('chainerId'), subject)
        command.finishLogs()
      }

      // reset the nestedIndex back to null
      this.state('nestedIndex', null)

      // we're finished with the current command so set it back to null
      this.state('current', null)

      return subject
    })
  }

  // TypeScript doesn't allow overriding functions with different type signatures
  // @ts-ignore
  run () {
    const next = () => {
      // bail if we've been told to abort in case
      // an old command continues to run after
      if (this.stopped) {
        return
      }

      // start at 0 index if one is not already set
      let index = this.state('index') || this.state('index', 0)

      const command = this.at(index)

      // if the command should be skipped, just bail and increment index
      if (command && command.get('skip')) {
        // must set prev + next since other
        // operations depend on this state being correct
        command.set({
          prev: this.at(index - 1),
          next: this.at(index + 1),
        })

        this.state('index', index + 1)

        this.cy.setSubjectForChainer(command.get('chainerId'), command.get('subject'))

        Cypress.action('cy:skipped:command:end', command)

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
        return this.stability.whenStable(() => {
          Cypress.action('cy:command:queue:end')

          return null
        })
      }

      // store the previous timeout
      const prevTimeout = this.cy.timeout()

      // If we have created a timeout but are in an unstable state, clear the
      // timeout in favor of the on load timeout already running.
      if (!this.state('isStable')) {
        this.cy.clearTimeout()
      }

      // store the current runnable
      const runnable = this.state('runnable')

      Cypress.action('cy:command:start', command)

      return this.runCommand(command)!
      .then(() => {
        // each successful command invocation should
        // always reset the timeout for the current runnable
        // unless it already has a state.  if it has a state
        // and we reset the timeout again, it will always
        // cause a timeout later no matter what.  by this time
        // mocha expects the test to be done
        let fn

        if (!runnable.state) {
          this.cy.timeout(prevTimeout)
        }

        // mutate index by incrementing it
        // this allows us to keep the proper index
        // in between different hooks like before + beforeEach
        // else run will be called again and index would start
        // over at 0
        index += 1
        this.state('index', index)

        Cypress.action('cy:command:end', command)

        fn = this.state('onPaused')

        if (fn) {
          return new Bluebird((resolve) => {
            return fn(resolve)
          }).then(next)
        }

        return next()
      })
    }

    const onError = (err: Error | string) => {
      // If the runnable was marked as pending, this test was skipped
      // go ahead and just return
      const runnable = this.state('runnable')

      if (runnable.isPending()) {
        return
      }

      if (this.state('onCommandFailed')) {
        return this.state('onCommandFailed')(err, this, next)
      }

      debugErrors('caught error in promise chain: %o', err)

      // since this failed this means that a specific command failed
      // and we should highlight it in red or insert a new command
      // @ts-ignore
      if (_.isObject(err) && !err.name) {
        // @ts-ignore
        err.name = 'CypressError'
      }

      commandRunningFailed(Cypress, this.state, err)

      return this.cy.fail(err)
    }

    const { promise, reject, cancel } = super.run({
      onRun: next,
      onError,
      onFinish: this.cy.cleanup,
    })

    this.state('promise', promise)
    this.state('reject', reject)
    this.state('cancel', () => {
      cancel()

      Cypress.action('cy:canceled')
    })

    return promise
  }
}
