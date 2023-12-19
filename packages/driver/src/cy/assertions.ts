import _ from 'lodash'
import Promise from 'bluebird'

import $dom from '../dom'
import $errUtils from '../cypress/error_utils'
import type { ICypress } from '../cypress'
import type { $Cy } from '../cypress/cy'

// TODO
// bTagOpen + bTagClosed
// are duplicated in assertions.coffee
const butRe = /,? but\b/
const bTagOpen = /\*\*/g
const bTagClosed = /\*\*/g
const stackTracesRe = / at .*\n/gm

const IS_DOM_TYPES = [$dom.isElement, $dom.isDocument, $dom.isWindow]

const invokeWith = (value) => {
  return (fn) => {
    return fn(value)
  }
}

const functionHadArguments = (current) => {
  const fn = current && current.get('args') && current.get('args')[0]

  return fn && _.isFunction(fn) && (fn.length > 0)
}

const isAssertionType = (cmd) => {
  return cmd && cmd.is('assertion')
}

const isDomSubjectAndMatchesValue = (value, subject) => {
  const allElsAreTheSame = () => {
    const els1 = $dom.getElements(value)
    const els2 = $dom.getElements(subject)

    // no difference
    return _.difference(els1, els2).length === 0
  }

  // iterate through each dom type until we
  // find the function for this particular value
  const isDomTypeFn = _.find(IS_DOM_TYPES, invokeWith(value))

  if (isDomTypeFn) {
    // then check that subject also matches this
    // and that all the els are the same
    return isDomTypeFn(subject) && allElsAreTheSame()
  }

  return false
}

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

export const create = (Cypress: ICypress, cy: $Cy) => {
  const getUpcomingAssertions = () => {
    const index = cy.queue.index + 1

    const assertions: any[] = []

    // grab the rest of the queue'd commands
    for (let cmd of cy.queue.slice(index)) {
      // don't break on utilities, just skip over them
      if (cmd.is('utility')) {
        continue
      }

      // grab all of the queued commands which are
      // assertions and match our current chainerId
      if (cmd.is('assertion')) {
        assertions.push(cmd)
      } else {
        break
      }
    }

    return assertions
  }

  const injectAssertion = (cmd) => {
    return ((subject) => {
      // set assertions to itself or empty array
      if (!cmd.get('assertions')) {
        cmd.set('assertions', [])
      }

      // reset the assertion index back to 0
      // so we can track assertions and merge
      // them up with existing ones
      cmd.set('assertionIndex', 0)

      if (cy.state('current') != null) {
        cy.state('current').set('currentAssertionCommand', cmd)
      }

      return cmd.get('fn').originalFn.apply(
        cy.state('ctx'),
        [subject].concat(cmd.get('args')),
      )
    })
  }

  const assertFn = (passed, message, value, actual, expected, error, verifying = false) => {
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

    // `verifying` represents whether we're deciding whether or not to resolve
    // a command (true) or of we're actually performing a user-facing assertion
    // (false).

    // If we're verifying upcoming assertions (implicit or explicit),
    // then we don't need to take a DOM snapshot - one will be taken later when
    // retries time out or the command otherwise entirely fails or passes.
    // We save the error on _error because we may use it to construct the
    // timeout error which we eventually do display to the user.

    // If we're actually performing an assertion which will be displayed to the
    // user though, then we want to take a DOM snapshot and display this error
    // (if any) in the log message on screen.
    if (verifying) {
      obj._error = error
    } else {
      obj.end = true
      obj.snapshot = true
      obj.error = error
    }

    const isChildLike = (subject, current) => {
      return (value === subject) ||
        isDomSubjectAndMatchesValue(value, subject) ||
        // if our current command is an assertion type
        isAssertionType(current) ||
        // are we currently verifying assertions?
        (cy.state('upcomingAssertions') && cy.state('upcomingAssertions').length > 0) ||
        // did the function have arguments
        functionHadArguments(current)
    }

    _.extend(obj, {
      name: 'assert',
      message,
      passed,
      selector: value ? value.selector : undefined,
      timeout: 0,
      type (current, subject) {
        // if our current command has arguments assume
        // we are an assertion that's involving the current
        // subject or our value is the current subject
        return isChildLike(subject, current) ? 'child' : 'parent'
      },

      consoleProps: () => {
        obj = { name: 'assert' }

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

    // TODO: define the specific type of options
    verifyUpcomingAssertions (subject, options: Record<string, any> = {}, callbacks: VerifyUpcomingAssertionsCallbacks = {}) {
      const cmds = getUpcomingAssertions()

      cy.state('upcomingAssertions', cmds)

      // we're applying the default assertion in the
      // case where there are no upcoming assertion commands
      const isDefaultAssertionErr = cmds.length === 0

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
        cy.state('overrideAssert', undefined)

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

        cy.state('overrideAssert', undefined)
        err.isDefaultAssertionErr = isDefaultAssertionErr

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
            onFail.call(this, err, isDefaultAssertionErr, cmds)
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

      // bail if we have no assertions and apply
      // the default assertions if applicable
      if (!cmds.length) {
        // In general in cypress, when assertions fail we want to take a DOM
        // snapshot to display to the user. In this case though, when we invoke
        // ensureExistence, we're not going to display the error (if there is
        // one) to the user - we're only deciding whether to resolve this current
        // command (assertions pass) or fail (and probably retry). A DOM snapshot
        // isn't necessary in either case - one will be taken later as part of the
        // command (if they pass) or when we time out retrying.

        // Chai assertions have a signature of (passed, message, value, actual,
        // expected, error). Our assertFn, defined earlier in the file, adds
        // on a 7th arg, "verifying", which defaults to false. We here override
        // the assert function with our own, which just invokes the old one
        // with verifying = true. This override is cleaned up immediately
        // afterwards, in either onPassFn or onFailFn.
        cy.state('overrideAssert', function (...args) {
          return assertFn.apply(this, args.concat(true) as any)
        })

        return Promise
        .try(ensureExistence)
        .then(onPassFn)
        .catch(onFailFn)
      }

      const overrideAssert = function (...args) {
        // send verify=true as the last arg
        return assertFn.apply(this, args.concat(true) as any)
      }

      const fns = _.map(cmds, injectAssertion)

      // TODO: remove any when the type of subject, the first argument of this function is specified.
      const subjects: any[] = []

      // iterate through each subject
      // and force the assertion to return
      // this value so it does not get
      // invoked again
      const setSubjectAndSkip = () => {
        subjects.forEach((subject, i) => {
          const cmd = cmds[i]

          cmd.set('subject', subject)
          cmd.skip() // technically this passed because it already ran
        })

        return cmds
      }

      const assertions = (memo, fn, i) => {
        // HACK: bluebird .reduce will not call the callback
        // if given an undefined initial value, so in order to
        // support undefined subjects, we wrap the initial value
        // in an Array and unwrap it if index = 0
        if (i === 0) {
          memo = memo[0]
        }

        return fn(memo).then((subject) => {
          return subjects[i] = subject
        })
      }

      const restore = () => {
        cy.state('upcomingAssertions', [])

        // no matter what we need to
        // restore the assert fn
        return cy.state('overrideAssert', undefined)
      }

      cy.state('overrideAssert', overrideAssert)

      return Promise
      .reduce(fns, assertions, [subject])
      .then(() => {
        restore()

        setSubjectAndSkip()

        finishAssertions()

        return onPassFn()
      })
      .catch((err) => {
        restore()

        // when we're told not to retry
        if (err.retry === false) {
          throw $errUtils.throwErr(err, { onFail: finishAssertions })
        }

        throw err
      })
      .catch(onFailFn)
    },

    assert (...args) {
      // if we've temporarily overridden assertions
      // then just bail early with this function
      const fn = cy.state('overrideAssert') || assertFn

      return fn.apply(this, args)
    },
  }
}

export interface IAssertions {
  verifyUpcomingAssertions: ReturnType<typeof create>['verifyUpcomingAssertions']
  assert: ReturnType<typeof create>['assert']
}
