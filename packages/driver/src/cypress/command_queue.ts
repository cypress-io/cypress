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

const commandRunningFailed = (Cypress, err, current?: $Command) => {
  // allow for our own custom onFail function
  if (err.onFail && _.isFunction(err.onFail)) {
    err.onFail(err)
    // clean up this onFail callback after it's been called
    delete err.onFail

    return
  }

  const lastLog = current?.getLastLog()

  const consoleProps = () => {
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
  }

  // ensure the last log on the command ends correctly
  if (lastLog && !lastLog.get('ended')) {
    return lastLog.set({ consoleProps }).error(err)
  }

  return Cypress.log({
    end: true,
    snapshot: true,
    error: err,
    consoleProps,
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
      ensureExistenceFor: command.get('ensureExistenceFor'),
      subjectFn: () => {
        const subject = cy.subject(command.get('chainerId'))

        // @ts-ignore
        Cypress.ensure.isType(subject, command.get('prevSubject'), command.get('name'), cy)

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
    this.run = this.run.bind(this)
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

  enqueue (command: $Command) {
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
    if (_.isNumber(nestedIndex) && nestedIndex < this.length) {
      this.state('nestedIndex', (nestedIndex += 1))
    }

    // we look at whether or not nestedIndex is a number, because if it
    // is then we need to insert inside of our commands, else just push
    // it onto the end of the queue
    const index = _.isNumber(nestedIndex) ? nestedIndex : this.length

    this.insert(index, command)
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

  cleanup () {
    const runnable = this.state('runnable')

    if (runnable && !runnable.isPending()) {
      // make sure we reset the runnable's timeout now
      runnable.resetTimeout()
    }

    // if a command fails then after each commands
    // could also fail unless we clear this out
    this.state('commandIntermediateValue', undefined)

    // reset the nestedIndex back to null
    this.state('nestedIndex', null)

    // and forcibly move the index needle to the
    // end in case we have after / afterEach hooks
    // which need to run
    this.index = this.length
  }

  private runCommand (command: $Command) {
    const isQuery = command.get('query')
    const name = command.get('name')

    // bail here prior to creating a new promise
    // because we could have stopped / canceled
    // prior to ever making it through our first
    // command
    if (this.stopped) {
      return Promise.resolve()
    }

    this.state('current', command)
    this.state('chainerId', command.get('chainerId'))

    return this.stability.whenStable(() => {
      this.state('nestedIndex', this.index)

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
      const commandEnqueued = (obj: Cypress.EnqueuedCommandAttributes) => {
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
        command.start()
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
    })
    .then((subject) => {
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
      command.pass()

      // end / snapshot our logs if they need it
      command.finishLogs()

      if (isQuery) {
        subject = command.get('queryFn')
        // For queries, the "subject" here is the query's return value, which is a function which
        // accepts a subject and returns a subject, and can be re-invoked at any time.

        subject.commandName = name
        subject.args = command.get('args')

        // Even though we've snapshotted, we only end the logs a query's logs if we're at the end of a query
        // chain - either there is no next command (end of a test), the next command is an action, or the next
        // command belongs to another chainer (end of a chain).

        // This is done so that any query's logs remain in the 'pending' state until the subject chain is finished.
        this.cy.addQueryToChainer(command.get('chainerId'), subject)
      } else {
        // For commands, the "subject" here is the command's return value, which replaces
        // the current subject chain. We cannot re-invoke commands - the return value here is final.
        this.cy.setSubjectForChainer(command.get('chainerId'), [subject])
      }

      // TODO: This line was causing subjects to be cleaned up prematurely in some instances (Specifically seen on the within command)
      // The command log would print the yielded value as null if checked outside of the current command chain.
      // this.cleanSubjects()

      this.state({
        commandIntermediateValue: undefined,
        // reset the nestedIndex back to null
        nestedIndex: null,
        // we're finished with the current command so set it back to null
        current: null,
      })

      return subject
    })
  }

  // TypeScript doesn't allow overriding functions with different type signatures
  // @ts-ignore
  run () {
    if (this.stopped) {
      this.cleanup()

      return Promise.resolve()
    }

    const next = () => {
      const command = this.at(this.index)

      // if the command has already ran or should be skipped, just bail and increment index
      if (command && (command.state === 'passed' || command.state === 'skipped')) {
        // must set prev + next since other
        // operations depend on this state being correct
        command.set({
          prev: this.at(this.index - 1),
          next: this.at(this.index + 1),
        })

        this.cy.setSubjectForChainer(command.get('chainerId'), [command.get('subject')])

        if (command.state === 'skipped') {
          Cypress.action('cy:skipped:command:end', command)
        }

        // move on to the next queueable
        this.index += 1

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
          this.stop()

          const onQueueEnd = cy.state('onQueueEnd')

          if (onQueueEnd) {
            onQueueEnd()
          }

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

      return Cypress.action<Promise<void>>('cy:command:start:async', command)
      .then(() => this.runCommand(command)!)
      .then(() => {
        // each successful command invocation should
        // always reset the timeout for the current runnable
        // unless it already has a state.  if it has a state
        // and we reset the timeout again, it will always
        // cause a timeout later no matter what.  by this time
        // mocha expects the test to be done

        if (!runnable.state) {
          this.cy.timeout(prevTimeout)
        }

        Cypress.action('cy:command:end', command)

        // move on to the next queueable
        this.index += 1

        const pauseFn = this.state('onPaused')

        if (pauseFn) {
          return new Bluebird((resolve) => {
            return pauseFn(resolve)
          }).then(next)
        }

        return next()
      })
    }

    const onError = (err) => {
      // If the runnable was marked as pending, this test was skipped
      // go ahead and just return
      const runnable = this.state('runnable')

      if (runnable.isPending()) {
        this.stop()

        return
      }

      if (this.state('onQueueFailed')) {
        err = this.state('onQueueFailed')(err, this)

        this.state('onQueueFailed', null)
      }

      debugErrors('error throw while executing cypress queue: %o', err)

      // since this failed this means that a specific command failed
      // and we should highlight it in red or insert a new command
      // @ts-ignore
      if (_.isObject(err) && !err.name) {
        // @ts-ignore
        err.name = 'CypressError'
      }

      const current = this.state('current')

      commandRunningFailed(Cypress, err, current)

      if (err.isRecovered) {
        current?.recovered()

        return // let the queue end & restart on to the next command index (set in onQueueFailed)
      }

      if (current?.state === 'queued') {
        current.skip()
      } else if (current?.state === 'pending') {
        current.fail()
      }

      Cypress.action('cy:command:failed', current, err)
      this.cleanup()

      return this.cy.fail(err)
    }

    const { promise, reject, cancel } = super.run({
      onRun: next,
      onError,
      onFinish: this.run,
    })

    this.state('promise', promise)
    this.state('reject', reject)
    this.state('cancel', () => {
      cancel()

      Cypress.action('cy:canceled')
    })

    return promise
  }

  // This function iterates through all upcoming commands in the queue, then
  // discards the subject chain for every chainer that can't be referenced
  // in the future (eg, no upcoming commands belong to the same chain).

  // This is safe because aliases (which might be referenced later) are stored
  // separately, in state('aliases'), and any subjects that "flow upwards" (eg.
  // the subject of a chain inside a .then() command) have already replaced
  // the subject of their parent chainer by the time this is called.
  cleanSubjects () {
    const stillNeeded = this.queueables.slice(this.index).map((c) => c.get('chainerId'))

    this.queueables.slice(0, this.index).forEach((command) => {
      // Once a command has resolved, and its chainer is no longer referenced
      // by future commands, we can throw away the reference to the function
      // and its subject to free memory.
      if (command.get('subject') && stillNeeded.indexOf(command.get('chainerId')) === -1) {
        command.set({ fn: null, subject: null, queryFn: null })
      }
    })

    this.cy.state('subjects', _.pick(this.cy.state('subjects'), stillNeeded))
  }
}
