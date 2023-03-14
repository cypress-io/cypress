import _ from 'lodash'
import Debug from 'debug'

import { Queue } from '../util/queue'
import $dom from '../dom'
import $utils from './utils'
import $errUtils from './error_utils'
import type $Command from './command'
import type { $Cy } from './cy'

const debugErrors = Debug('cypress:driver:errors')

const __stackReplacementMarker = (fn, args) => {
  return fn(...args)
}

const commandRunningFailed = (Cypress, err, current?: $Command) => {
  const lastLog = current?.getLastLog()

  // ensure the last log on the command ends correctly
  if (lastLog) {
    lastLog.error(err)
  }

  // allow for our own custom onFail function
  if (err.onFail && _.isFunction(err.onFail)) {
    err.onFail(err)
    // clean up this onFail callback after it's been called
    delete err.onFail

    return
  }

  if (!lastLog) {
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

    Cypress.log({
      end: true,
      snapshot: true,
      error: err,
      consoleProps,
    })
  }
}

/*
 * Queries are simple beasts: They take arguments, and return an idempotent function. They contain no retry
 * logic, have no awareness of cy.stop(), and are entirely synchronous.
 *
 * retryQuery is where we intergrate this simplicity with Cypress' retryability. It verifies the return value is
 * a sync function, and retries queries until they pass or time out. Commands invoke cy.verifyUpcomingAssertions
 * directly, but the command_queue is responsible for retrying queries.
 */
async function retryQuery (command: $Command, ret: any, cy: $Cy) {
  if (cy.isCy(ret)) {
    $errUtils.throwErrByPath(
      'query_command.invoked_action', {
        args: {
          name: command.get('name'),
          action: _.last(cy.queue.get()).get('name'),
        },
      },
    )
  }

  if ($utils.isPromiseLike(ret)) {
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

  // Queries can invoke other queries - they are synchronous, and get added to the subject chain without
  // issue. But they cannot contain commands, which are async.
  // This callback watches to ensure users don't try and invoke any commands while inside a query.
  const commandEnqueued = (obj: Cypress.EnqueuedCommandAttributes) => {
    if (!obj.query) {
      $errUtils.throwErrByPath(
        'query_command.invoked_action', {
          args: {
            name: command.get('name'),
            action: obj.name,
          },
        },
      )
    }
  }

  try {
    await onRetry()
  } finally {
    // always remove this listener
    Cypress.removeListener('command:enqueued', commandEnqueued)
  }
}

export class CommandQueue extends Queue<$Command> {
  cy: $Cy

  constructor (cy: $Cy) {
    super()

    this.cy = cy
    this.run = this.run.bind(this)

    this.on('itemError', (err) => {
      if (this.cy.state('onQueueFailed')) {
        err = this.cy.state('onQueueFailed')(err, this)

        this.cy.state('onQueueFailed', null)
      }

      debugErrors('error throw while executing command queue: %o', err)

      // since this failed this means that a specific command failed
      // and we should highlight it in red or insert a new command
      // @ts-ignore
      if (_.isObject(err) && !err.name) {
        // @ts-ignore
        err.name = 'CypressError'
      }

      const current = this.cy.state('current')

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
    })
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
    let nestedIndex = this.cy.state('nestedIndex')

    // if this is a number, then we know we're about to insert this
    // into our commands and need to reset next + increment the index
    if (_.isNumber(nestedIndex) && nestedIndex < this.length) {
      this.cy.state('nestedIndex', (nestedIndex += 1))
    }

    // we look at whether or not nestedIndex is a number, because if it
    // is then we need to insert inside of our commands, else just push
    // it onto the end of the queue
    const index = _.isNumber(nestedIndex) ? nestedIndex : this.length

    this.insert(index, command)
    this.run()
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

  async runItem (command: $Command) {
    if (cy.queue !== this) {
      return
    }

    // if the command has already ran or should be skipped, just bail and increment index
    if (command.state === 'passed' || command.state === 'skipped') {
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

      return
    }

    // store the previous timeout
    const prevTimeout = this.cy.timeout()

    this.cy.state('current', command)
    this.cy.state('chainerId', command.get('chainerId'))

    const isQuery = command.get('query')
    const name = command.get('name')

    // If we have created a timeout but are in an unstable state, clear the
    // timeout in favor of the on load timeout already running.
    if (!this.cy.state('isStable')) {
      this.cy.clearTimeout()
    }

    await this.cy.whenStable()
    if (cy.queue !== this) {
      return
    }

    this.cy.state('nestedIndex', this.index)

    const args = [command.get('chainerId'), ...command.get('args')]

    command.start()
    let ret = __stackReplacementMarker(command.get('fn'), args)

    // Queries return a function which takes the current subject and returns the next subject. We wrap this in
    // retryQuery() - and let it retry until it passes, times out or is cancelled.
    // We save the original return value on the $Command though - it's what gets added to the subject chain later.
    if (isQuery) {
      command.set('queryFn', ret)
      ret = retryQuery(command, ret, this.cy)
    }

    // If the user returns cy, we don't need to await anything; commands they invoked
    // have already been pushed onto the queue.
    if (this.cy.isCy(ret)) {
      ret = null
    }

    Cypress.action('cy:command:start', command)

    let subject = await ret
    if (cy.queue !== this) {
      return
    }

    // we may be given a regular array here so
    // we need to re-wrap the array in jquery
    // if that's the case if the first item
    // in this subject is a jquery element.
    // we want to do this because in 3.1.2 there
    // was a regression when wrapping an array of elements
    const firstSubject = $utils.unwrapFirst(subject)

    // if ret is a DOM element and its not an instance of our own jQuery
    if (subject && $dom.isElement(firstSubject) && !$dom.isJquery(subject)) {
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
    Cypress.action('cy:command:end', command)

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

    // each successful command invocation should
    // always reset the timeout for the current runnable
    // unless it already has a state.  if it has a state
    // and we reset the timeout again, it will always
    // cause a timeout later no matter what.  by this time
    // mocha expects the test to be done
    if (!this.cy.state('runnable').state) {
      this.cy.timeout(prevTimeout)
    }

    this.cy.state({
      nestedIndex: null,
      current: null,
    })
  }
}
