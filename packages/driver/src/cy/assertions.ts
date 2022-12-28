import _ from 'lodash'
import Promise from 'bluebird'

import $dom from '../dom'
import type { ICypress } from '../cypress'
import type { $Cy } from '../cypress/cy'

// TODO
// bTagOpen + bTagClosed
// are duplicated in assertions.coffee
const butRe = /,? but\b/
const bTagOpen = /\*\*/g
const bTagClosed = /\*\*/g
const stackTracesRe = / at .*\n/gm

const exists = (subject, cy: $Cy) => {
  // prevent any additional logs since this is an implicit assertion
  cy.state('onBeforeLog', () => false)

  // verify the $el exists and use our default error messages
  try {
    cy.expect(subject).to.exist
  } finally {
    cy.state('onBeforeLog', null)
  }
}

const elExists = ($el, cy: $Cy) => {
  // ensure that we either had some assertions
  // or that the element existed
  if ($el && $el.length) {
    return
  }

  // TODO: REFACTOR THIS TO CALL THE CHAI-OVERRIDES DIRECTLY
  // OR GO THROUGH I18N

  return exists($el, cy)
}

type Parsed = {
  subject?: JQuery<any>
  actual?: any
  expected?: any
}

// Rules:
// 1. always remove value
// 2. if value is a jquery object set a subject
// 3. if actual is undefined or its not expected remove both actual + expected
const parseValueActualAndExpected = (value, actual, expected) => {
  const obj: Parsed = { actual, expected }

  if ($dom.isJquery(value)) {
    obj.subject = value

    if (_.isUndefined(actual) || (actual !== expected)) {
      delete obj.actual
      delete obj.expected
    }
  }

  return obj
}

export const isCheckingExistence = (chainerString) => /exist/.test(chainerString.split('.'))

export const isCheckingLength = (chainerString) => /length/.test(chainerString.split('.'))

export const create = (Cypress: ICypress, cy: $Cy) => {
  const hasUpcomingExistenceAssertions = () => {
    const index = cy.queue.index + 1

    // grab the rest of the queue'd commands
    for (let cmd of cy.queue.slice(index)) {
      // don't break on utilities, just skip over them
      if (cmd.is('utility')) {
        continue
      }

      // grab all of the queued commands which are
      // assertions and match our current chainerId
      if (cmd.get('name') === 'and' || cmd.get('name') === 'should') {
        const chainers = cmd.get('args')[0]

        if (_.isString(chainers) && (isCheckingExistence(chainers) || isCheckingLength(chainers))) {
          return true
        }
      } else {
        break
      }
    }

    return false
  }

  function assert (passed, message, value, actual, expected, error) {
    // slice off everything after a ', but' or ' but ' for passing assertions, because
    // otherwise it doesn't make sense:
    // "expected <div> to have a an attribute 'href', but it was 'href'"
    if (message && passed && butRe.test(message)) {
      message = message.substring(0, message.search(butRe))
    }

    if (value && value.isSinonProxy) {
      message = message.replace(stackTracesRe, '\n')
    }

    let parsed = parseValueActualAndExpected(value, actual, expected)
    // TODO: make it more specific after defining the type for Cypress.log().
    let obj: Record<string, any> = {
      ...parsed,
    }

    if ($dom.isElement(value)) {
      obj.$el = $dom.wrap(value)
    }

    if (cy.state('current')) {
      // If we're inside a Cypress command, a snapshot will be taken when the
      // command either passes or fails, and the `_error` turned into a real `error`.
      // We don't want to snapshot immediately since we're likely to retry
      // the command many times if it's failing.
      obj._error = error
      obj.type = 'child'
    } else {
      // If we're outside a Cypress command, then there's no item in the command_queue
      // that will later resolve this log message - we do it immediately, pass or fail,
      // since there's no retry loop going on.
      obj.error = error
      obj.end = true
      obj.snapshot = true
      obj.type = 'parent'
    }

    _.extend(obj, {
      name: 'assert',
      message,
      passed,
      selector: value ? value.selector : undefined,
      timeout: 0,

      consoleProps: () => {
        obj = { Command: 'assert' }

        _.extend(obj, parseValueActualAndExpected(value, actual, expected))

        return _.extend(obj,
          { Message: message.replace(bTagOpen, '').replace(bTagClosed, '') })
      },
    })

    // think about completely gutting the whole object toString
    // which chai does by default, its so ugly and worthless

    if (error) {
      error.onFail = (err) => { }
    }

    Cypress.log(obj)

    return null
  }

  const finishAssertions = (err?: Error) => {
    const logs = cy.state('current').get('logs')

    let hasLoggedError = false

    logs.reverse().forEach((log, index) => {
      if (log._shouldAutoEnd()) {
        if (log.get('next') || !log.get('snapshots')) {
          log.snapshot()
        }

        // @ts-ignore
        if (err && (!hasLoggedError || (err.issuesCommunicatingOrFinding && index === logs.length - 1))) {
          hasLoggedError = true

          return log.error(err)
        }

        return log.end()
      }
    })

    cy.state('current').finishLogs()
  }

  type VerifyUpcomingAssertionsCallbacks = {
    ensureExistenceFor?: 'subject' | 'dom' | boolean
    onFail?: (err?, isDefaultAssertionErr?: boolean, cmds?: any[]) => void
    onRetry?: () => any
    subjectFn?: () => any
  }

  return {
    finishAssertions,
    assert,

    // TODO: define the specific type of options
    verifyUpcomingAssertions (subject, options: Record<string, any> = {}, callbacks: VerifyUpcomingAssertionsCallbacks = {}) {
      if (hasUpcomingExistenceAssertions()) {
        return Promise.resolve(subject)
      }

      _.defaults(callbacks, {
        ensureExistenceFor: 'dom',
      })

      const ensureExistence = () => {
        // by default, ensure existence for dom subjects,
        // but not non-dom subjects
        switch (callbacks.ensureExistenceFor) {
          case 'dom': {
            const $el = determineEl(options.$el, subject)

            if (!$dom.isJquery($el)) {
              return
            }

            return elExists($el, cy)
          }
          case 'subject':
            return exists(subject, cy)

          default:
            return
        }
      }

      const determineEl = ($el, subject) => {
        // prefer $el unless it is strictly undefined
        if (!_.isUndefined($el)) {
          return $el
        }

        return subject
      }

      const onPassFn = () => {
        return subject
      }

      const onFailFn = (err) => {
        // when we fail for whatever reason we need to
        // check to see if we would firstly fail if
        // we don't have an el in existence. what this
        // catches are assertions downstream about an
        // elements existence but the element never
        // exists in the first place. this will probably
        // ensure the error is about existence not about
        // the downstream assertion.
        try {
          callbacks.ensureExistenceFor === 'dom' && ensureExistence()
        } catch (e2) {
          e2.issuesCommunicatingOrFinding = true
          err = e2
        }

        err.isDefaultAssertionErr = true

        options.error = err

        const { onFail, onRetry } = callbacks

        if (err.retry === false || (!onFail && !onRetry)) {
          err.onFail = finishAssertions
          throw err
        }

        // if our onFail throws then capture it
        // and finish the assertions and then throw
        // it again
        try {
          if (_.isFunction(onFail)) {
            // pass in the err and the upcoming assertion commands
            onFail.call(this, err, true, [])
          }
        } catch (e3) {
          e3.onFail = finishAssertions
          throw e3
        }

        if (_.isFunction(onRetry)) {
          //@ts-expect-error
          return cy.retry(onRetry, options)
        }

        return
      }

      if (callbacks.subjectFn) {
        try {
          subject = callbacks.subjectFn()
        } catch (err) {
          return onFailFn(err)
        }
      }

      return Promise
      .try(ensureExistence)
      .then(onPassFn)
      .catch(onFailFn)
    },
  }
}

export interface IAssertions {
  verifyUpcomingAssertions: ReturnType<typeof create>['verifyUpcomingAssertions']
  assert: ReturnType<typeof create>['assert']
}
