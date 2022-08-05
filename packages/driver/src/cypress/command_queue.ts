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
import type { ITimeouts } from '../cy/timeouts'

const debugErrors = Debug('cypress:driver:errors')

const __stackReplacementMarker = (fn, args) => {
  return fn(...args)
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

export class CommandQueue extends Queue<$Command> {
  state: StateFunc
  timeout: $Cy['timeout']
  stability: IStability
  cleanup: $Cy['cleanup']
  fail: $Cy['fail']
  isCy: $Cy['isCy']
  clearTimeout: ITimeouts['clearTimeout']

  constructor (state: StateFunc, timeout: $Cy['timeout'], stability: IStability, cleanup: $Cy['cleanup'], fail: $Cy['fail'], isCy: $Cy['isCy'], clearTimeout: ITimeouts['clearTimeout']) {
    super()
    this.state = state
    this.timeout = timeout
    this.stability = stability
    this.cleanup = cleanup
    this.fail = fail
    this.isCy = isCy
    this.clearTimeout = clearTimeout
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
    // bail here prior to creating a new promise
    // because we could have stopped / canceled
    // prior to ever making it through our first
    // command
    if (this.stopped) {
      return
    }

    this.state('current', command)
    this.state('chainerId', command.get('chainerId'))

    return this.stability.whenStableOrAnticipatingCrossOriginResponse(() => {
      this.state('nestedIndex', this.state('index'))

      return command.get('args')
    }, command)
    .then((args) => {
      // store this if we enqueue new commands
      // to check for promise violations
      let ret
      let enqueuedCmd

      const commandEnqueued = (obj) => {
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
      if (this.isCy(ret)) {
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

      // end / snapshot our logs if they need it
      command.finishLogs()

      // reset the nestedIndex back to null
      this.state('nestedIndex', null)

      // we're finished with the current command so set it back to null
      this.state('current', null)

      cy.setSubjectForChainer(command.get('chainerId'), subject)

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

        cy.setSubjectForChainer(command.get('chainerId'), command.get('subject'))

        Cypress.action('cy:skipped:command:end', command)

        return next()
      }

      // if we're at the very end
      if (!command) {
        // trigger queue is almost finished
        Cypress.action('cy:command:queue:before:end')

        // If we're enabled experimentalSessionAndOrigin we no longer have to wait for stability at the end of the command queue.
        if (Cypress.config('experimentalSessionAndOrigin')) {
          Cypress.action('cy:command:queue:end')

          return null
        }

        // we need to wait after all commands have
        // finished running if the application under
        // test is no longer stable because we cannot
        // move onto the next test until its finished
        return this.stability.whenStableOrAnticipatingCrossOriginResponse(() => {
          Cypress.action('cy:command:queue:end')

          return null
        })
      }

      // store the previous timeout
      const prevTimeout = this.timeout()

      // If we have created a timeout but are in an unstable state, clear the
      // timeout in favor of the on load timeout already running.
      if (!this.state('isStable')) {
        this.clearTimeout()
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
          this.timeout(prevTimeout)
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

      return this.fail(err)
    }

    const { promise, reject, cancel } = super.run({
      onRun: next,
      onError,
      onFinish: this.cleanup,
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
